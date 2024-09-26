import sqlite3

# Função para remover múltiplas linhas da tabela tickets com base nos IDs
def remover_linhas_ticket(ticket_ids):
    try:
        # Conectar ao banco de dados
        conn = sqlite3.connect('app.db')  # Substitua pelo caminho correto do seu banco
        cursor = conn.cursor()

        # Executar a remoção para cada ID fornecido
        cursor.executemany('DELETE FROM tickets WHERE id = ?', [(ticket_id,) for ticket_id in ticket_ids])
        
        # Confirmar a transação
        conn.commit()
        
        # Fechar a conexão
        conn.close()

        print(f"Linhas com IDs {ticket_ids} removidas com sucesso.")
    
    except sqlite3.Error as e:
        print(f"Erro ao remover as linhas: {e}")

# Teste da função
remover_linhas_ticket([121])  # Remove as linhas com IDs 14 e 15

