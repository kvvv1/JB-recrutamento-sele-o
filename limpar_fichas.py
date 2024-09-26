import sqlite3

# Função para limpar as fichas
def delete_all_fichas():
    db_path = 'app.db'  # Substitua pelo caminho correto
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Excluir todos os registros da tabela registration_form
        cursor.execute("DELETE FROM registration_form")
        conn.commit()
        print("Todas as fichas foram excluídas com sucesso.")

    except Exception as e:
        conn.rollback()
        print(f"Ocorreu um erro ao tentar excluir as fichas: {e}")

    finally:
        conn.close()

# Executa a função para excluir as fichas
delete_all_fichas()
