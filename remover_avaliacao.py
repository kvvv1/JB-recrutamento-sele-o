import sqlite3

def set_avaliacao_gerencia_null(database_path, id_value):
    try:
        # Conectar ao banco de dados
        conn = sqlite3.connect(database_path)
        cursor = conn.cursor()
        
        # Executar o update para tornar a coluna avaliacao_gerencia nula
        cursor.execute('''
            UPDATE registration_form
            SET avaliacao_gerencia = NULL
            WHERE id = ?
        ''', (id_value,))
        
        # Commit das alterações
        conn.commit()
        print(f"Coluna 'avaliacao_gerencia' da ID {id_value} foi atualizada para NULL.")
        
    except sqlite3.Error as e:
        print(f"Erro ao atualizar o banco de dados: {e}")
    finally:
        # Fechar conexão
        if conn:
            conn.close()

# Caminho do banco de dados e ID
database_path = 'app.db'
set_avaliacao_gerencia_null(database_path, 74)
