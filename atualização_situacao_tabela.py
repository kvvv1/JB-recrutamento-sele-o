import sqlite3

# Função para realizar a atualização em massa
def atualizar_situacao_em_massa():
    try:
        # Conectando ao banco de dados SQLite
        conn = sqlite3.connect('app.db')  # Substitua pelo caminho correto do seu banco de dados
        cursor = conn.cursor()

        # Consulta SQL para atualizar a situação
        update_query = '''
            UPDATE registration_form
            SET situacao = 'Aprovado RH'
            WHERE avaliacao_rh = 'Aprovado'
            AND (avaliacao_gerencia IS NULL OR avaliacao_gerencia = '')
            AND situacao != 'Aprovado RH'
        '''

        # Executa a atualização
        cursor.execute(update_query)
        conn.commit()

        print('Atualização em massa realizada com sucesso!')
    
    except sqlite3.OperationalError as e:
        print(f"Erro ao realizar a atualização em massa: {e}")
    
    finally:
        # Fecha a conexão com o banco de dados
        conn.close()

# Executa a função para atualizar a situação
if __name__ == "__main__":
    atualizar_situacao_em_massa()
