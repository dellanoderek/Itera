import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Avatar, AvatarFallback } from '@/components/ui/avatar.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Plus, MoreHorizontal, Search, Filter, BarChart3, Kanban, TrendingUp, Users, Clock, AlertCircle, LogOut, User } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import './App.css'

// API base URL
const API_BASE = 'http://localhost:5000/api'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [currentView, setCurrentView] = useState('kanban') // kanban ou dashboard
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [dashboardStats, setDashboardStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [draggedTask, setDraggedTask] = useState(null)

  // Estados para autenticação
  const [authMode, setAuthMode] = useState('login') // login ou register
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  // Verificar autenticação ao carregar
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      validateToken(token)
    } else {
      setLoading(false)
    }
  }, [])

  // Carregar dados quando autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadTasks()
      loadUsers()
      loadDepartments()
      if (currentView === 'dashboard') {
        loadDashboardStats()
      }
    }
  }, [isAuthenticated, currentView])

  const validateToken = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('access_token')
      }
    } catch (error) {
      console.error('Erro ao validar token:', error)
      localStorage.removeItem('access_token')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (formData) => {
    setAuthLoading(true)
    setAuthError('')
    
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        localStorage.setItem('access_token', data.access_token)
        setCurrentUser(data.user)
        setIsAuthenticated(true)
      } else {
        setAuthError(data.error || 'Erro ao fazer login')
      }
    } catch (error) {
      setAuthError('Erro de conexão. Tente novamente.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRegister = async (formData) => {
    setAuthLoading(true)
    setAuthError('')
    
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        localStorage.setItem('access_token', data.access_token)
        setCurrentUser(data.user)
        setIsAuthenticated(true)
      } else {
        setAuthError(data.error || 'Erro ao criar conta')
      }
    } catch (error) {
      setAuthError('Erro de conexão. Tente novamente.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    } finally {
      localStorage.removeItem('access_token')
      setCurrentUser(null)
      setIsAuthenticated(false)
      setTasks([])
      setUsers([])
      setDashboardStats(null)
    }
  }

  const loadTasks = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    }
  }

  const loadDepartments = async () => {
    try {
      const response = await fetch(`${API_BASE}/departments`)
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      }
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error)
    }
  }

  const loadDashboardStats = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDashboardStats(data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  // Mover tarefa entre colunas
  const moveTask = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE}/tasks/${taskId}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        const updatedTask = await response.json()
        setTasks(tasks.map(task => 
          task.id === taskId ? updatedTask : task
        ))
      }
    } catch (error) {
      console.error('Erro ao mover tarefa:', error)
    }
  }

  // Handlers de drag and drop
  const handleDragStart = (e, task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, newStatus) => {
    e.preventDefault()
    if (draggedTask && draggedTask.status !== newStatus) {
      moveTask(draggedTask.id, newStatus)
    }
    setDraggedTask(null)
  }

  // Componente de Login/Registro
  const AuthForm = () => {
    const [formData, setFormData] = useState({
      username: '',
      password: '',
      name: '',
      email: '',
      department_id: ''
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      if (authMode === 'login') {
        handleLogin(formData)
      } else {
        handleRegister(formData)
      }
    }

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">
              Agiliza
            </CardTitle>
            <p className="text-muted-foreground">
              {authMode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
            </p>
          </CardHeader>
          <CardContent>
            {authError && (
              <Alert className="mb-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'register' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Select onValueChange={(value) => handleChange('department_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={authLoading}>
                {authLoading ? 'Carregando...' : 
                 authMode === 'login' ? 'Entrar' : 'Criar Conta'}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login')
                  setAuthError('')
                  setFormData({
                    username: '',
                    password: '',
                    name: '',
                    email: '',
                    department_id: ''
                  })
                }}
              >
                {authMode === 'login' ? 
                  'Não tem conta? Criar conta' : 
                  'Já tem conta? Fazer login'}
              </Button>
            </div>

            {authMode === 'login' && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Contas de teste:</p>
                <div className="text-xs space-y-1">
                  <p><strong>Admin:</strong> admin / 123456</p>
                  <p><strong>Usuário TI:</strong> joao.silva / 123456</p>
                  <p><strong>Gerente Marketing:</strong> maria.santos / 123456</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Componente do Card de Tarefa
  const TaskCard = ({ task }) => {
    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'high': return 'bg-red-500'
        case 'medium': return 'bg-yellow-500'
        case 'low': return 'bg-green-500'
        default: return 'bg-gray-500'
      }
    }

    const getTypeIcon = (type) => {
      switch (type) {
        case 'bug': return '🐛'
        case 'story': return '📖'
        case 'task': return '✅'
        default: return '📋'
      }
    }

    return (
      <Card 
        className="mb-3 cursor-move hover:shadow-md transition-shadow"
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">{getTypeIcon(task.task_type)}</span>
              <Badge variant="outline" className="text-xs">
                {task.key}
              </Badge>
            </div>
            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
          </div>
          
          <h4 className="font-medium text-sm mb-2 line-clamp-2">
            {task.title}
          </h4>
          
          {task.description && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            {task.assignee && (
              <Avatar className="h-6 w-6">
                <AvatarFallback 
                  className="text-xs"
                  style={{ backgroundColor: task.assignee.avatar_color }}
                >
                  {task.assignee.initials}
                </AvatarFallback>
              </Avatar>
            )}
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Componente da Coluna Kanban
  const KanbanColumn = ({ title, status, tasks, count }) => (
    <div className="flex-1 min-w-80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            {title}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div 
        className="min-h-96 p-2 rounded-lg border-2 border-dashed border-muted-foreground/20 transition-colors"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, status)}
      >
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )

  // Componente do Header
  const Header = () => (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-primary">Agiliza</h1>
            <nav className="flex items-center gap-1">
              <Button 
                variant={currentView === 'kanban' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setCurrentView('kanban')}
                className="gap-2"
              >
                <Kanban className="h-4 w-4" />
                Quadro
              </Button>
              <Button 
                variant={currentView === 'dashboard' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setCurrentView('dashboard')}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Resumo
              </Button>
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Search className="h-4 w-4" />
              Pesquisar
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtrar
            </Button>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Criar
            </Button>
            
            {/* User Menu */}
            <div className="flex items-center gap-2 ml-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback 
                  style={{ backgroundColor: currentUser?.avatar_color }}
                >
                  {currentUser?.initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{currentUser?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {currentUser?.department?.name}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )

  // Componente do Quadro Kanban
  const KanbanBoard = () => {
    const todoTasks = tasks.filter(task => task.status === 'todo')
    const inProgressTasks = tasks.filter(task => task.status === 'inprogress')
    const doneTasks = tasks.filter(task => task.status === 'done')

    return (
      <div className="container mx-auto px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Quadro Kanban</h2>
          <p className="text-muted-foreground">
            Departamento: {currentUser?.department?.name}
            {currentUser?.role === 'admin' && ' (Visualização completa)'}
          </p>
        </div>
        
        <div className="flex gap-6 overflow-x-auto pb-6">
          <KanbanColumn 
            title="A Fazer" 
            status="todo" 
            tasks={todoTasks} 
            count={todoTasks.length}
          />
          <KanbanColumn 
            title="Em Progresso" 
            status="inprogress" 
            tasks={inProgressTasks} 
            count={inProgressTasks.length}
          />
          <KanbanColumn 
            title="Concluído" 
            status="done" 
            tasks={doneTasks} 
            count={doneTasks.length}
          />
        </div>
      </div>
    )
  }

  // Componente do Dashboard
  const Dashboard = () => {
    if (!dashboardStats) {
      return (
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando estatísticas...</p>
            </div>
          </div>
        </div>
      )
    }

    // Dados para gráfico de pizza - Status
    const statusData = [
      { name: 'A Fazer', value: dashboardStats.status_stats.todo, color: '#3B82F6' },
      { name: 'Em Progresso', value: dashboardStats.status_stats.inprogress, color: '#F59E0B' },
      { name: 'Concluído', value: dashboardStats.status_stats.done, color: '#10B981' }
    ]

    // Dados para gráfico de barras - Tipos
    const typeData = [
      { name: 'Tarefas', value: dashboardStats.type_stats.task, color: '#3B82F6' },
      { name: 'Bugs', value: dashboardStats.type_stats.bug, color: '#EF4444' },
      { name: 'Histórias', value: dashboardStats.type_stats.story, color: '#8B5CF6' }
    ]

    // Dados para gráfico de barras - Prioridade
    const priorityData = [
      { name: 'Baixa', value: dashboardStats.priority_stats.low, color: '#10B981' },
      { name: 'Média', value: dashboardStats.priority_stats.medium, color: '#F59E0B' },
      { name: 'Alta', value: dashboardStats.priority_stats.high, color: '#EF4444' }
    ]

    // Dados para carga de trabalho
    const workloadData = Object.entries(dashboardStats.workload_stats).map(([name, value]) => ({
      name: name.split(' ')[0], // Apenas primeiro nome
      value
    }))

    return (
      <div className="container mx-auto px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">
            {dashboardStats.department ? 
              `Departamento: ${dashboardStats.department.name}` :
              'Visualização geral (Admin)'
            }
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.total_tasks}</div>
              <p className="text-xs text-muted-foreground">
                Todas as tarefas do {dashboardStats.department ? 'departamento' : 'sistema'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Fazer</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {dashboardStats.status_stats.todo}
              </div>
              <p className="text-xs text-muted-foreground">
                Tarefas pendentes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {dashboardStats.status_stats.inprogress}
              </div>
              <p className="text-xs text-muted-foreground">
                Tarefas em andamento
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluído</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dashboardStats.status_stats.done}
              </div>
              <p className="text-xs text-muted-foreground">
                Tarefas finalizadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Status */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {statusData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.name} ({item.value})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Tipos */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Tarefas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Segunda linha de gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Prioridades */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Prioridade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Carga de Trabalho */}
          <Card>
            <CardHeader>
              <CardTitle>Carga de Trabalho da Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workloadData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Atividades Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats.recent_activities.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{activity.task_key}</Badge>
                    <div>
                      <p className="font-medium text-sm">{activity.task_title}</p>
                      <p className="text-xs text-muted-foreground">
                        Atribuído a: {activity.assignee}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        activity.status === 'done' ? 'default' : 
                        activity.status === 'inprogress' ? 'secondary' : 'outline'
                      }
                    >
                      {activity.status === 'done' ? 'Concluído' : 
                       activity.status === 'inprogress' ? 'Em Progresso' : 'A Fazer'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.updated_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading inicial
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Mostrar tela de login se não autenticado
  if (!isAuthenticated) {
    return <AuthForm />
  }

  // Aplicação principal
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {currentView === 'kanban' ? <KanbanBoard /> : <Dashboard />}
    </div>
  )
}

export default App

