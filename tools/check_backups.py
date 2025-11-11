#!/usr/bin/env python3
"""
Script para verificação e recuperação automática de backups e arquivos de erro.
Esse script pode ser executado manualmente ou agendado para rodar periodicamente.
"""

import os
import json
import sys
import datetime
import pyodbc
import traceback
from pathlib import Path

# Configuração da conexão com o banco de dados
SERVER = 'localhost'  # Ajuste conforme seu ambiente
DATABASE = 'nome_do_banco'  # Ajuste conforme seu ambiente
USERNAME = 'usuario'  # Ajuste conforme seu ambiente
PASSWORD = 'senha'  # Ajuste conforme seu ambiente

def get_sql_server_connection():
    """Estabelece conexão com o banco de dados SQL Server."""
    try:
        connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={SERVER};DATABASE={DATABASE};UID={USERNAME};PWD={PASSWORD}'
        connection = pyodbc.connect(connection_string)
        return connection
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        return None

def log_message(message, level="INFO"):
    """Registra mensagens de log com timestamp."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

def process_error_file(file_path):
    """Processa um arquivo de erro e tenta salvar os dados no banco."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            error_data = json.load(f)
            
        cpf = error_data.get('cpf')
        dados_form = error_data.get('dados_formulario', {})
        
        if not cpf:
            log_message(f"CPF não encontrado no arquivo {file_path}", "ERROR")
            return False
            
        log_message(f"Processando arquivo de erro para CPF {cpf}")
        
        # Verificar se já existe no banco
        db = get_sql_server_connection()
        if not db:
            return False
            
        cursor = db.cursor()
        
        try:
            cursor.execute('SELECT id FROM registration_form WHERE cpf = ?', (cpf,))
            existing = cursor.fetchone()
            
            if existing:
                # O registro já existe, então não precisa recuperar
                log_message(f"Registro para CPF {cpf} já existe no banco", "INFO")
                os.rename(file_path, file_path + '.processed')
                db.close()
                return True
                
            # Prepara para inserção no banco
            # Remove campos que podem causar problemas
            for field in ['id', 'created_at', 'last_updated']:
                if field in dados_form:
                    dados_form.pop(field)
                    
            # Obter colunas válidas
            cursor.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'registration_form'")
            valid_columns = [row[0] for row in cursor.fetchall()]
            
            # Filtrar para colunas válidas
            dados_filtered = {k: v for k, v in dados_form.items() if k in valid_columns}
            
            # Preparar query
            columns = list(dados_filtered.keys())
            placeholders = ', '.join(['?' for _ in columns])
            values = [dados_filtered[col] for col in columns]
            
            # Inserir no banco
            cursor.execute(f'''
                INSERT INTO registration_form ({', '.join(columns)}, created_at, last_updated)
                VALUES ({placeholders}, GETDATE(), GETDATE())
            ''', values)
            
            # Registrar no log
            cursor.execute('''
                INSERT INTO log_salvamentos (cpf, acao, mensagem, data_hora)
                VALUES (?, ?, ?, GETDATE())
            ''', (cpf, "RECUPERAÇÃO-AUTO", f"Registro recuperado automaticamente de arquivo de erro"))
            
            db.commit()
            
            # Marcar arquivo como processado
            os.rename(file_path, file_path + '.processed')
            
            log_message(f"Registro para CPF {cpf} recuperado com sucesso", "INFO")
            return True
            
        except Exception as db_error:
            log_message(f"Erro ao processar arquivo {file_path}: {str(db_error)}", "ERROR")
            traceback_str = traceback.format_exc()
            log_message(f"Traceback: {traceback_str}", "DEBUG")
            db.rollback()
            return False
            
        finally:
            cursor.close()
            db.close()
            
    except Exception as e:
        log_message(f"Erro ao ler arquivo {file_path}: {str(e)}", "ERROR")
        traceback_str = traceback.format_exc()
        log_message(f"Traceback: {traceback_str}", "DEBUG")
        return False

