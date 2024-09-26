import sqlite3

def update_recruiter(recruiter_name, record_id):
    # Conectar ao banco de dados
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()

    # Atualizar o nome do recrutador
    cursor.execute('''
        UPDATE registration_form
        SET recrutador = ?
        WHERE id = ?
    ''', (recruiter_name, record_id))

    # Salvar as alterações e fechar a conexão
    conn.commit()
    conn.close()

if __name__ == "__main__":
    update_recruiter('samira.barbosa0', 43)
    print("Recrutador atualizado com sucesso!")
