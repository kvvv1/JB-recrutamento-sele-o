
import sqlite3

def clear_tickets_and_indicators():
    DATABASE = 'app.db'
    
    # Conectar ao banco de dados
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Deletar todos os registros de tickets
    cursor.execute('DELETE FROM tickets')
    rows_deleted = cursor.rowcount
    print(f"Todos os registros deletados: {rows_deleted}")
    
    conn.commit()
    conn.close()
    print("Todos os tickets e indicadores foram limpos com sucesso.")

if __name__ == "__main__":
    clear_tickets_and_indicators()
