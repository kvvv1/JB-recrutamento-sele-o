import sqlite3

# Caminho para o banco de dados SQLite (altere se necessário)
DATABASE = 'app.db'

def get_agendados_for_recruiter(recruiter_username):
    # Conectando ao banco de dados
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # Para retornar as linhas como dicionários
    cursor = conn.cursor()

    # SQL para capturar os tickets com a categoria "Agendado" e o recrutador específico
    query = '''
        SELECT * FROM tickets 
        WHERE category = "Agendado" AND recruiter = ?
        ORDER BY created_at DESC
    '''

    # Executa a consulta passando o nome do recrutador
    cursor.execute(query, (recruiter_username,))
    agendados = cursor.fetchall()

    # Fecha a conexão com o banco
    conn.close()

    return agendados

# Testar a função
recruiter = "kaike.vittor"  # Nome do usuário a ser verificado
agendados = get_agendados_for_recruiter(recruiter)

# Exibir os resultados
if agendados:
    print(f"Tickets agendados para o recrutador {recruiter}:")
    for ticket in agendados:
        print(f"Nome: {ticket['name']}, Senha: {ticket['ticket_number']}, Data: {ticket['created_at']}")
else:
    print(f"Nenhum ticket encontrado para o recrutador {recruiter}.")
