from flask import Flask, send_file, render_template, request, redirect, url_for, g, jsonify, flash, session, make_response
from flask import after_this_request
import sqlite3
from flask_paginate import Pagination, get_page_parameter
from flask_socketio import SocketIO
from datetime import datetime
import pytz
import pyttsx3
import pyodbc
import pygame
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, login_user, logout_user, current_user, login_required
import os
from weasyprint import HTML, CSS
import pandas as pd
import tempfile
from functools import wraps  # Importa wraps do módulo functools
from flask import abort      # Importa abort do Flask
import eventlet
import eventlet.wsgi

app = Flask(__name__, static_folder='static')
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode='gevent', cors_allowed_origins='*')
DATABASE = 'app.db'

BRASILIA_TZ = pytz.timezone('America/Sao_Paulo')

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

UPLOAD_DIR = os.path.join('static', 'uploads')
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


# Decorador para verificar se o usuário é admin
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            # Se o usuário não é admin ou não está autenticado, retorna erro 403 (Proibido)
            abort(403)
        return f(*args, **kwargs)
    return decorated_function



def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    db = get_db()
    cursor = db.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            ticket_number TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            called_at TIMESTAMP,
            concluded_at TIMESTAMP,
            status TEXT DEFAULT 'ESPERA',
            stage TEXT DEFAULT 'RH',
            guiche TEXT,
            priority INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            cpf TEXT,
            cep TEXT,
            rua TEXT,
            numero TEXT,
            complemento TEXT,
            bairro TEXT,
            cidade TEXT,
            telefones TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS registration_form (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cpf TEXT NOT NULL UNIQUE,
            nome_completo TEXT,
            estado_civil TEXT,
            cargo_pretendido TEXT,
            cep TEXT,
            endereco TEXT,
            numero TEXT,
            complemento TEXT,
            bairro TEXT,
            cidade TEXT,
            estado_nasc TEXT,
            cidade_nasc TEXT,
            data_nasc TEXT,
            idade TEXT,
            numero_filhos TEXT,
            fumante TEXT,
            bebida TEXT,
            alergia TEXT,
            medicamento_constante TEXT,
            qual_medicamento TEXT,
            genero TEXT,
            peso TEXT,
            cor_pele TEXT,
            tatuagem TEXT,
            perfil TEXT,
            cargo_indicado TEXT,
            identidade TEXT,
            cursos_realizados TEXT,
            regioes_preferencia TEXT,
            disponibilidade_horario TEXT,
            empresa1 TEXT,
            cidade1 TEXT,
            funcao1 TEXT,
            data_admissao1 TEXT,
            data_saida1 TEXT,
            motivo_saida1 TEXT,
            salario1 TEXT,
            empresa2 TEXT,
            cidade2 TEXT,
            funcao2 TEXT,
            data_admissao2 TEXT,
            data_saida2 TEXT,
            motivo_saida2 TEXT,
            salario2 TEXT,
            empresa3 TEXT,
            cidade3 TEXT,
            funcao3 TEXT,
            data_admissao3 TEXT,
            data_saida3 TEXT,
            motivo_saida3 TEXT,
            salario3 TEXT,
            empregos_informais TEXT,
            nome_entrevistador TEXT,
            avaliacao_rh TEXT,
            assinatura_rh TEXT,
            avaliacao_gerencia TEXT,
            assinatura_gerencia TEXT,
            rota_trabalho TEXT,
            curriculo TEXT,
            situacao TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS interview_candidates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cpf TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    db.commit()

@login_manager.user_loader
def load_user(user_id):
    db = get_db()
    user_row = db.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    if user_row:
        return User(user_row['id'], user_row['username'], user_row['name'], user_row['email'], user_row['password'], user_row['is_admin'])
    return None

class User:
    def __init__(self, id, username, name, email, password, is_admin):
        self.id = id
        self.username = username
        self.name = name
        self.email = email
        self.password = password
        self.is_admin = is_admin

    def is_active(self):
        return True

    def is_authenticated(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return str(self.id)


@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    else:
        return redirect(url_for('login'))

@app.route('/home')
@login_required
def home():
    return render_template('home.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        db = get_db()
        user_row = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()

        if user_row and check_password_hash(user_row['password'], password):
            user = User(user_row['id'], user_row['username'], user_row['name'], user_row['email'], user_row['password'], user_row['is_admin'])
            session.clear()
            session['user_id'] = user.id  # Armazena o ID do usuário na sessão
            login_user(user)  # Autentica o usuário com Flask-Login
            return redirect(url_for('home'))  # Redireciona para a página principal
        
        # Se as credenciais forem inválidas, exibe a mensagem de erro
        flash('Credenciais inválidas. Tente novamente.', 'danger')

    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    session.clear()
    flash('Desconectado com sucesso!', 'success')
    return redirect(url_for('login'))


@app.route('/account_settings', methods=['GET', 'POST'])
@login_required
def account_settings():
    db = get_db()  # Conecta ao banco de dados

    if request.method == 'POST':
        # Obtenha os dados do formulário
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']

        # Verifica se as senhas coincidem
        if password and password != confirm_password:
            flash('As senhas não coincidem. Por favor, tente novamente.', 'danger')
            return redirect(url_for('account_settings'))

        # Atualiza o nome e e-mail no banco de dados
        db.execute('UPDATE users SET name = ?, email = ? WHERE id = ?', (name, email, current_user.id))

        # Atualiza a senha se for fornecida
        if password:
            hashed_password = generate_password_hash(password)
            db.execute('UPDATE users SET password = ? WHERE id = ?', (hashed_password, current_user.id))

        # Salva as alterações no banco de dados
        db.commit()
        flash('Configurações atualizadas com sucesso!', 'success')
        return redirect(url_for('account_settings'))

    return render_template('account_settings.html')


@app.route('/admin_dashboard')
@login_required
def admin_dashboard():
    if not current_user.is_admin:
        flash("Acesso negado. Apenas administradores podem acessar esta página.", "danger")
        return redirect(url_for('home'))

    db = get_db()
    users = db.execute('SELECT * FROM users').fetchall()

    return render_template('admin_dashboard.html', users=users)

@app.route('/add_user', methods=['POST'])
@login_required
@admin_required
def add_user():
    db = get_db()

    if not current_user.is_admin:
        return redirect(url_for('home'))

    # Obtenha os dados do formulário
    username = request.form['username']
    name = request.form['name']
    email = request.form['email']
    password = generate_password_hash(request.form['password'])
    is_admin = 'is_admin' in request.form

    # Adiciona o novo usuário ao banco de dados (não precisa incluir o ID, o SQLite gera automaticamente)
    db.execute('''
        INSERT INTO users (username, name, email, password, is_admin) 
        VALUES (?, ?, ?, ?, ?)
    ''', (username, name, email, password, is_admin))
    db.commit()

    flash('Usuário adicionado com sucesso!', 'success')
    return redirect(url_for('manage_users'))


@app.route('/edit_user/<int:user_id>', methods=['GET', 'POST'])
@login_required
def edit_user(user_id):
    db = get_db()
    if not current_user.is_admin:
        return redirect(url_for('home'))

    # Busca o usuário com o id fornecido diretamente no banco de dados
    user = db.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()

    if not user:
        flash('Usuário não encontrado.', 'danger')
        return redirect(url_for('manage_users'))

    if request.method == 'POST':
        # Atualiza os dados do usuário
        username = request.form['username']
        name = request.form['name']
        email = request.form['email']
        is_admin = 'is_admin' in request.form

        # Atualiza os dados no banco
        db.execute('UPDATE users SET username = ?, name = ?, email = ?, is_admin = ? WHERE id = ?',
                   (username, name, email, is_admin, user_id))
        db.commit()

        flash('Usuário atualizado com sucesso!', 'success')
        return redirect(url_for('manage_users'))

    return render_template('edit_user.html', user=user)

@app.route('/view_logs')
@login_required
def view_logs():
    if not current_user.is_admin:
        flash("Acesso negado. Apenas administradores podem acessar os logs.", "danger")
        return redirect(url_for('home'))

    db = get_db()
    logs = db.execute('SELECT * FROM user_logs').fetchall()

    return render_template('view_logs.html', logs=logs)

@app.route('/delete_user/<int:user_id>', methods=['POST'])
@login_required
def delete_user(user_id):
    db = get_db()

    # Verifica se o usuário existe
    user = db.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()

    if not user:
        flash('Usuário não encontrado.', 'danger')
        return redirect(url_for('manage_users'))

    # Deleta o usuário do banco de dados
    db.execute('DELETE FROM users WHERE id = ?', (user_id,))
    db.commit()

    flash('Usuário excluído com sucesso!', 'success')
    return redirect(url_for('manage_users'))

from datetime import datetime

@app.route('/painel')
@login_required
def painel():
    db = get_db()
    
    today = datetime.now().date()  # Obtém a data atual

    # Tickets em espera do dia, ordenados pela data e hora de criação
    waiting_tickets = db.execute(
        'SELECT * FROM tickets WHERE status = "ESPERA" AND DATE(created_at) = ? ORDER BY created_at',
        (today,)
    ).fetchall()
    
    # Tickets chamados do dia, ordenados pela data e hora de chamado
    called_tickets = db.execute(
        'SELECT * FROM tickets WHERE status = "CHAMADO" AND DATE(called_at) = ? ORDER BY called_at',
        (today,)
    ).fetchall()
    
    # Tickets concluídos do dia, ordenados pela data e hora de conclusão
    concluded_tickets = db.execute(
        'SELECT * FROM tickets WHERE status = "CONCLUIDO" AND DATE(concluded_at) = ? ORDER BY concluded_at',
        (today,)
    ).fetchall()

    total_tickets = db.execute('SELECT COUNT(*) FROM tickets WHERE DATE(created_at) = ?', (today,)).fetchone()[0]
    total_concluido = db.execute('SELECT COUNT(*) FROM tickets WHERE status = "CONCLUIDO" AND DATE(concluded_at) = ?', (today,)).fetchone()[0]

    categories = ['Admissão', 'Demissão', 'Entrevista', 'Agendado', 'Treinamento', 'Documentação', 'Outros']
    wait_times = {category: [] for category in categories}
    service_times = {category: [] for category in categories}

    # Calculando tempo de espera
    for ticket in called_tickets:
        if ticket['called_at'] and ticket['created_at']:
            try:
                called_at = datetime.strptime(ticket['called_at'], '%Y-%m-%d %H:%M:%S')
            except ValueError:
                called_at = datetime.strptime(ticket['called_at'], '%H:%M:%S')

            created_at = datetime.strptime(ticket['created_at'], '%Y-%m-%d %H:%M:%S')
            wait_time = (called_at - created_at).total_seconds()
            if wait_time > 0:
                wait_times[ticket['category']].append(wait_time)

    # Calculando tempo de serviço
    for ticket in concluded_tickets:
        if ticket['concluded_at'] and ticket['called_at']:
            try:
                called_at = datetime.strptime(ticket['called_at'], '%Y-%m-%d %H:%M:%S')
            except ValueError:
                called_at = datetime.strptime(ticket['called_at'], '%H:%M:%S')

            concluded_at = datetime.strptime(ticket['concluded_at'], '%Y-%m-%d %H:%M:%S')
            service_time = (concluded_at - called_at).total_seconds()
            if service_time > 0:
                service_times.setdefault(ticket['category'], []).append(service_time)

    average_wait_times = {category: format_time(calculate_average_time(wait_times[category])) for category in categories}
    average_service_times = {category: format_time(calculate_average_time(service_times[category])) for category in categories}

    counts = {category: db.execute(f'SELECT COUNT(*) FROM tickets WHERE category = ? AND status = "ESPERA" AND DATE(created_at) = ?', (category, today)).fetchone()[0] for category in categories}

    # Incluindo o campo especificacao nos tickets de espera
    waiting_tickets = [
        {
            'ticket_number': ticket['ticket_number'],
            'name': ticket['name'],
            'category': ticket['category'],
            'priority': ticket['priority'],
            'id': ticket['id'],
            'created_at': ticket['created_at'],
            'called_at': ticket['called_at'] if ticket['called_at'] else 'Não chamado',
            'concluded_at': ticket['concluded_at'] if ticket['concluded_at'] else 'Não concluído',
            'stage': ticket['stage'],
            'guiche': ticket['guiche'],
            'especificacao': dict(ticket).get('especificacao', ''),
            'agendado_com': ticket['recruiter'] if ticket['category'] == 'Agendado' else None  # Adiciona com quem está agendado
        }
        for ticket in waiting_tickets
    ]

    # Incluindo o campo especificacao nos tickets chamados
    called_tickets = [
        {
            'ticket_number': ticket['ticket_number'],
            'name': ticket['name'],
            'category': ticket['category'],
            'priority': ticket['priority'],
            'guiche': ticket['guiche'],
            'id': ticket['id'],
            'created_at': ticket['created_at'],
            'called_at': ticket['called_at'] if ticket['called_at'] else 'Não chamado',
            'concluded_at': ticket['concluded_at'] if ticket['concluded_at'] else 'Não concluído',
            'stage': ticket['stage'],
            'especificacao': dict(ticket).get('especificacao', ''),
            'agendado_com': ticket['recruiter'] if ticket['category'] == 'Agendado' else None  # Adiciona com quem está agendado
        }
        for ticket in called_tickets
    ]

    # Incluindo o campo especificacao nos tickets concluídos
    concluded_tickets = [
        {
            'ticket_number': ticket['ticket_number'],
            'name': ticket['name'],
            'category': ticket['category'],
            'priority': ticket['priority'],
            'guiche': ticket['guiche'],
            'id': ticket['id'],
            'created_at': ticket['created_at'],
            'called_at': ticket['called_at'] if ticket['called_at'] else 'Não chamado',
            'concluded_at': ticket['concluded_at'] if ticket['concluded_at'] else 'Não concluído',
            'stage': ticket['stage'],
            'especificacao': dict(ticket).get('especificacao', ''),
            'agendado_com': ticket['recruiter'] if ticket['category'] == 'Agendado' else None  # Adiciona com quem está agendado
        }
        for ticket in concluded_tickets
    ]

    # Processando formulário de dados, caso aplicável
    cpf = request.args.get('cpf')
    form_data = {
        'name': '',
        'cep': '',
        'rua': '',
        'numero': '',
        'complemento': '',
        'bairro': '',
        'cidade': '',
        'telefones': ''
    }

    if cpf:
        internal_data = db.execute('SELECT * FROM registration_form WHERE cpf = ?', (cpf,)).fetchone()
        if internal_data:
            form_data.update({
                'name': internal_data['nome_completo'],
                'cep': internal_data['cep'],
                'rua': internal_data['endereco'],
                'numero': internal_data['numero'],
                'complemento': internal_data['complemento'],
                'bairro': internal_data['bairro'],
                'cidade': internal_data['cidade'],
                'telefones': internal_data['telefones']
            })

        conn_str = (
            'DRIVER={ODBC Driver 18 for SQL Server};'
            'SERVER=srvdb01;DATABASE=JBC;UID=sa;PWD=jblimpeza2015;'
            'TrustServerCertificate=yes;'
        )
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        cursor.execute('''SELECT pe_nome, pe_cep, pe_logradouro_end, pe_numero_end, pe_complemento_end, 
                   pe_bairro_end, pe_cidade_end 
            FROM dbo.fo_pessoa 
            WHERE pe_cpf = ?''', cpf)
        external_data = cursor.fetchone()
        conn.close()

        if external_data:
            form_data.update({
                'name': external_data[0] or form_data['name'],
                'cep': external_data[1] or form_data['cep'],
                'rua': external_data[2] or form_data['rua'],
                'numero': external_data[3] or form_data['numero'],
                'complemento': external_data[4] or form_data['complemento'],
                'bairro': external_data[5] or form_data['bairro'],
                'cidade': external_data[6] or form_data['cidade']
            })

    # Renderizando o template com as variáveis atualizadas
    return render_template(
        'painel.html', 
        waiting_tickets=waiting_tickets, 
        called_tickets=called_tickets, 
        concluded_tickets=concluded_tickets, 
        total_tickets=total_tickets, 
        total_concluido=total_concluido, 
        average_wait_times=average_wait_times, 
        average_service_times=average_service_times,
        counts=counts,
        form_data=form_data
    )


@app.route('/get_ticket/<int:ticket_id>', methods=['GET'])
@login_required
def get_ticket(ticket_id):
    # Conectando ao banco de dados
    db = get_db()

    # Buscando o ticket pelo ID
    ticket = db.execute('SELECT * FROM tickets WHERE id = ?', (ticket_id,)).fetchone()

    # Verificando se o ticket foi encontrado
    if ticket:
        # Estrutura de dados com os valores do ticket para enviar ao front-end
        ticket_data = {
            'id': ticket['id'],
            'name': ticket['name'],
            'category': ticket['category'],
            'priority': ticket['priority'],
            'cpf': ticket['cpf'],
            'cep': ticket['cep'],
            'rua': ticket['rua'],
            'numero': ticket['numero'],
            'complemento': ticket['complemento'],
            'bairro': ticket['bairro'],
            'cidade': ticket['cidade'],
            'telefones': ticket['telefones'],
            'especificacao': ticket['especificacao'],
            'recruiter': ticket['recruiter']  # Adicionando o recrutador
        }

        # Enviando os dados do ticket para o front-end em formato JSON
        return jsonify(ticket_data)
    else:
        # Se o ticket não for encontrado, retorna um erro 404
        return jsonify({'error': 'Ticket não encontrado'}), 404


@app.route('/update_ticket', methods=['POST'])
@login_required
def update_ticket():
    ticket_id = request.form.get('ticket_id')
    name = request.form.get('name')
    category = request.form.get('category')
    priority = request.form.get('priority')
    cpf = request.form.get('cpf')
    cep = request.form.get('cep')
    rua = request.form.get('rua')
    numero = request.form.get('numero')
    complemento = request.form.get('complemento')
    bairro = request.form.get('bairro')
    cidade = request.form.get('cidade')
    telefones = request.form.get('telefones')
    especificacao = request.form.get('especificacao', '')

    db = get_db()  # Conexão ao banco de dados

    # Verifica se o ticket existe
    ticket = db.execute('SELECT * FROM tickets WHERE id = ?', (ticket_id,)).fetchone()

    if ticket:
        # Verifica se a categoria foi alterada e gera um novo número de ticket
        if ticket['category'] != category:
            ticket_number = generate_ticket_number(category)  # Função que gera o número do ticket
        else:
            ticket_number = ticket['ticket_number']

        # Atualiza os dados do ticket
        db.execute('''
            UPDATE tickets
            SET name = ?, category = ?, priority = ?, cpf = ?, cep = ?, rua = ?, numero = ?, complemento = ?, 
                bairro = ?, cidade = ?, telefones = ?, especificacao = ?, ticket_number = ?
            WHERE id = ?
        ''', (name, category, priority, cpf, cep, rua, numero, complemento, bairro, cidade, telefones, especificacao, ticket_number, ticket_id))

        db.commit()

        flash('Ticket atualizado com sucesso!', 'success')
    else:
        flash('Ticket não encontrado.', 'danger')

    return redirect(url_for('painel'))  # Certifique-se de que a rota 'painel' exista





@app.route('/submit_form', methods=['POST'])
@login_required
def submit_form():
    db = get_db()
    data = request.form
    curriculo = request.files.get('curriculo')

    curriculo_filename = None
    if curriculo and curriculo.filename:
        curriculo_filename = secure_filename(curriculo.filename)

        UPLOAD_DIR = os.path.join('static', 'uploads')
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)

        curriculo.save(os.path.join(UPLOAD_DIR, curriculo_filename))

    # Captura os dados do formulário
    form_data = {
        'cpf': data.get('cpf').upper(),
        'nome_completo': data.get('name').upper(),
        'estado_civil': data.get('estado_civil').upper(),
        'cargo_pretendido': ','.join([item.upper() for item in data.getlist('cargo_pretendido')]) if data.getlist('cargo_pretendido') else None,
        'cep': data.get('cep'),
        'endereco': data.get('endereco').upper(),
        'numero': data.get('numero'),
        'complemento': data.get('complemento').upper(),
        'bairro': data.get('bairro').upper(),
        'cidade': data.get('cidade').upper(),
        'telefone': data.get('telefone'),
        'estado_nasc': data.get('estado_nasc').upper(),
        'cidade_nasc': data.get('cidade_nasc').upper(),
        'data_nasc': data.get('data_nasc'),
        'idade': data.get('idade'),
        'numero_filhos': data.get('numero_filhos'),
        'fumante': data.get('fumante').upper(),
        'bebida': data.get('bebida').upper(),
        'alergia': data.get('alergia').upper() if data.get('alergia') else None,
        'medicamento_constante': data.get('medicamento_constante').upper(),
        'qual_medicamento': data.get('qual_medicamento').upper() if data.get('qual_medicamento') else None,
        'genero': data.get('genero').upper(),
        'peso': data.get('peso'),
        'cor_pele': data.get('cor_pele').upper(),
        'tatuagem': data.get('tatuagem').upper(),
        'perfil': data.get('perfil').upper(),
        'cargo_indicado': ','.join([item.upper() for item in data.getlist('cargo_indicado')]) if data.getlist('cargo_indicado') else None,
        'identidade': data.get('identidade').upper(),
        'cursos_realizados': data.get('cursos').upper() if data.get('cursos') else None,
        'regioes_preferencia': ','.join([item.upper() for item in data.getlist('regioes_preferencia')]) if data.getlist('regioes_preferencia') else None,
        'disponibilidade_horario': ','.join([item.upper() for item in data.getlist('disponibilidade_horario')]) if data.getlist('disponibilidade_horario') else None,
        'empresa1': data.get('empresa1').upper() if data.get('empresa1') else None,
        'cidade1': data.get('cidade1').upper() if data.get('cidade1') else None,
        'estado1': data.get('estado1').upper() if data.get('estado1') else None,
        'funcao1': data.get('funcao1').upper() if data.get('funcao1') else None,
        'data_admissao1': data.get('data_admissao1'),
        'data_saida1': data.get('data_saida1'),
        'motivo_saida1': data.get('motivo_saida1').upper() if data.get('motivo_saida1') else None,
        'salario1': data.get('salario1'),
        'empresa2': data.get('empresa2').upper() if data.get('empresa2') else None,
        'cidade2': data.get('cidade2').upper() if data.get('cidade2') else None,
        'estado2': data.get('estado2').upper() if data.get('estado2') else None,
        'funcao2': data.get('funcao2').upper() if data.get('funcao2') else None,
        'data_admissao2': data.get('data_admissao2'),
        'data_saida2': data.get('data_saida2'),
        'motivo_saida2': data.get('motivo_saida2').upper() if data.get('motivo_saida2') else None,
        'salario2': data.get('salario2'),
        'empresa3': data.get('empresa3').upper() if data.get('empresa3') else None,
        'cidade3': data.get('cidade3').upper() if data.get('cidade3') else None,
        'estado3': data.get('estado3').upper() if data.get('estado3') else None,
        'funcao3': data.get('funcao3').upper() if data.get('funcao3') else None,
        'data_admissao3': data.get('data_admissao3'),
        'data_saida3': data.get('data_saida3'),
        'motivo_saida3': data.get('motivo_saida3').upper() if data.get('motivo_saida3') else None,
        'salario3': data.get('salario3'),
        'empregos_informais': data.get('empregos_informais').upper() if data.get('empregos_informais') else None,
        'nome_entrevistador': data.get('nome_entrevistador').upper(),
        'avaliacao_rh': data.get('avaliacao_rh') if data.get('avaliacao_rh') else None,
        'assinatura_rh': data.get('assinatura_rh'),
        'avaliacao_gerencia': data.get('avaliacao_gerencia'),
        'conhecimento_digitacao': data.get('conhecimento_digitacao'),
        'assinatura_gerencia': data.get('assinatura_gerencia'),
        'rota_trabalho': ','.join([item.upper() for item in data.getlist('rota_trabalho')]) if data.getlist('rota_trabalho') else None,
        'curriculo': curriculo_filename,
        'observacoes': data.get('observacoes').upper() if data.get('observacoes') else None,
        'pcd': data.get('pcd'),
        'vacina': data.get('vacina'),
        'certificado': data.get('certificado'),
        'escolaridade': data.get('escolaridade').upper(),
        'numero_filhos': data.get('numero_filhos'),
        'motivo_reprovacao_rh': data.get('motivo_reprovacao_rh').upper() if data.get('motivo_reprovacao_rh') else None,
        'admitido': data.get('admitido'),  # Captura o campo de admitido
        'tempo_permanencia1': data.get('tempo_permanencia1'),
        'tempo_permanencia2': data.get('tempo_permanencia2'),
        'tempo_permanencia3': data.get('tempo_permanencia3')

    }

    # Para capturar as idades dos filhos dinamicamente
    numero_filhos = int(data.get('numero_filhos', 0))
    filhos_idade = []

    for i in range(1, numero_filhos + 1):
        idade_filho = data.get(f'idade_filho_{i}')
        if idade_filho:
            filhos_idade.append(idade_filho)

    form_data['idades_filhos'] = ','.join(filhos_idade)

    # Lógica para situação na primeira inserção
    avaliacao_rh = data.get('avaliacao_rh')
    avaliacao_gerencia = data.get('avaliacao_gerencia')

    if avaliacao_rh == 'Reprovado' or avaliacao_gerencia == 'Reprovado':
        form_data['situacao'] = 'Reprovado'
    elif avaliacao_rh == 'Aprovado' and avaliacao_gerencia == 'Aprovado':
        form_data['situacao'] = 'Aprovado'
    elif avaliacao_rh == 'Aprovado' and avaliacao_gerencia == 'Em Conversa':
        form_data['situacao'] = 'Em Conversa'
    else:
        form_data['situacao'] = 'Não Avaliado'

    try:
        cpf = form_data['cpf']
        existing_entry = db.execute('SELECT id, recrutador FROM registration_form WHERE cpf = ?', (cpf,)).fetchone()

        if existing_entry:
            if existing_entry['recrutador'] != current_user.username and form_data['situacao'] != 'Em Conversa':
                flash("Você não tem permissão para alterar esta ficha.", "danger")
                return redirect(url_for('view_form', cpf=cpf))

            # Atualiza registro existente
            update_fields = ', '.join([f"{key}=?" for key in form_data.keys() if key not in ['created_at', 'recrutador']])
            values = list(form_data.values()) + [cpf]
            db.execute(f'''
                UPDATE registration_form
                SET {update_fields}, last_updated=CURRENT_TIMESTAMP
                WHERE cpf=?
            ''', values)
            flash("Dados atualizados com sucesso.", "success")
        else:
            form_data['recrutador'] = current_user.username  # Grava o recrutador
            columns = ', '.join(form_data.keys())
            placeholders = ', '.join(['?' for _ in form_data])
            values = list(form_data.values())
            db.execute(f'''
                INSERT INTO registration_form ({columns}, created_at, last_updated)
                VALUES ({placeholders}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ''', values)
            flash("Cadastro realizado com sucesso.", "success")

        db.commit()
        return redirect(url_for('view_form', cpf=cpf))
    except Exception as e:
        print(f"Erro ao inserir no banco de dados: {e}")
        return f"Erro ao processar a requisição: {str(e)}", 500




@app.route('/banco_rs', methods=['GET'])
@login_required
def banco_rs():
    db = get_db()

    # Capturando todos os filtros do formulário
    nome_completo = request.args.get('nome', '')
    cpf = request.args.get('cpf', '')
    genero = request.args.get('genero', '')
    estado_civil = request.args.get('estado_civil', '')
    data_nasc_inicio = request.args.get('data_nasc_inicio', '')
    data_nasc_fim = request.args.get('data_nasc_fim', '')
    fumante = request.args.get('fumante', '')
    bebida = request.args.get('bebida', '')
    alergia = request.args.get('alergia', '')
    medicamento = request.args.get('medicamento', '')
    pcd = request.args.get('pcd', '')
    tatuagem = request.args.get('tatuagem', '')
    regioes_preferencia = request.args.get('regioes_preferencia', '')
    disponibilidade_horario = request.args.get('disponibilidade_horario', '')
    
    # Utilizando getlist para capturar múltiplos valores de cargo_indicado
    cargos_indicados = request.args.getlist('cargo_indicado')
    
    avaliacao_rh = request.args.get('avaliacao_rh', '')
    avaliacao_gerencia = request.args.get('avaliacao_gerencia', '')

    # Consulta base com ORDER BY para ordenar as fichas mais recentes primeiro
    query = 'SELECT *, situacao FROM registration_form WHERE 1=1'
    total_query = 'SELECT COUNT(*) FROM registration_form WHERE 1=1'
    params = []
    total_params = []

    # Aplicando os filtros apenas se estiverem preenchidos
    if nome_completo:
        query += ' AND nome_completo LIKE ?'
        total_query += ' AND nome_completo LIKE ?'
        params.append(f'%{nome_completo}%')
        total_params.append(f'%{nome_completo}%')
    if cpf:
        query += ' AND cpf = ?'
        total_query += ' AND cpf = ?'
        params.append(cpf)
        total_params.append(cpf)
    if genero:
        query += ' AND genero = ?'
        total_query += ' AND genero = ?'
        params.append(genero)
        total_params.append(genero)
    if estado_civil:
        query += ' AND estado_civil = ?'
        total_query += ' AND estado_civil = ?'
        params.append(estado_civil)
        total_params.append(estado_civil)
    if data_nasc_inicio and data_nasc_fim:
        query += ' AND data_nasc BETWEEN ? AND ?'
        total_query += ' AND data_nasc BETWEEN ? AND ?'
        params.extend([data_nasc_inicio, data_nasc_fim])
        total_params.extend([data_nasc_inicio, data_nasc_fim])
    if fumante:
        query += ' AND fumante = ?'
        total_query += ' AND fumante = ?'
        params.append(fumante)
        total_params.append(fumante)
    if bebida:
        query += ' AND bebida = ?'
        total_query += ' AND bebida = ?'
        params.append(bebida)
        total_params.append(bebida)
    if alergia:
        query += ' AND alergia = ?'
        total_query += ' AND alergia = ?'
        params.append(alergia)
        total_params.append(alergia)
    if medicamento:
        query += ' AND medicamento_uso_constante = ?'
        total_query += ' AND medicamento_uso_constante = ?'
        params.append(medicamento)
        total_params.append(medicamento)
    if pcd:
        query += ' AND pcd = ?'
        total_query += ' AND pcd = ?'
        params.append(pcd)
        total_params.append(pcd)
    if tatuagem:
        query += ' AND tatuagem = ?'
        total_query += ' AND tatuagem = ?'
        params.append(tatuagem)
        total_params.append(tatuagem)
    if regioes_preferencia:
        query += ' AND regioes_preferencia LIKE ?'
        total_query += ' AND regioes_preferencia LIKE ?'
        params.append(f'%{regioes_preferencia}%')
        total_params.append(f'%{regioes_preferencia}%')
    if disponibilidade_horario:
        query += ' AND disponibilidade_horario = ?'
        total_query += ' AND disponibilidade_horario = ?'
        params.append(disponibilidade_horario)
        total_params.append(disponibilidade_horario)

    cargo_indicado = request.args.get('cargo_indicado', '')

    if cargo_indicado:
        query += ' AND cargo_indicado LIKE ?'
        total_query += ' AND cargo_indicado LIKE ?'
        params.append(f'%{cargo_indicado}%')
        total_params.append(f'%{cargo_indicado}%')

    if avaliacao_rh:
        query += ' AND avaliacao_rh = ?'
        total_query += ' AND avaliacao_rh = ?'
        params.append(avaliacao_rh)
        total_params.append(avaliacao_rh)
    if avaliacao_gerencia:
        query += ' AND avaliacao_gerencia = ?'
        total_query += ' AND avaliacao_gerencia = ?'
        params.append(avaliacao_gerencia)
        total_params.append(avaliacao_gerencia)

    # Ordenando pelas fichas mais recentes
    query += ' ORDER BY created_at DESC'

    # Paginação
    page = request.args.get(get_page_parameter(), type=int, default=1)
    per_page = 10
    offset = (page - 1) * per_page

    # Aplicando os limites para a consulta
    query += ' LIMIT ? OFFSET ?'
    params.extend([per_page, offset])

    # Executando a consulta paginada
    candidatos = db.execute(query, params).fetchall()

    # Convertendo para dicionário para manipular as datas
    candidatos_dict = []
    for candidato in candidatos:
        candidato_dict = dict(candidato)
        if isinstance(candidato_dict['created_at'], str):
            try:
                candidato_dict['created_at'] = datetime.strptime(candidato_dict['created_at'], '%Y-%m-%d %H:%M:%S')
            except ValueError:
                candidato_dict['created_at'] = None  # Tratamento para datas inválidas

        if 'data_nasc' in candidato_dict and candidato_dict['data_nasc']:
            try:
                candidato_dict['data_nasc'] = datetime.strptime(candidato_dict['data_nasc'], '%Y-%m-%d').strftime('%d/%m/%Y')
            except ValueError:
                candidato_dict['data_nasc'] = None  # Tratamento para datas inválidas ou ausentes
        candidatos_dict.append(candidato_dict)

    # Executando a consulta para contagem total
    total = db.execute(total_query, total_params).fetchone()[0]

    # Configurando a paginação corretamente
    total_pages = (total // per_page) + (1 if total % per_page else 0)

    pagination = {
        'page': page,
        'total_pages': total_pages,
        'has_prev': page > 1,
        'has_next': page < total_pages,
        'prev_num': page - 1 if page > 1 else None,
        'next_num': page + 1 if page < total_pages else None
    }

    # Renderizando o template
    return render_template('banco_rs.html', candidatos=candidatos_dict, pagination=pagination)











@app.route('/inscription', methods=['GET', 'POST'])
@login_required
def inscription():
    if request.method == 'POST':
        form_data = request.form.to_dict()
        return redirect(url_for('inscription'))

    return render_template('view_or_fill_inscription.html', form_data={})

@app.route('/view_or_fill_inscription/<int:id>', methods=['GET', 'POST'])
@login_required
def view_or_fill_inscription(id):
    db = get_db()

    # Busca o ticket associado ao ID fornecido
    ticket = db.execute('SELECT * FROM tickets WHERE id = ?', (id,)).fetchone()
    if not ticket:
        return f"Ticket não encontrado para o ID: {id}", 404

    cpf = ticket['cpf']
    
    # Inicializa o dicionário form_data
    form_data = {
        'nome_completo': '',
        'endereco': '',
        'numero': '',
        'complemento': '',
        'cep': '',
        'estado': '',
        'cidade': '',
        'bairro': '',
        'cpf': cpf
    }

    # Busca a ficha de inscrição na tabela registration_form usando o CPF do ticket
    registration_form = db.execute('SELECT * FROM registration_form WHERE cpf = ?', (cpf,)).fetchone()
    if registration_form:
        form_data.update({
            'nome_completo': registration_form['nome_completo'],
            'cep': registration_form['cep'],
            'endereco': registration_form['endereco'],
            'numero': registration_form['numero'],
            'complemento': registration_form['complemento'],
            'bairro': registration_form['bairro'],
            'cidade': registration_form['cidade'],
            'estado': registration_form['estado_nasc']
        })
    else:
        return f"Ficha não encontrada para o CPF: {cpf}", 404

    # Lógica adicional caso queira buscar dados de um banco externo
    try:
        conn_str = (
            'DRIVER={ODBC Driver 18 for SQL Server};'
            'SERVER=srvdb01;DATABASE=JBC;UID=sa;PWD=jblimpeza2015;'
            'TrustServerCertificate=yes;'   
        )
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT pe_nome, pe_logradouro_end, pe_numero_end, pe_complemento_end, pe_cep, 
                   pe_uf_end, pe_cidade_end, pe_bairro_end 
            FROM dbo.fo_pessoa 
            WHERE pe_cpf = ?
        ''', cpf)
        external_data = cursor.fetchone()
    except Exception as e:
        external_data = None
        print(f"Erro ao conectar ao banco de dados externo: {e}")
    finally:
        conn.close()

    # Atualiza form_data com dados externos, se existirem
    if external_data:
        form_data.update({
            'nome_completo': external_data[0] if external_data[0] else '',           
            'endereco': external_data[1] if external_data[1] else '',       
            'numero': external_data[2] if external_data[2] else '',         
            'complemento': external_data[3] if external_data[3] else '',    
            'cep': external_data[4] if external_data[4] else '',            
            'estado': external_data[5] if external_data[5] else '',         
            'cidade': external_data[6] if external_data[6] else '',         
            'bairro': external_data[7] if external_data[7] else ''          
        })

    if request.method == 'POST':
        data = request.form
        try:
            db.execute('''
                INSERT OR REPLACE INTO registration_form (
                    cpf, nome_completo, cep, endereco, numero, complemento, bairro, cidade, estado_nasc, 
                    telefone, cidade_nasc, data_nasc, idade, numero_filhos, filhos,
                    estado_civil, fumante, bebida, alergia, medicamento_constante, qual_medicamento, medicamento_uso_constante, 
                    genero, peso, cor_pele, tatuagem, perfil, cargo_indicado, identidade, cursos_realizados, 
                    regioes_preferencia, disponibilidade_horario, empresa1, cidade1, funcao1, data_admissao1, 
                    data_saida1, motivo_saida1, salario1, empresa2, cidade2, funcao2, data_admissao2, 
                    data_saida2, motivo_saida2, salario2, empresa3, cidade3, funcao3, data_admissao3, 
                    data_saida3, motivo_saida3, salario3, empregos_informais, nome_entrevistador, 
                    avaliacao_rh, assinatura_rh, avaliacao_gerencia, assinatura_gerencia, rota_trabalho, 
                    curriculo, situacao, created_at, last_updated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ''', (
                data['cpf'], data['nome_completo'], data.get('cep'), data.get('endereco'),
                data.get('numero'), data.get('complemento'), data.get('bairro'), data.get('cidade'),
                data.get('estado'), data.get('telefone'), data.get('cidade_nasc'), data.get('data_nasc'),
                data.get('idade'), data.get('numero_filhos'), data.get('filhos'), data.get('estado_civil'),
                data.get('fumante'), data.get('bebida'), data.get('alergia'), data.get('medicamento_constante'), data.get('qual_medicamento'),
                data.get('medicamento_constante'), data.get('genero'), data.get('peso'), data.get('cor_pele'),
                data.get('tatuagem'), data.get('perfil'), data.get('cargo_indicado'), data.get('identidade'),
                data.get('cursos_realizados'), data.get('regioes_preferencia'), data.get('disponibilidade_horario'),
                data.get('empresa1'), data.get('cidade1'), data.get('funcao1'), data.get('data_admissao1'),
                data.get('data_saida1'), data.get('motivo_saida1'), data.get('salario1'),
                data.get('empresa2'), data.get('cidade2'), data.get('funcao2'), data.get('data_admissao2'),
                data.get('data_saida2'), data.get('motivo_saida2'), data.get('salario2'),
                data.get('empresa3'), data.get('cidade3'), data.get('funcao3'), data.get('data_admissao3'),
                data.get('data_saida3'), data.get('motivo_saida3'), data.get('salario3'),
                data.get('empregos_informais'), data.get('nome_entrevistador'), data.get('avaliacao_rh'),
                data.get('assinatura_rh'), data.get('avaliacao_gerencia'), data.get('assinatura_gerencia'),
                data.get('rota_trabalho'), data.get('curriculo'), data.get('situacao')
            ))
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Erro ao salvar no banco de dados: {e}")
            return f"Erro ao salvar no banco de dados: {str(e)}", 500

        return redirect(url_for('sistema_rs'))

    return render_template('view_or_fill_inscription.html', ticket=ticket, form_data=form_data)
@app.route('/admin/manage_users', methods=['GET', 'POST'])
@login_required
def manage_users():
    if not current_user.is_admin:
        flash('Acesso negado: Você não tem permissão para acessar esta página.', 'danger')
        return redirect(url_for('home'))

    db = get_db()

    # Se o método for POST, significa que estamos adicionando um usuário
    if request.method == 'POST':
        username = request.form['username']
        name = request.form['name']
        email = request.form['email']
        password = generate_password_hash(request.form['password'])
        is_admin = 'is_admin' in request.form

        # Verificar se o username já existe
        existing_user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()

        if existing_user:
            flash('O nome de usuário já está em uso. Por favor, escolha outro.', 'danger')
            return redirect(url_for('manage_users'))

        # Inserir o novo usuário, sem verificar duplicidade de e-mail
        db.execute('''
            INSERT INTO users (username, name, email, password, is_admin) 
            VALUES (?, ?, ?, ?, ?)
        ''', (username, name, email, password, is_admin))
        db.commit()

        flash('Usuário adicionado com sucesso!', 'success')
        return redirect(url_for('manage_users'))

    # Recupera a lista de usuários cadastrados
    users = db.execute('SELECT * FROM users').fetchall()

    return render_template('admin_dashboard.html', users=users)




@app.route('/manage_candidates', methods=['GET', 'POST'])
@login_required
def manage_candidates():
    db = get_db()

    if request.method == 'POST':
        candidate_id = request.form['candidate_id']
        new_status = request.form['status']
        rejection_reason = request.form.get('rejection_reason', '')

        if new_status == "REPROVADO" and not rejection_reason:
            flash("Motivo da reprovação é obrigatório para candidatos reprovados.", "danger")
            return redirect(url_for('manage_candidates'))

        db.execute('''
            UPDATE registration_form
            SET status = ?, rejection_reason = ?
            WHERE id = ?
        ''', (new_status, rejection_reason if new_status == "REPROVADO" else None, candidate_id))
        db.commit()

        flash("Situação do candidato atualizada com sucesso!", "success")
        return redirect(url_for('manage_candidates'))

    candidates = db.execute('SELECT * FROM registration_form').fetchall()
    
    return render_template('manage_candidates.html', candidates=candidates)

@app.route('/user_logs')
@login_required
def user_logs():
    if not current_user.is_admin:
        flash('Acesso negado: Você não tem permissão para acessar esta página.', 'danger')
        return redirect(url_for('home'))

    db = get_db()

    search_query = request.args.get('search', '')
    user_id_filter = request.args.get('user_id', '')
    action_filter = request.args.get('action', '')

    query = '''
        SELECT logs.id, logs.user_id, logs.action, logs.created_at, users.name 
        FROM user_logs AS logs
        JOIN users ON logs.user_id = users.id
        WHERE 1=1
    '''
    params = []

    if user_id_filter:
        query += ' AND logs.user_id = ?'
        params.append(user_id_filter)
    if action_filter:
        query += ' AND logs.action LIKE ?'
        params.append(f'%{action_filter}%')
    if search_query:
        query += ' AND (users.name LIKE ? OR logs.action LIKE ?)'
        params.extend([f'%{search_query}%', f'%{search_query}%'])

    page = request.args.get(get_page_parameter(), type=int, default=1)
    per_page = 10
    offset = (page - 1) * per_page

    query += ' ORDER BY logs.created_at DESC LIMIT ? OFFSET ?'
    params.extend([per_page, offset])

    logs = db.execute(query, params).fetchall()

    total = db.execute('SELECT COUNT(*) FROM user_logs').fetchone()[0]

    pagination = Pagination(page=page, total=total, per_page=per_page, css_framework='bootstrap4')

    return render_template('user_logs.html', logs=logs, pagination=pagination, search_query=search_query, user_id_filter=user_id_filter, action_filter=action_filter)

@app.template_filter('first_and_second_name')
def first_and_second_name(name):
    parts = name.split()
    return ' '.join(parts[:2]) if len(parts) > 1 else parts[0]

app.jinja_env.filters['first_and_second_name'] = first_and_second_name


# Filtro para formatar datas no formato brasileiro
@app.template_filter('format_brazilian_date')
def format_brazilian_date(value):
    if value:
        try:
            # Converter para o objeto datetime
            dt = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
            # Aplicar o fuso horário de Brasília, se necessário
            brasilia_tz = pytz.timezone('America/Sao_Paulo')
            dt_brasilia = dt.astimezone(brasilia_tz)
            return dt_brasilia.strftime('%d/%m/%Y %H:%M:%S')  # Formato brasileiro
        except ValueError:
            return value  # Retorna a data original se não puder ser convertida
    return value


app.jinja_env.filters['format_brazilian_date'] = format_brazilian_date

@app.route('/verify_cpf', methods=['POST'])
@login_required
def verify_cpf():
    data = request.json
    cpf = data['cpf'].replace('.', '').replace('-', '')  # Remove os pontos e traços do CPF
    category = data['category'].lower()  # Transforma a categoria em minúsculas para garantir compatibilidade

    print(f"Verificando CPF: {cpf} na categoria: {category}")  # Log para depuração

    # Verifica no banco de dados externo
    conn_str = (
        'DRIVER={ODBC Driver 18 for SQL Server};'
        'SERVER=srvdb01;DATABASE=JBC;UID=sa;PWD=jblimpeza2015;'
        'TrustServerCertificate=yes;'
    )
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()

    # Certifique-se de comparar o CPF sem pontuação no banco externo
    cursor.execute('''
        SELECT pe_nome, pe_cep, pe_numero_end, pe_complemento_end 
        FROM dbo.fo_pessoa 
        WHERE REPLACE(REPLACE(pe_cpf, '.', ''), '-', '') = ?
    ''', cpf)
    result = cursor.fetchone()
    conn.close()

    # Se o CPF foi encontrado no banco de dados externo
    if result:
        nome, cep, numero, complemento = result[0], result[1], result[2], result[3]
        response_data = {
            'exists': True,
            'name': nome,
            'cep': cep,
            'numero': numero,
            'complemento': complemento,
            'external': True  # Indica que foi encontrado no banco externo
        }

        # Caso a categoria seja "entrevista", verificar no banco interno também
        if category == "entrevista":
            db = get_db()
            print(f"Verificando CPF no banco de dados interno (entrevista): {cpf}")  # Log para depuração
            
            # Sanitiza o CPF e compara no banco interno
            candidate = db.execute('SELECT name, created_at FROM interview_candidates WHERE REPLACE(REPLACE(cpf, ".", ""), "-", "") = ?', (cpf,)).fetchone()

            if candidate:
                print(f"Candidato encontrado no banco interno: {candidate['name']}")  # Log para depuração
                
                # Pega a situação da tabela registration_form e também sanitiza o CPF
                situacao = db.execute('SELECT situacao FROM registration_form WHERE REPLACE(REPLACE(cpf, ".", ""), "-", "") = ?', (cpf,)).fetchone()

                # Ajustando para o caso de created_at ser uma string
                response_data.update({
                    'name': candidate['name'],
                    'created_at': candidate['created_at'],  # Usando a string diretamente
                    'situacao': situacao['situacao'] if situacao else 'Não Avaliado',
                    'external': False  # Indica que foi encontrado no banco interno
                })
                return jsonify(response_data)
            else:
                print("Candidato não encontrado no banco interno.")  # Log para depuração

        # Se não for categoria entrevista, retorna apenas os dados do banco externo
        return jsonify(response_data)

    else:
        # Caso não encontre no banco externo, verificar no banco interno
        print(f"CPF não encontrado no banco externo, verificando no banco interno: {cpf}")  # Log para depuração
        db = get_db()
        
        # Sanitiza o CPF e compara no banco interno
        candidate = db.execute('SELECT name, created_at FROM interview_candidates WHERE REPLACE(REPLACE(cpf, ".", ""), "-", "") = ?', (cpf,)).fetchone()

        if candidate:
            print(f"Candidato encontrado no banco interno: {candidate['name']}")  # Log para depuração
            
            # Pega a situação da tabela registration_form e também sanitiza o CPF
            situacao = db.execute('SELECT situacao FROM registration_form WHERE REPLACE(REPLACE(cpf, ".", ""), "-", "") = ?', (cpf,)).fetchone()

            response_data = {
                'exists': True,
                'name': candidate['name'],
                'created_at': candidate['created_at'],  # Usando a string diretamente
                'situacao': situacao['situacao'] if situacao else 'Não Avaliado',
                'external': False
            }
            return jsonify(response_data)
        else:
            print("CPF não encontrado no banco interno.")  # Log para depuração
            return jsonify({'exists': False, 'message': 'CPF não encontrado. Prosseguindo com o cadastro.'})



@app.route('/create_ticket', methods=['POST'])
@login_required
def create_ticket():
    category = request.form['category']
    name = request.form['name']
    cpf = request.form.get('cpf')
    priority = int(request.form['priority'])
    cep = request.form['cep']
    rua = request.form['rua']
    numero = request.form['numero']
    complemento = request.form['complemento']
    bairro = request.form['bairro']
    cidade = request.form['cidade']
    telefones = request.form['telefones']
    ticket_number = generate_ticket_number(category)
    
    # Captura a especificação se a categoria for "Outros"
    especificacao = request.form.get('especificacao') if category == 'Outros' else None
    print(f"Especificação recebida: {especificacao}")  # Verificação de depuração
    
    # Captura o recrutador se a categoria for "Agendado"
    recruiter = request.form.get('recruiter') if category == 'Agendado' else None
    print("Recrutador:", recruiter)  # Verifique o valor do recrutador

    db = get_db()
    created_at = datetime.now(BRASILIA_TZ).strftime('%Y-%m-%d %H:%M:%S')

    # Lógica para o caso de Entrevista
    if category == 'Entrevista' and cpf:
        existing_form = db.execute('SELECT * FROM registration_form WHERE cpf = ?', (cpf,)).fetchone()
        existing_interview = db.execute('SELECT * FROM interview_candidates WHERE cpf = ?', (cpf,)).fetchone()

        if existing_form:
            # Se já existe um formulário, redireciona para a visualização/edição
            return redirect(url_for('view_or_fill_inscription', id=existing_form['cpf']))
        elif not existing_interview:
            # Inserir dados no banco de entrevistas apenas se ainda não existir
            db.execute('INSERT INTO interview_candidates (cpf, name, created_at) VALUES (?, ?, ?)', 
                       (cpf, name, created_at))

    # Inserção do ticket no banco de dados com o campo especificação e recrutador (se houver)
    db.execute('''
        INSERT INTO tickets (name, category, ticket_number, created_at, priority, stage, updated_at, 
                             status, cpf, cep, rua, numero, complemento, bairro, cidade, telefones, recruiter, especificacao) 
        VALUES (?, ?, ?, ?, ?, "RH", ?, "ESPERA", ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (name, category, ticket_number, created_at, priority, created_at, cpf, cep, rua, numero, complemento, bairro, cidade, telefones, recruiter, especificacao))

    # Obtendo o ID do ticket recém-criado
    ticket_id = db.execute('SELECT last_insert_rowid()').fetchone()[0]

    db.commit()

    # Emissão do evento para adicionar o ticket em tempo real
    socketio.emit('new_ticket', {
        'id': ticket_id,
        'name': name,
        'ticket_number': ticket_number,
        'created_at': created_at,
        'category': category,
        'cpf': cpf
    }, namespace='/')

    return redirect(url_for('painel'))







@app.route('/complete_registration', methods=['GET', 'POST'])
@login_required
def complete_registration():
    if request.method == 'POST':
        data = request.form
        cpf = data['cpf']
        name = data['name']
        cep = data.get('cep')
        rua = data.get('rua')
        numero = data.get('numero')
        complemento = data.get('complemento')
        bairro = data.get('bairro')
        cidade = data.get('cidade')
        telefones = data.get('telefones')

        db = get_db()
        db.execute('''
            INSERT INTO tickets (cpf, name, cep, rua, numero, complemento, bairro, cidade, telefones)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (cpf, name, cep, rua, numero, complemento, bairro, cidade, telefones))
        db.commit()

        return redirect(url_for('painel'))

    cpf = request.args.get('cpf')
    name = request.args.get('name')
    return render_template('complete_registration.html', cpf=cpf, name=name)

@app.route('/call_with_alert/<int:id>', methods=['POST'])
@login_required
def call_with_alert(id):
    db = get_db()
    called_at = datetime.now(BRASILIA_TZ).strftime('%Y-%m-%d %H:%M:%S')  # Adicionando a data e hora atual

    # Obtém o ticket atual antes de chamar
    ticket = db.execute('SELECT * FROM tickets WHERE id = ?', (id,)).fetchone()
    if not ticket:
        return "Ticket não encontrado", 404

    # Atualiza o ticket apenas com o horário de chamado
    db.execute('UPDATE tickets SET status = "CHAMADO", called_at = ? WHERE id = ?', 
               (called_at, id))
    db.commit()

      # Verifica se 'called_at' é nulo e, se for, usa a hora atual
    if ticket['called_at']:
        formatted_time = datetime.strptime(ticket['called_at'], '%Y-%m-%d %H:%M:%S').strftime('%H:%M:%S')
    else:
        formatted_time = datetime.now(BRASILIA_TZ).strftime('%H:%M:%S')

    # Emite o evento socket para atualizar o display, mantendo o guichê existente
    socketio.emit('update_display', {
        'current_ticket_number': ticket['ticket_number'],
        'current_guiche': ticket['guiche'],  # Mantém o guichê original
        'current_name': first_and_second_name(ticket['name']),
        'current_time': datetime.strptime(ticket['called_at'], '%Y-%m-%d %H:%M:%S').strftime('%H:%M:%S'),  # Hora formatada
        'called_tickets': [],  # Você pode manter a lógica para obter chamados recentes, se necessário
        'play_audio': True
    }, namespace='/')

    return '', 204






@app.route('/send_tv/<int:id>', methods=['POST'])
@login_required
def send_tv(id):
    guiche = request.form.get('guiche')
    if not guiche:
        return "Guichê é obrigatório", 400

    db = get_db()
    called_at = datetime.now(BRASILIA_TZ).strftime('%Y-%m-%d %H:%M:%S')

    # Atualiza o guichê e o status do ticket no banco de dados
    db.execute('UPDATE tickets SET status = "CHAMADO", called_at = ?, guiche = ? WHERE id = ?', 
               (called_at, guiche, id))
    db.commit()

    ticket = db.execute('SELECT * FROM tickets WHERE id = ?', (id,)).fetchone()

    if ticket:
        # Atualiza o display via Socket.IO
        socketio.emit('update_display', {
            'current_ticket_number': ticket['ticket_number'],
            'current_guiche': ticket['guiche'],
            'current_name': first_and_second_name(ticket['name']),
            'current_time': ticket['called_at'].split(' ')[1] if ' ' in ticket['called_at'] else ticket['called_at'],
            'called_tickets': [
                {
                    'name': first_and_second_name(t['name']),
                    'ticket_number': t['ticket_number'],
                    'guiche': t['guiche'],
                    'called_at': t['called_at'].split(' ')[1] if ' ' in t['called_at'] else t['called_at']
                } for t in db.execute('SELECT * FROM tickets WHERE status = "CHAMADO" ORDER BY priority DESC, called_at DESC LIMIT 10').fetchall()
            ],
            'play_audio': False
        }, namespace='/')

        # Emite o evento para atualizar o guichê via Socket.IO
        socketio.emit('update_guiche', {'ticket_id': id, 'guiche': guiche}, namespace='/')

    return '', 204





@app.route('/reposition_ticket/<int:id>', methods=['POST'])
@login_required
def reposition_ticket(id):
    db = get_db()
    db.execute('UPDATE tickets SET status = "ESPERA" WHERE id = ?', (id,))
    db.commit()
    socketio.emit('update_queue', {'data': 'ticket repositioned'}, namespace='/')
    return redirect(url_for('painel'))

@app.route('/reset_indicators', methods=['POST'])
@login_required
def reset_indicators():
    db = get_db()

    result = db.execute('DELETE FROM tickets WHERE status = "CONCLUIDO"')
    db.commit()

    socketio.emit('update_queue', {'data': 'indicators reset'}, namespace='/')
    return redirect(url_for('painel'))

@app.route('/indicadores')
@login_required
def indicadores():
    db = get_db()
    categories = ['Admissão', 'Demissão', 'Entrevista', 'Agendado', 'Treinamento', 'Documentação', 'Outros']

    total_tickets = db.execute('SELECT COUNT(*) FROM tickets').fetchone()[0]
    total_concluido = db.execute('SELECT COUNT(*) FROM tickets WHERE status = "CONCLUIDO"').fetchone()[0]
    counts = {category: db.execute(f'SELECT COUNT(*) FROM tickets WHERE category = ? AND status != "CONCLUIDO"', (category,)).fetchone()[0] for category in categories}

    wait_times = {category: [] for category in categories}
    service_times = {category: [] for category in categories}
    historical_data = []

    for ticket in db.execute('SELECT * FROM tickets WHERE status = "CHAMADO" OR status = "CONCLUIDO"').fetchall():
        if ticket['called_at'] and ticket['created_at']:
            wait_time = (datetime.strptime(ticket['called_at'], '%Y-%m-%d %H:%M:%S') - datetime.strptime(ticket['created_at'], '%Y-%m-%d %H:%M:%S')).total_seconds()
            if wait_time > 0:
                wait_times[ticket['category']].append(wait_time)
        if ticket['concluded_at'] and ticket['called_at']:
            service_time = (datetime.strptime(ticket['concluded_at'], '%Y-%m-%d %H:%M:%S') - datetime.strptime(ticket['called_at'], '%Y-%m-%d %H:%M:%S')).total_seconds()
            if service_time > 0:
                service_times[ticket['category']].append(service_time)

        historical_data.append({
            'ticket_number': ticket['ticket_number'],
            'name': ticket['name'],
            'category': ticket['category'],
            'created_at': format_brazilian_date(ticket['created_at']),
            'called_at': format_brazilian_date(ticket['called_at']) if ticket['called_at'] else 'Não chamado',
            'concluded_at': format_brazilian_date(ticket['concluded_at']) if ticket['concluded_at'] else 'Não concluído',
            'wait_time': format_time(wait_time) if ticket['called_at'] else 'N/A',
            'service_time': format_time(service_time) if ticket['concluded_at'] else 'N/A',
            'total_time': format_time(wait_time + service_time) if ticket['concluded_at'] else 'N/A'
        })

    average_wait_times = {category: calculate_average_time(wait_times[category]) for category in categories}
    average_service_times = {category: calculate_average_time(service_times[category]) for category in categories}

    tickets_issued = [total_tickets]
    tickets_completed = [total_concluido]

    return render_template(
        'indicadores.html',
        total_tickets=total_tickets,
        total_concluido=total_concluido,
        counts=counts,
        average_wait_times=average_wait_times,
        average_service_times=average_service_times,
        tickets_issued=tickets_issued,
        tickets_completed=tickets_completed,
        comparison_labels=categories,
        historical_data=historical_data
    )

@app.route('/display')
def display():
    db = get_db()
    current_ticket = db.execute('SELECT * FROM tickets WHERE status = "CHAMADO" ORDER BY priority DESC, called_at DESC LIMIT 1').fetchone()
    current_ticket_number = current_ticket['ticket_number'] if current_ticket else "N/A"
    current_guiche = current_ticket['guiche'] if current_ticket else "N/A"
    current_name = current_ticket['name'] if current_ticket else "N/A"
    current_time = datetime.strptime(current_ticket['called_at'], '%Y-%m-%d %H:%M:%S').strftime('%H:%M:%S') if current_ticket and current_ticket['called_at'] else 'N/A'

    called_tickets = db.execute('SELECT * FROM tickets WHERE status = "CHAMADO" ORDER BY priority DESC, called_at DESC LIMIT 10').fetchall()
    called_tickets_list = [{'name': first_and_second_name(ticket['name']), 'ticket_number': ticket['ticket_number'], 'guiche': ticket['guiche'], 'called_at': datetime.strptime(ticket['called_at'], '%Y-%m-%d %H:%M:%S').strftime('%H:%M:%S') if ticket['called_at'] else 'N/A'} for ticket in called_tickets if ticket['status'] != 'CONCLUIDO']

    return render_template('display.html', current_ticket_number=current_ticket_number, current_guiche=current_guiche, current_name=current_name, current_time=current_time, called_tickets=called_tickets_list)

@app.route('/display_stage/<stage>')
@login_required
def display_stage(stage):
    db = get_db()
    em_andamento = db.execute('SELECT * FROM tickets WHERE stage != ? AND status != "CONCLUIDO" ORDER BY priority DESC, updated_at DESC', (stage,)).fetchall()
    no_setor = db.execute('SELECT * FROM tickets WHERE stage = ? AND status != "CONCLUIDO" ORDER BY priority DESC, updated_at DESC', (stage,)).fetchall()
    concluidos = db.execute('SELECT * FROM tickets WHERE stage = ? AND status = "CONCLUIDO" ORDER BY priority DESC, updated_at DESC', (stage,)).fetchall()

    em_andamento_list = [{'name': ticket['name'], 'stage': ticket['stage'], 'status': ticket['status'], 'updated_at': format_brazilian_date(ticket['updated_at'])} for ticket in em_andamento]
    no_setor_list = [{'name': ticket['name'], 'stage': ticket['stage'], 'status': ticket['status'], 'updated_at': format_brazilian_date(ticket['updated_at'])} for ticket in no_setor]
    concluidos_list = [{'name': ticket['name'], 'stage': ticket['stage'], 'status': ticket['status'], 'updated_at': format_brazilian_date(ticket['updated_at'])} for ticket in concluidos]

    return render_template('display_stage.html', em_andamento=em_andamento_list, no_setor=no_setor_list, concluidos=concluidos_list, stage=stage)

@app.route('/historico_completo')
@login_required
def historico_completo():
    db = get_db()
    tickets = db.execute('SELECT * FROM tickets ORDER BY updated_at DESC').fetchall()
    tickets_list = [
        {
            'id': ticket['id'],
            'name': ticket['name'],
            'category': ticket['category'],
            'ticket_number': ticket['ticket_number'],
            'created_at': format_brazilian_date(ticket['created_at']),
            'called_at': format_brazilian_date(ticket['called_at']) if ticket['called_at'] else 'Não chamado',
            'concluded_at': format_brazilian_date(ticket['concluded_at']) if ticket['concluded_at'] else 'Não concluído',
            'status': ticket['status'],
            'stage': ticket['stage'],
            'priority': ticket['priority']
        }
        for ticket in tickets
    ]

    return render_template('historico_completo.html', tickets=tickets_list)

@app.route('/conclude_ticket/<int:id>', methods=['POST'])
def conclude_ticket(id):
    db = get_db()
    concluded_at = datetime.now(BRASILIA_TZ).strftime('%Y-%m-%d %H:%M:%S')

    ticket = db.execute('SELECT * FROM tickets WHERE id = ?', (id,)).fetchone()
    if ticket:
        db.execute('UPDATE tickets SET status = "CONCLUIDO", concluded_at = ? WHERE id = ?', 
                   (concluded_at, id))
        db.commit()

    # Emissão do evento para remover o ticket em tempo real
    socketio.emit('remove_ticket', id, namespace='/')

    # Emissão do evento para atualizar a fila
    socketio.emit('update_queue', {'data': 'ticket concluded'}, namespace='/')

    return redirect(url_for('painel'))


@app.route('/sistema_rs')
@login_required
def sistema_rs():
    db = get_db()
    admission_candidates = db.execute('SELECT * FROM tickets WHERE category = "Admissão"').fetchall()
    dismissal_candidates = db.execute('SELECT * FROM tickets WHERE category = "Demissão"').fetchall()
    interview_candidates = db.execute('SELECT * FROM tickets WHERE category = "Entrevista"').fetchall()

    return render_template('sistema_rs.html', 
                           admission_candidates=admission_candidates, 
                           dismissal_candidates=dismissal_candidates, 
                           interview_candidates=interview_candidates)

@app.route('/gestao_pessoas')
@login_required
def gestao_pessoas():
    db = get_db()
    
    # Seleciona os candidatos para as outras categorias, excluindo os concluídos
    admission_candidates = db.execute(''' 
        SELECT * FROM tickets 
        WHERE category = "Admissão" AND status != "CONCLUIDO" 
        ORDER BY created_at DESC
    ''').fetchall()

    dismissal_candidates = db.execute(''' 
        SELECT * FROM tickets 
        WHERE category = "Demissão" AND status != "CONCLUIDO" 
        ORDER BY created_at DESC
    ''').fetchall()

    interview_candidates = db.execute(''' 
        SELECT * FROM tickets 
        WHERE category = "Entrevista" AND status != "CONCLUIDO" 
        ORDER BY created_at DESC
    ''').fetchall()

    # Seleciona os agendados para o recrutador logado, excluindo os concluídos
    scheduled_candidates = db.execute(''' 
        SELECT * FROM tickets 
        WHERE category = "Agendado" 
        AND recruiter = ? 
        AND status != "CONCLUIDO" 
        ORDER BY created_at DESC
    ''', (current_user.username,)).fetchall()

    # Log para verificar se os agendados estão sendo retornados
    print("Scheduled candidates:", scheduled_candidates)

    return render_template('gestao_pessoas.html',
                           admission_candidates=admission_candidates,
                           dismissal_candidates=dismissal_candidates,
                           interview_candidates=interview_candidates,
                           scheduled_candidates=scheduled_candidates)



def format_time(total_seconds):
    if total_seconds is None:
        return 'N/A'
    hours = int(total_seconds // 3600)
    minutes = int((total_seconds % 3600) // 60)
    return f"{hours}h {minutes}min"

def calculate_average_time(time_differences):
    if not time_differences:
        return 0
    return sum(time_differences) / len(time_differences)

def generate_ticket_number(category):
    db = get_db()

    # Dicionário de prefixos por categoria
    category_prefix_map = {
        'Agendado': 'AG',
        'Admissão': 'AD',
        'Demissão': 'DE',
        'Entrevista': 'EN',
        'Treinamento': 'TR',
        'Documentação': 'DO',
        'Outros': 'OU'
    }

    # Obtém o prefixo da categoria ou usa a primeira letra se não estiver no mapa
    category_prefix = category_prefix_map.get(category, category[0].upper())

    # Conta quantos tickets já existem na categoria e incrementa 1
    cur = db.execute('SELECT COUNT(*) FROM tickets WHERE category = ?', (category,))
    count = cur.fetchone()[0] + 1

    # Formata o número do ticket com 3 dígitos, como AD001, DE002, etc.
    ticket_number = f"{category_prefix}{count:03d}"

    return ticket_number


def get_candidato_by_id(id):
    conn = sqlite3.connect('app.db')  # Conecte-se ao seu banco de dados
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM registration_form WHERE id = ?", (id,))
    candidato = cursor.fetchone()
    conn.close()
    return candidato

logo_path = os.path.join(os.getcwd(), 'static/images/logo2.png')

@app.route('/export_pdf/<cpf>')
@login_required
def export_pdf(cpf):
    
    # Obtenha a conexão com o banco de dados
    db = get_db()

    # Certifique-se de buscar o candidato pelo CPF
    candidato = db.execute('SELECT * FROM registration_form WHERE cpf = ?', (cpf,)).fetchone()

    if not candidato:
        return "Candidato não encontrado", 404

    # Renderiza o template com os dados do candidato
    rendered_html = render_template('candidato_template.html', form_data=candidato)

    # Gera o PDF usando WeasyPrint
    pdf = HTML(string=rendered_html).write_pdf()

    # Retorna o PDF como resposta
    response = make_response(pdf)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'inline; filename=candidato_{cpf}.pdf'
    return response

@app.route('/export_excel/<cpf>')
@login_required
def export_excel(cpf):
    db = get_db()

    # Certifique-se de buscar o candidato pelo CPF
    candidato = db.execute('SELECT * FROM registration_form WHERE cpf = ?', (cpf,)).fetchone()

    if candidato is None:
        return "Candidato não encontrado", 404

    # Definir o caminho para a logo
   # logo_path = os.path.join('static', 'images', 'logo2.png')

    # Criando um arquivo temporário para armazenar o Excel
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')

    try:
        # Criando um escritor do Excel
        with pd.ExcelWriter(temp_file.name, engine='xlsxwriter') as writer:
            # Acessando o workbook e a worksheet
            workbook = writer.book
            worksheet = workbook.add_worksheet('Ficha')

            # Ajuste da logo com redimensionamento
     #       worksheet.insert_image('A1', logo_path, {'x_scale': 0.3, 'y_scale': 0.3})

            # Definindo estilos para bordas e títulos
            title_format = workbook.add_format({
                'bold': True, 'font_size': 14, 'align': 'center', 'valign': 'vcenter', 'border': 1, 'bg_color': '#F2F2F2'
            })
            header_format = workbook.add_format({
                'bold': True, 'bg_color': '#AB1A18', 'font_color': '#FFFFFF', 'border': 1, 'align': 'center', 'valign': 'vcenter'
            })
            text_format = workbook.add_format({'border': 1, 'align': 'left', 'valign': 'vcenter'})
            
            # Ajustar as colunas
            worksheet.set_column('A:A', 30)  # Largura da coluna de títulos
            worksheet.set_column('B:B', 50)  # Largura da coluna de respostas

            # Definir os campos e seus valores
            fields = {
                'CPF': candidato['cpf'],
                'Nome Completo': candidato['nome_completo'],
                'Estado Civil': candidato['estado_civil'],
                'Cargo Pretendido': candidato['cargo_pretendido'],
                'Endereço': candidato['endereco'],
                'Número': candidato['numero'],
                'Complemento': candidato['complemento'],
                'Bairro': candidato['bairro'],
                'Cidade': candidato['cidade'],
                'Telefone': candidato['telefone'],
                'Estado de Nascimento': candidato['estado_nasc'],
                'Cidade de Nascimento': candidato['cidade_nasc'],
                'Data de Nascimento': candidato['data_nasc'],
                'Idade': candidato['idade'],
                'Número de Filhos': candidato['numero_filhos'],
                'Fumante': candidato['fumante'],
                'Bebida': candidato['bebida'],
                'Alergia': candidato['alergia'],
                'Medicamento de Uso Constante': candidato['medicamento_constante'],
                'Gênero': candidato['genero'],
                'Peso': candidato['peso'],
                'Cor da Pele': candidato['cor_pele'],
                'Tatuagem': candidato['tatuagem'],
                'Perfil': candidato['perfil'],
                'Regiões de Preferência': candidato['regioes_preferencia'],
                'Disponibilidade de Horário': candidato['disponibilidade_horario'],
                'Situação': candidato['situacao'],
                'Data de Criação': candidato['created_at'],
                'Última Atualização': candidato['last_updated']
            }

            # Escrever o título da ficha
            worksheet.merge_range('A4:B4', 'Ficha do Candidato', title_format)

            # Posição inicial para os dados
            row = 5

            # Escrever os campos e valores no formato de ficha
            for field, value in fields.items():
                worksheet.write(row, 0, field, header_format)
                worksheet.write(row, 1, value, text_format)
                row += 1

        # Função para remover o arquivo temporário após o envio
        @after_this_request
        def remove_file(response):
            try:
                os.unlink(temp_file.name)  # Remover o arquivo temporário
            except Exception as e:
                print(f"Erro ao deletar o arquivo temporário: {e}")
            return response

        # Enviando o arquivo para o usuário
        return send_file(temp_file.name, as_attachment=True, download_name=f'candidato_{cpf}.xlsx')

    except Exception as e:
        print(f"Erro ao gerar o arquivo: {e}")
        return "Erro ao gerar o arquivo", 500


@app.route('/sistema_os')
def sistema_os():
    return redirect('http://192.168.0.79:8080/')




@app.route('/get_data_nasc/<cpf>', methods=['GET'])
def get_data_nasc(cpf):
    candidato = db.session.query(Candidato).filter_by(cpf=cpf).first()
    if candidato:
        return jsonify({'data_nasc': candidato.data_nasc.strftime('%d/%m/%Y')})
    return jsonify({'error': 'Candidato não encontrado'}), 404



    
    
def determinar_situacao(form_data):
    avaliacao_rh = form_data.get('avaliacao_rh')
    avaliacao_gerencia = form_data.get('avaliacao_gerencia')

    if not form_data.get('created_at'):
        return "Não Preenchido"
    elif avaliacao_rh == 'Aprovado' and avaliacao_gerencia == 'Em Conversa':
        return "Em Conversa"
    elif avaliacao_rh == 'Reprovado':
        return "Reprovado RH"
    elif avaliacao_rh == 'Aprovado' and avaliacao_gerencia == 'Reprovado':
        return "Reprovado Gerente"
    elif avaliacao_rh == 'Aprovado' and avaliacao_gerencia == 'Aprovado':
        return "Aprovado Gerente"
    elif avaliacao_rh and not avaliacao_gerencia:
        return "Aprovado RH"
    else:
        return "Situação Indeterminada"



    
@app.route('/view_registration/<cpf>')
@login_required
def view_registration(cpf):
    db = get_db()
    form_data = db.execute('SELECT * FROM registration_form WHERE cpf = ?', (cpf,)).fetchone()

    if form_data:
        form_data = dict(form_data)  # Convertendo para dicionário para fácil acesso
        form_data['situacao'] = determinar_situacao(form_data)

    return render_template('view_registration.html', form_data=form_data, form=form_data)

@app.route('/view_form/<cpf>', methods=['GET', 'POST'])
@login_required
def view_form(cpf):
    db = get_db()

    # Configura o fuso horário de Brasília
    tz_brasilia = pytz.timezone('America/Sao_Paulo')
    current_date = datetime.now(tz_brasilia).strftime('%Y-%m-%d %H:%M:%S')  # Data atual no horário de Brasília

    # Verifica se o formulário já existe no banco
    form = db.execute('SELECT * FROM registration_form WHERE cpf = ?', (cpf,)).fetchone()

    if not form:
        # Se não existe, busca informações nos tickets
        ticket = db.execute('SELECT * FROM tickets WHERE cpf = ?', (cpf,)).fetchone()
        if ticket:
            form_data = {
                'cpf': ticket['cpf'],
                'nome_completo': ticket['name'],
                'cep': ticket['cep'],
                'endereco': ticket['rua'],
                'numero': ticket['numero'],
                'complemento': ticket['complemento'],
                'bairro': ticket['bairro'],
                'cidade': ticket['cidade'],
                'telefones': ticket['telefones'],
                'cargo_pretendido': [],
                'cargo_indicado': [],
                'regioes_preferencia': [],
                'created_at': current_date,  # Define a data de criação
                'recrutador': current_user.username,  # Nome do recrutador
                'situacao': None,  # Inicializa a situação
                'avaliacao_rh': '',
                'avaliacao_gerencia': ''
            }
        else:
            form_data = {
                'cpf': cpf,
                'created_at': current_date,  # Define a data de criação
                'recrutador': current_user.username,  # Nome do recrutador
                'situacao': None,  # Inicializa a situação
                'avaliacao_rh': '',
                'avaliacao_gerencia': ''
            }
    else:
        # Carrega os dados do formulário existente
        form_data = dict(form)
        form_data['cargo_pretendido'] = form_data['cargo_pretendido'].split(',') if form_data.get('cargo_pretendido') else []
        form_data['cargo_indicado'] = form_data['cargo_indicado'].split(',') if form_data.get('cargo_indicado') else []
        form_data['regioes_preferencia'] = form_data['regioes_preferencia'].split(',') if form_data.get('regioes_preferencia') else []

        # Adiciona as idades dos filhos no form_data, verificando se a chave existe
        form_data['idade_filho_1'] = form['idade_filho_1'] if 'idade_filho_1' in form.keys() else ''
        form_data['idade_filho_2'] = form['idade_filho_2'] if 'idade_filho_2' in form.keys() else ''
        form_data['idade_filho_3'] = form['idade_filho_3'] if 'idade_filho_3' in form.keys() else ''
        form_data['idade_filho_4'] = form['idade_filho_4'] if 'idade_filho_4' in form.keys() else ''
        form_data['idade_filho_5'] = form['idade_filho_5'] if 'idade_filho_5' in form.keys() else ''
        form_data['idade_filho_6'] = form['idade_filho_6'] if 'idade_filho_6' in form.keys() else ''
        form_data['idade_filho_7'] = form['idade_filho_7'] if 'idade_filho_7' in form.keys() else ''
        form_data['idade_filho_8'] = form['idade_filho_8'] if 'idade_filho_8' in form.keys() else ''
        form_data['idade_filho_9'] = form['idade_filho_9'] if 'idade_filho_9' in form.keys() else ''
        form_data['idade_filho_10'] = form['idade_filho_10'] if 'idade_filho_10' in form.keys() else ''

    # Verifica se a situação é "em conversa" e se o usuário atual não é o recrutador
    if form and form_data['situacao'] == 'em conversa' and current_user.username != form_data['recrutador']:
        flash('Você não tem permissão para alterar esta ficha, pois está em conversa.', 'danger')
        return render_template('view_registration.html', form_data=form_data, situacao=form_data.get('situacao'), current_date=current_date)

    if request.method == 'POST':
        # Atualiza os dados com os enviados pelo formulário
        form_data.update(request.form.to_dict())  # Coleta os dados do POST
        form_data['last_updated'] = datetime.now(tz_brasilia).strftime('%Y-%m-%d %H:%M:%S')

        # Garantir que a situação e as avaliações sejam capturadas e atualizadas corretamente
        situacao = form_data.get('situacao', None)
        avaliacao_rh = form_data.get('avaliacao_rh', '')
        avaliacao_gerencia = form_data.get('avaliacao_gerencia', '')
        form_data['situacao'] = situacao
        form_data['avaliacao_rh'] = avaliacao_rh
        form_data['avaliacao_gerencia'] = avaliacao_gerencia

        if not form:
            # Inserindo novo registro
            columns = ', '.join(form_data.keys())
            placeholders = ', '.join(['?'] * len(form_data))
            db.execute(f'INSERT INTO registration_form ({columns}) VALUES ({placeholders})', list(form_data.values()))
            flash('Formulário criado com sucesso!', 'success')
        else:
            # Atualizando registro existente
            update_query = ', '.join([f"{key} = ?" for key in form_data.keys() if key not in ['created_at', 'recrutador']])
            values = [form_data[key] for key in form_data.keys() if key not in ['created_at', 'recrutador']] + [cpf]
            db.execute(f'''
                UPDATE registration_form
                SET {update_query}
                WHERE cpf = ?
            ''', values)
            flash('Formulário atualizado com sucesso!', 'success')

        db.commit()
        return redirect(url_for('view_form', cpf=cpf))

    return render_template('view_registration.html', form_data=form_data, situacao=form_data.get('situacao'), current_date=current_date)




@app.route('/update_form/<cpf>', methods=['GET', 'POST'])
@login_required
def update_form(cpf):
    db = get_db()

     # Busca o formulário com base no CPF
    form = db.execute('SELECT * FROM registration_form WHERE cpf = ?', (cpf,)).fetchone()

    if form:
        form = dict(form)

        # Carrega as idades dos filhos
        form['idades_filhos'] = []
        numero_filhos = int(form.get('numero_filhos', 0))  # Obtém o número de filhos

        # Carrega as idades dos filhos
        for i in range(1, numero_filhos + 1):
            idade_filho_coluna = f'idade_filho_{i}'
            form[f'idade_filho_{i}'] = form.get(idade_filho_coluna, '')

    else:
        flash("Formulário não encontrado.", "danger")
        return redirect(url_for('view_form', cpf=cpf))

    if request.method == 'POST':
        try:
            form_data = request.form.to_dict()
            form_data['last_updated'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            # Captura os campos de lista
            cargos_indicados = request.form.getlist('cargo_indicado')
            form_data['cargo_indicado'] = ','.join(cargos_indicados) if cargos_indicados else None

            cargos_pretendidos = request.form.getlist('cargo_pretendido')
            form_data['cargo_pretendido'] = ','.join(cargos_pretendidos) if cargos_pretendidos else None

            regioes_preferencia = request.form.getlist('regioes_preferencia')
            form_data['regioes_preferencia'] = ','.join(regioes_preferencia) if regioes_preferencia else None

            disponibilidade_horario = request.form.getlist('disponibilidade_horario')
            form_data['disponibilidade_horario'] = ','.join(disponibilidade_horario) if disponibilidade_horario else None

            rota_trabalho = request.form.getlist('rota_trabalho')
            form_data['rota_trabalho'] = ','.join(rota_trabalho) if rota_trabalho else None

            # Lógica para capturar as idades dos filhos
            numero_filhos = int(form_data.get('numero_filhos', 0))
            for i in range(1, numero_filhos + 1):
                idade_filho = request.form.get(f'idade_filho_{i}')
                form_data[f'idade_filho_{i}'] = idade_filho if idade_filho else None

            # Lógica para a situação com base nas avaliações
            avaliacao_rh = request.form.get('avaliacao_rh') or None  # None se não houver avaliação
            avaliacao_gerencia = request.form.get('avaliacao_gerencia') or None  # None se não houver avaliação

            # Verifica a situação com base nas avaliações
            if avaliacao_rh == 'Reprovado' or avaliacao_gerencia == 'Reprovado':
                situacao = 'Reprovado'
            elif avaliacao_rh == 'Aprovado' and (avaliacao_gerencia is None or avaliacao_gerencia == ''):
                situacao = 'Aprovado RH'
            elif avaliacao_rh == 'Aprovado' and avaliacao_gerencia == 'Aprovado':
                situacao = 'Aprovado'
            elif avaliacao_rh == 'Aprovado' and avaliacao_gerencia == 'Em Conversa':
                situacao = 'Em Conversa'
            else:
                situacao = 'Não Avaliado'

            # Atualiza a situação
            form_data['situacao'] = situacao

            # Verifica se o recrutador foi definido na primeira vez
            if not form['recrutador']:
                form_data['recrutador'] = current_user.username
                form_data['created_at'] = form['created_at'] if form['created_at'] else datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            # Salvar arquivo de currículo, se houver
            if 'curriculo' in request.files and request.files['curriculo'].filename != '':
                curriculo = request.files['curriculo']
                curriculo_filename = secure_filename(curriculo.filename)
                curriculo_path = os.path.join(UPLOAD_DIR, curriculo_filename)
                curriculo.save(curriculo_path)
                form_data['curriculo'] = curriculo_filename

            # Remove campos vazios
            form_data = {key: value for key, value in form_data.items() if value is not None and value != ''}

            # Atualiza o banco de dados
            update_query = ', '.join([f"{key} = ?" for key in form_data.keys()])
            values = list(form_data.values()) + [cpf]

            db.execute(f'''
                UPDATE registration_form
                SET {update_query}
                WHERE cpf = ?
            ''', values)

            db.commit()
            flash('Formulário atualizado com sucesso!', 'success')
            return redirect(url_for('view_form', cpf=cpf))

        except sqlite3.OperationalError as e:
            print(f"Erro no SQLite: {e}")
            flash('Erro ao atualizar o formulário.', 'danger')
            return f"Erro ao atualizar o formulário: {str(e)}", 500

    # Renderiza o template passando os dados do formulário e a situação
    return render_template('view_registration.html', form_data=form, situacao=form.get('situacao', ''))






@socketio.on('set_recruiter')
@login_required
def set_recruiter(data):
    cpf = data.get('cpf')

    if not cpf:
        socketio.emit('set_recruiter_response', {
            'status': 'error', 
            'message': 'CPF não fornecido.'
        })
        return

    db = get_db()
    try:
        # Atualiza o recrutador da ficha no banco de dados
        db.execute('UPDATE registration_form SET recrutador = ? WHERE cpf = ?', (current_user.username, cpf))
        db.commit()

        # Emite uma resposta para todos os clientes conectados
        socketio.emit('set_recruiter_response', {
            'status': 'success',
            'recrutador': current_user.username,
            'message': 'Recrutador definido com sucesso!',
            'cpf': cpf
        })
    except Exception as e:
        socketio.emit('set_recruiter_response', {
            'status': 'error',
            'message': 'Erro ao definir recrutador.',
            'cpf': cpf
        })


@app.route('/create_ficha_manual', methods=['POST'])
@login_required
def create_ficha_manual():
    nome_completo = request.form.get('nome_completo', '').strip()
    cpf = request.form.get('cpf', '').replace('.', '').replace('-', '').strip()  # Remove pontos e traços do CPF

    db = get_db()

    # Verifica se o CPF já existe no banco de dados
    existing_candidate = db.execute('SELECT cpf FROM registration_form WHERE cpf = ?', (cpf,)).fetchone()

    if existing_candidate:
        flash('Já existe uma ficha criada com este CPF!', 'warning')
        return redirect(url_for('banco_rs'))

    # Se o CPF não existir, insere a nova ficha
    created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # Cria um dicionário com todos os campos que deseja inserir
    form_data = {
        'nome_completo': nome_completo,
        'cpf': cpf,
        'identidade': '',
        'estado_civil': '',
        'data_nasc': '',
        'telefone': '',
        'endereco': '',
        'cep': '',
        'created_at': created_at,
        'complemento': '',
        'bairro': '',
        'numero': '',
        'cidade': '',
        'estado_nasc': '',
        'cidade_nasc': '',
        'idade': '',
        'numero_filhos': '',
        'fumante': '',
        'bebida': '',
        'alergia': '',
        'medicamento_uso_constante': '',
        'qual_medicamento': '',
        'genero': '',
        'peso': '',
        'cor_pele': '',
        'tatuagem': '',
        'perfil': '',
        'cargo_indicado': '',
        'empresa1': '',
        'cidade1': '',
        'estado1': '',
        'funcao1': '',
        'data_admissao1': '',
        'data_saida1': '',
        'motivo_saida1': '',
        'salario1': '',
        'empresa2': '',
        'cidade2': '',
        'estado2': '',
        'funcao2': '',
        'data_admissao2': '',
        'data_saida2': '',
        'motivo_saida2': '',
        'salario2': '',
        'empresa3': '',
        'cidade3': '',
        'estado3': '',
        'funcao3': '',
        'data_admissao3': '',
        'data_saida3': '',
        'motivo_saida3': '',
        'salario3': '',
        'observacoes': '',
        'empregos_informais': '',
        'nome_entrevistador': '',
        'avaliacao_rh': '',
        'assinatura_rh': '',
        'avaliacao_gerencia': '',
        'assinatura_gerencia': '',
        'rota_trabalho': '',
        'filhos': '',
        'medicamento': '',
        'cursos': '',
        'curriculo': '',
        'situacao': '',
        'last_updated': ''
    }

    # Obtenha as colunas da tabela `registration_form`
    columns = ', '.join(form_data.keys())  # Nomes das colunas separados por vírgula
    placeholders = ', '.join(['?' for _ in form_data])  # Placeholders para cada valor

    # Insere os dados usando o dicionário
    db.execute(f'INSERT INTO registration_form ({columns}) VALUES ({placeholders})', tuple(form_data.values()))
    db.commit()

    # Redireciona o usuário para a visualização da ficha recém-criada
    return redirect(url_for('view_form', cpf=cpf))


if __name__ == "__main__":
    with app.app_context():
        init_db()
    socketio.run(app, host='192.168.0.79', port=5050)