def process_backup_file(file_path):
    """Processa um arquivo de backup e tenta salvar os dados no banco."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            backup_data = json.load(f)
            
        cpf = backup_data.get('cpf')
        
        if not cpf:
            log_message(f"CPF não encontrado no arquivo {file_path}", "ERROR")
            return False
            
        log_message(f"Processando arquivo de backup para CPF {cpf}")
        
        # Verificar se já existe no banco
        db = get_sql_server_connection()
        if not db:
            return False
            
        cursor = db.cursor()
        
        try:
            cursor.execute('SELECT id FROM registration_form WHERE cpf = ?', (cpf,))
            existing = cursor.fetchone()
            
            if existing:
                # O registro já existe, não precisa recuperar
                log_message(f"Registro para CPF {cpf} já existe no banco", "INFO")
                os.rename(file_path, file_path + '.processed')
                db.close()
                return True
                
            # Prepara para inserção no banco
            # Remove campos que podem causar problemas
            for field in ['id', 'created_at', 'last_updated']:
                if field in backup_data:
                    backup_data.pop(field)
                    
            # Obter colunas válidas
            cursor.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'registration_form'")
            valid_columns = [row[0] for row in cursor.fetchall()]
            
            # Filtrar para colunas válidas
            dados_filtered = {k: v for k, v in backup_data.items() if k in valid_columns}
            
            # Preparar query
            columns = list(dados_filtered.keys())
            placeholders = ', '.join(['?' for _ in columns])
            values = [dados_filtered[col] for col in columns]
            
            # Inserir no banco
            cursor.execute(f'''
                INSERT INTO registration_form ({', '.join(columns)}, created_at, last_updated)
                VALUES ({placeholders}, GETDATE(), GETDATE())
            ''', values)
            
            # Registrar no log
            cursor.execute('''
                INSERT INTO log_salvamentos (cpf, acao, mensagem, data_hora)
                VALUES (?, ?, ?, GETDATE())
            ''', (cpf, "RECUPERAÇÃO-AUTO", f"Registro recuperado automaticamente de arquivo de backup"))
            
            db.commit()
            
            # Marcar arquivo como processado
            os.rename(file_path, file_path + '.processed')
            
            log_message(f"Backup para CPF {cpf} recuperado com sucesso", "INFO")
            return True
            
        except Exception as db_error:
            log_message(f"Erro ao processar arquivo {file_path}: {str(db_error)}", "ERROR")
            traceback_str = traceback.format_exc()
            log_message(f"Traceback: {traceback_str}", "DEBUG")
            db.rollback()
            return False
            
        finally:
            cursor.close()
            db.close()
            
    except Exception as e:
        log_message(f"Erro ao ler arquivo {file_path}: {str(e)}", "ERROR")
        traceback_str = traceback.format_exc()
        log_message(f"Traceback: {traceback_str}", "DEBUG")
        return False

def check_for_orphaned_backups():
    """Verifica e processa arquivos de backup e erro não processados."""
    log_message("Iniciando verificação de arquivos de backup e erro")
    
    # Caminhos para os diretórios
    error_dir = os.path.join('static', 'errors')
    backup_dir = os.path.join('static', 'backups')
    
    # Garantir que os diretórios existem
    for directory in [error_dir, backup_dir]:
        if not os.path.exists(directory):
            os.makedirs(directory)
            log_message(f"Diretório {directory} criado", "INFO")
    
    # Processar arquivos de erro
    error_files = [f for f in os.listdir(error_dir) if f.endswith('.json') and not f.endswith('.processed')]
    log_message(f"Encontrados {len(error_files)} arquivos de erro para processar")
    
    error_success = 0
    error_failure = 0
    
    for error_file in error_files:
        error_path = os.path.join(error_dir, error_file)
        if process_error_file(error_path):
            error_success += 1
        else:
            error_failure += 1
    
    # Processar arquivos de backup
    backup_files = [f for f in os.listdir(backup_dir) if f.endswith('.json') and not f.endswith('.processed')]
    log_message(f"Encontrados {len(backup_files)} arquivos de backup para processar")
    
    backup_success = 0
    backup_failure = 0
    
    for backup_file in backup_files:
        backup_path = os.path.join(backup_dir, backup_file)
        if process_backup_file(backup_path):
            backup_success += 1
        else:
            backup_failure += 1
    
    # Relatório final
    log_message(f"Processamento concluído:", "INFO")
    log_message(f"- Arquivos de erro: {error_success} sucesso, {error_failure} falha", "INFO")
    log_message(f"- Arquivos de backup: {backup_success} sucesso, {backup_failure} falha", "INFO")
    
    total_success = error_success + backup_success
    total_failure = error_failure + backup_failure
    
    return total_success, total_failure

if __name__ == "__main__":
    # Configurar o diretório de trabalho para o diretório raiz do aplicativo
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(os.path.dirname(script_dir))  # Muda para o diretório pai
    
    success, failure = check_for_orphaned_backups()
    
    if failure > 0:
        sys.exit(1)  # Saída não-zero indica erro
    else:
        sys.exit(0)  # Saída zero indica sucesso 