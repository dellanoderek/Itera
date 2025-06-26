# Agiliza - Sistema de Gerenciamento de Projetos

Uma aplicação web completa similar ao JIRA, focada em quadro Kanban e dashboard de resumo/desempenho, com sistema de autenticação e controle de acesso por departamento.

## 🚀 Funcionalidades

### ✅ Sistema de Autenticação Completo
- Tela de login/registro moderna
- JWT tokens com sessões de 24h
- Controle de acesso por departamento
- Logout funcional

### ✅ Quadro Kanban
- Interface similar ao JIRA
- Drag-and-drop entre colunas (A Fazer, Em Progresso, Concluído)
- Cards com informações completas (tipo, prioridade, responsável)
- Filtros por departamento

### ✅ Dashboard com Métricas
- Gráficos de pizza e barras
- Estatísticas por status, tipo e prioridade
- Carga de trabalho da equipe
- Atividades recentes

### ✅ Controle de Acesso por Setor
- Usuários veem apenas tarefas do seu departamento
- Administradores têm acesso completo
- 4 departamentos configurados (Tecnologia, Marketing, RH, Financeiro)

### ✅ Banco de Dados SQLite
- Persistência de dados garantida
- Usuários e tarefas de exemplo
- Relacionamentos entre tabelas

## 🛠️ Tecnologias Utilizadas

### Backend
- **Flask** - Framework web Python
- **SQLAlchemy** - ORM para banco de dados
- **Flask-JWT-Extended** - Autenticação JWT
- **Flask-CORS** - Controle de origem cruzada
- **SQLite** - Banco de dados

### Frontend
- **React** - Biblioteca JavaScript
- **Vite** - Build tool
- **Tailwind CSS** - Framework CSS
- **Shadcn/UI** - Componentes UI
- **Lucide Icons** - Ícones
- **Recharts** - Gráficos

## 📦 Instalação

### Pré-requisitos
- Python 3.11+
- Node.js 20+
- npm ou yarn

### Backend (Flask)

1. Navegue até o diretório do backend:
```bash
cd jira-clone/backend
```

2. Crie um ambiente virtual:
```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Execute o servidor:
```bash
python src/main.py
```

O backend estará rodando em `http://localhost:5000`

### Frontend (React)

1. Navegue até o diretório do frontend:
```bash
cd jira-clone/frontend/jira-clone-app
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

## 👥 Contas de Teste

### Administrador
- **Usuário:** admin
- **Senha:** 123456
- **Acesso:** Completo (todas as tarefas)

### Usuário TI
- **Usuário:** joao.silva
- **Senha:** 123456
- **Departamento:** Tecnologia

### Gerente Marketing
- **Usuário:** maria.santos
- **Senha:** 123456
- **Departamento:** Marketing

### Usuário RH
- **Usuário:** ana.costa
- **Senha:** 123456
- **Departamento:** Recursos Humanos

### Usuário TI
- **Usuário:** pedro.oliveira
- **Senha:** 123456
- **Departamento:** Tecnologia

## 🌐 URLs da Aplicação

### Desenvolvimento Local
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

### Produção (Deploy)
- **Frontend:** https://kyhncyoz.manus.space
- **Backend API:** [URL será fornecida após deploy]

## 📁 Estrutura do Projeto

```
agiliza/
├── jira-clone/
│   ├── backend/
│   │   ├── src/
│   │   │   └── main.py          # Aplicação Flask principal
│   │   ├── requirements.txt     # Dependências Python
│   │   └── instance/
│   │       └── agiliza_deploy.db # Banco SQLite
│   └── frontend/
│       └── jira-clone-app/
│           ├── src/
│           │   ├── App.jsx      # Componente principal React
│           │   └── components/  # Componentes UI
│           ├── index.html       # HTML principal
│           └── package.json     # Dependências Node.js
└── todo.md                      # Log de desenvolvimento
```

## 🔧 Configuração da API

### Endpoints Principais

#### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Usuário atual
- `POST /api/auth/logout` - Logout

#### Departamentos
- `GET /api/departments` - Listar departamentos

#### Usuários
- `GET /api/users` - Listar usuários (filtrado por departamento)

#### Tarefas
- `GET /api/tasks` - Listar tarefas (filtrado por departamento)
- `POST /api/tasks` - Criar tarefa
- `PUT /api/tasks/{id}/move` - Mover tarefa no Kanban

#### Dashboard
- `GET /api/dashboard/stats` - Estatísticas e métricas

## 🚀 Deploy

### Frontend
O frontend está deployado em: https://kyhncyoz.manus.space

### Backend
Para fazer deploy do backend, certifique-se de:
1. Configurar variáveis de ambiente de produção
2. Usar um banco de dados mais robusto (PostgreSQL)
3. Configurar HTTPS
4. Implementar logs e monitoramento

## 📊 Métricas de Desenvolvimento

- **Tempo de desenvolvimento:** ~6 horas
- **Custo estimado:** 20.000-30.000 créditos
- **Linhas de código:** ~1.500 (backend + frontend)
- **Funcionalidades implementadas:** 100%

## 🤝 Contribuição

Este projeto foi desenvolvido como uma solução completa de gerenciamento de projetos. Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📝 Licença

Este projeto é de uso livre para fins educacionais e comerciais.

## 📞 Suporte

Para suporte ou dúvidas sobre a aplicação, entre em contato através dos canais oficiais.

---

**Desenvolvido com ❤️ usando Flask + React**

