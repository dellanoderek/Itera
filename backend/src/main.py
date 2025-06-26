from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import hashlib
import os

app = Flask(__name__)

# Configurações
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///agiliza_deploy.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'agiliza-secret-key-production-2025'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Inicialização das extensões
db = SQLAlchemy(app)
cors = CORS(app, origins="*", supports_credentials=True)
jwt = JWTManager(app)

# Modelos de dados
class Department(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    users = db.relationship('User', backref='department', lazy=True)
    tasks = db.relationship('Task', backref='department', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'user_count': len(self.users),
            'task_count': len(self.tasks)
        }

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    avatar_color = db.Column(db.String(7), default='#3B82F6')
    role = db.Column(db.String(50), default='user')  # user, admin, manager
    department_id = db.Column(db.Integer, db.ForeignKey('department.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    def set_password(self, password):
        # Usando hashlib em vez de bcrypt para compatibilidade
        self.password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    
    def check_password(self, password):
        return hashlib.sha256(password.encode('utf-8')).hexdigest() == self.password_hash
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'name': self.name,
            'avatar_color': self.avatar_color,
            'role': self.role,
            'department_id': self.department_id,
            'department': self.department.to_dict() if self.department else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'initials': ''.join([word[0].upper() for word in self.name.split()[:2]])
        }

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default='todo')  # todo, inprogress, done
    priority = db.Column(db.String(20), default='medium')  # low, medium, high
    task_type = db.Column(db.String(50), default='task')  # task, bug, story
    key = db.Column(db.String(20), unique=True, nullable=False)
    
    # Relacionamentos
    assignee_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('department.id'), nullable=False)
    
    assignee = db.relationship('User', foreign_keys=[assignee_id], backref='assigned_tasks')
    creator = db.relationship('User', foreign_keys=[creator_id], backref='created_tasks')
    
    # Datas
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'task_type': self.task_type,
            'key': self.key,
            'assignee_id': self.assignee_id,
            'creator_id': self.creator_id,
            'department_id': self.department_id,
            'assignee': self.assignee.to_dict() if self.assignee else None,
            'creator': self.creator.to_dict() if self.creator else None,
            'department': self.department.to_dict() if self.department else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

