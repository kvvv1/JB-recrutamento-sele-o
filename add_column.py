import sqlite3

# Função para adicionar colunas no banco de dados
def add_columns_to_registration_form():
    try:
        # Conecte-se ao banco de dados (ajuste o caminho para o seu banco de dados)
        conn = sqlite3.connect('app.db')
        cursor = conn.cursor()

        # Lista das novas colunas para adicionar (idade_filho_1 até idade_filho_10)
        for i in range(1, 11):
            column_name = f'idade_filho_{i}'
            
            # Verifica se a coluna já existe antes de tentar adicionar
            cursor.execute(f"PRAGMA table_info(registration_form)")
            columns = [info[1] for info in cursor.fetchall()]
            
            if column_name not in columns:
                # Adiciona a nova coluna
                cursor.execute(f"ALTER TABLE registration_form ADD COLUMN {column_name} INTEGER")
                print(f"Coluna {column_name} adicionada com sucesso.")
            else:
                print(f"Coluna {column_name} já existe.")

        # Salvar as mudanças
        conn.commit()

    except sqlite3.Error as e:
        print(f"Erro ao adicionar colunas: {e}")

    finally:
        # Fechar a conexão com o banco de dados
        if conn:
            conn.close()

if __name__ == "__main__":
    add_columns_to_registration_form()
