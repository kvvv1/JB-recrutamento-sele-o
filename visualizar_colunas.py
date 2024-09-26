import sqlite3

def view_columns(table_name):
    # Conectando ao banco de dados SQLite
    conn = sqlite3.connect('app.db')  # Substitua pelo caminho do seu banco de dados
    cursor = conn.cursor()

    # Executando o comando PRAGMA para obter as informações das colunas
    cursor.execute(f"PRAGMA table_info({table_name});")

    # Recuperando todas as colunas da tabela
    columns = cursor.fetchall()

    # Exibindo o nome e tipo de cada coluna
    print(f"Colunas da tabela '{table_name}':")
    for column in columns:
        print(f"Nome: {column[1]}, Tipo: {column[2]}")

    # Fechando a conexão com o banco de dados
    conn.close()

# Exemplo de uso
if __name__ == "__main__":
    view_columns('tickets')  # Substitua 'tickets' pelo nome da tabela que deseja verificar