# Rotas de autenticação
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validações
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Nome de usuário já existe'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email já existe'}), 400
    
    # Verificar se o departamento existe
    department = Department.query.get(data['department_id'])
    if not department:
        return jsonify({'error': 'Departamento não encontrado'}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        name=data['name'],
        department_id=data['department_id'],
        avatar_color=data.get('avatar_color', '#3B82F6')
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    access_token = create_access_token(identity=user.id)
    return jsonify({
        'access_token': access_token,
        'user': user.to_dict()
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if user and user.check_password(data['password']) and user.is_active:
        # Atualizar último login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        })
    
    return jsonify({'error': 'Credenciais inválidas'}), 401

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or not user.is_active:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    return jsonify(user.to_dict())

@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({'message': 'Logout realizado com sucesso'})

# Rotas de departamentos
@app.route('/api/departments', methods=['GET'])
def get_departments():
    departments = Department.query.all()
    return jsonify([dept.to_dict() for dept in departments])

# Rotas de usuários
@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    user_id = get_jwt_identity()
    current_user = User.query.get(user_id)
    
    # Usuários só podem ver outros usuários do mesmo departamento
    if current_user.role == 'admin':
        users = User.query.filter_by(is_active=True).all()
    else:
        users = User.query.filter_by(
            department_id=current_user.department_id,
            is_active=True
        ).all()
    
    return jsonify([user.to_dict() for user in users])

# Rotas de tarefas
@app.route('/api/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    user_id = get_jwt_identity()
    current_user = User.query.get(user_id)
    
    # Filtros
    status = request.args.get('status')
    assignee_id = request.args.get('assignee_id')
    
    # Base query - usuários só veem tarefas do seu departamento
    if current_user.role == 'admin':
        query = Task.query
    else:
        query = Task.query.filter_by(department_id=current_user.department_id)
    
    if status:
        query = query.filter_by(status=status)
    if assignee_id:
        query = query.filter_by(assignee_id=assignee_id)
    
    tasks = query.order_by(Task.created_at.desc()).all()
    return jsonify([task.to_dict() for task in tasks])

@app.route('/api/tasks', methods=['POST'])
@jwt_required()
def create_task():
    user_id = get_jwt_identity()
    current_user = User.query.get(user_id)
    data = request.get_json()
    
    # Gerar chave única para a tarefa baseada no departamento
    dept_prefix = current_user.department.name[:3].upper()
    task_count = Task.query.filter_by(department_id=current_user.department_id).count()
    key = f"{dept_prefix}-{task_count + 1}"
    
    task = Task(
        title=data['title'],
        description=data.get('description', ''),
        status=data.get('status', 'todo'),
        priority=data.get('priority', 'medium'),
        task_type=data.get('task_type', 'task'),
        key=key,
        assignee_id=data.get('assignee_id'),
        creator_id=user_id,
        department_id=current_user.department_id
    )
    
    db.session.add(task)
    db.session.commit()
    
    return jsonify(task.to_dict()), 201

@app.route('/api/tasks/<int:task_id>/move', methods=['PUT'])
@jwt_required()
def move_task(task_id):
    user_id = get_jwt_identity()
    current_user = User.query.get(user_id)
    
    task = Task.query.get_or_404(task_id)
    
    # Verificar permissão
    if task.department_id != current_user.department_id and current_user.role != 'admin':
        return jsonify({'error': 'Acesso negado'}), 403
    
    data = request.get_json()
    
    task.status = data['status']
    task.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(task.to_dict())

# Rotas do dashboard
@app.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    user_id = get_jwt_identity()
    current_user = User.query.get(user_id)
    
    # Base query - filtrar por departamento
    if current_user.role == 'admin':
        base_query = Task.query
    else:
        base_query = Task.query.filter_by(department_id=current_user.department_id)
    
    # Estatísticas por status
    status_stats = {
        'todo': base_query.filter_by(status='todo').count(),
        'inprogress': base_query.filter_by(status='inprogress').count(),
        'done': base_query.filter_by(status='done').count()
    }
    
    # Estatísticas por tipo
    type_stats = {
        'task': base_query.filter_by(task_type='task').count(),
        'bug': base_query.filter_by(task_type='bug').count(),
        'story': base_query.filter_by(task_type='story').count()
    }
    
    # Estatísticas por prioridade
    priority_stats = {
        'low': base_query.filter_by(priority='low').count(),
        'medium': base_query.filter_by(priority='medium').count(),
        'high': base_query.filter_by(priority='high').count()
    }
    
    # Carga de trabalho por usuário
    workload_stats = {}
    if current_user.role == 'admin':
        users = User.query.filter_by(is_active=True).all()
    else:
        users = User.query.filter_by(
            department_id=current_user.department_id,
            is_active=True
        ).all()
    
    for user in users:
        assigned_count = base_query.filter_by(assignee_id=user.id).count()
        if assigned_count > 0:
            workload_stats[user.name] = assigned_count
    
    # Atividades recentes
    recent_activities = []
    recent_tasks = base_query.order_by(Task.updated_at.desc()).limit(10).all()
    for task in recent_tasks:
        activity = {
            'task_key': task.key,
            'task_title': task.title,
            'status': task.status,
            'assignee': task.assignee.name if task.assignee else 'Não atribuído',
            'updated_at': task.updated_at.isoformat()
        }
        recent_activities.append(activity)
    
    return jsonify({
        'status_stats': status_stats,
        'type_stats': type_stats,
        'priority_stats': priority_stats,
        'workload_stats': workload_stats,
        'recent_activities': recent_activities,
        'total_tasks': base_query.count(),
        'department': current_user.department.to_dict() if current_user.department else None
    })

# Rota de saúde da API
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Agiliza API funcionando corretamente'})

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': 'Agiliza API - Sistema de Gerenciamento de Projetos',
        'version': '1.0.0',
        'status': 'online'
    })

# Inicialização do banco de dados
def init_db():
    db.create_all()
    
    # Criar departamentos padrão se não existirem
    if Department.query.count() == 0:
        departments = [
            Department(name='Tecnologia', description='Departamento de TI e Desenvolvimento'),
            Department(name='Marketing', description='Departamento de Marketing e Vendas'),
            Department(name='Recursos Humanos', description='Departamento de RH'),
            Department(name='Financeiro', description='Departamento Financeiro')
        ]
        
        for dept in departments:
            db.session.add(dept)
        
        db.session.commit()
        
        # Criar usuários de exemplo
        users = [
            User(username='admin', email='admin@empresa.com', name='Administrador', 
                 role='admin', department_id=1, avatar_color='#EF4444'),
            User(username='joao.silva', email='joao@empresa.com', name='João Silva', 
                 role='user', department_id=1, avatar_color='#3B82F6'),
            User(username='maria.santos', email='maria@empresa.com', name='Maria Santos', 
                 role='manager', department_id=2, avatar_color='#10B981'),
            User(username='pedro.oliveira', email='pedro@empresa.com', name='Pedro Oliveira', 
                 role='user', department_id=1, avatar_color='#F59E0B'),
            User(username='ana.costa', email='ana@empresa.com', name='Ana Costa', 
                 role='user', department_id=3, avatar_color='#8B5CF6')
        ]
        
        for user in users:
            user.set_password('123456')  # Senha padrão para demonstração
            db.session.add(user)
        
        db.session.commit()
        
        # Criar tarefas de exemplo
        tasks = [
            Task(title='Configurar ambiente de desenvolvimento', description='Configurar o ambiente local para desenvolvimento da aplicação',
                 status='done', priority='high', task_type='task', key='TEC-1', assignee_id=2, creator_id=1, department_id=1),
            Task(title='Implementar quadro Kanban', description='Desenvolver a interface do quadro Kanban com drag and drop',
                 status='inprogress', priority='high', task_type='story', key='TEC-2', assignee_id=2, creator_id=1, department_id=1),
            Task(title='Corrigir bug no carregamento de dados', description='Resolver problema de lentidão no carregamento das tarefas',
                 status='todo', priority='medium', task_type='bug', key='TEC-3', assignee_id=4, creator_id=2, department_id=1),
            Task(title='Criar campanha de marketing', description='Desenvolver nova campanha para redes sociais',
                 status='inprogress', priority='high', task_type='story', key='MAR-1', assignee_id=3, creator_id=3, department_id=2),
            Task(title='Análise de performance de vendas', description='Relatório mensal de vendas e conversões',
                 status='todo', priority='medium', task_type='task', key='MAR-2', assignee_id=3, creator_id=3, department_id=2),
            Task(title='Processo de onboarding', description='Criar processo de integração para novos funcionários',
                 status='todo', priority='low', task_type='story', key='RH-1', assignee_id=5, creator_id=5, department_id=3)
        ]
        
        for task in tasks:
            db.session.add(task)
        
        db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        init_db()
    
    app.run(host='0.0.0.0', port=5000, debug=True)

