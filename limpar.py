import sqlite3

# Conecta ao banco de dados
conn = sqlite3.connect('app.db')
cursor = conn.cursor()

# Função para limpar todas as tabelas
def limpar_tabelas():
    try:
        tabelas = [
            'interview_candidates', 
            'concluidos', 
            'cancelamentos', 
            'tickets', 
            'user_logs', 
            'registration_form'
        ]
        
        for tabela in tabelas:
            # Executa o comando para deletar todos os registros da tabela
            cursor.execute(f"DELETE FROM {tabela};")
            # Reseta a sequência de autoincremento (opcional)
            cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{tabela}';")
            print(f"Tabela {tabela} limpa.")
        
        # Confirma as alterações
        conn.commit()
        print("Limpeza de todas as tabelas concluída com sucesso.")
    
    except sqlite3.Error as e:
        print(f"Erro ao limpar tabelas: {e}")
    
    finally:
        # Fecha a conexão
        conn.close()

# Chama a função para limpar as tabelas
limpar_tabelas()
