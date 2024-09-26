import sqlite3

def clear_recruiter_column(record_id):
    # Conectar ao banco de dados
    db_path = 'app.db'  # Substitua pelo caminho correto do seu banco de dados
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Atualiza a coluna 'recrutador' para NULL ou string vazia onde o id for 55
        cursor.execute('UPDATE registration_form SET recrutador = NULL WHERE id = ?', (record_id,))
        
        # Commit para salvar as mudanças
        conn.commit()
        print(f"Coluna 'recrutador' do registro com id {record_id} foi limpa com sucesso.")

    except sqlite3.Error as e:
        print(f"Erro ao limpar a coluna 'recrutador': {e}")

    finally:
        # Fechar a conexão com o banco de dados
        conn.close()

# Chamada da função para limpar a coluna 'recrutador' do registro com id 55
clear_recruiter_column(55)
