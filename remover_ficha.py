import sqlite3

# Função para remover uma linha da tabela registration_form com base no ID
def remover_linha_registration_form(registration_id):
    try:
        # Conectar ao banco de dados
        conn = sqlite3.connect('app.db')  # Substitua pelo caminho correto do seu banco
        cursor = conn.cursor()

        # Executar a remoção com base no ID fornecido
        cursor.execute('DELETE FROM registration_form WHERE id = ?', (registration_id,))
        
        # Confirmar a transação
        conn.commit()
        
        # Fechar a conexão
        conn.close()

        print(f"Linha com ID {registration_id} removida com sucesso.")
    
    except sqlite3.Error as e:
        print(f"Erro ao remover a linha: {e}")

# Teste da função
remover_linha_registration_form(121)  # Remove a linha com ID 8
