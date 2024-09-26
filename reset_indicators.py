
import sqlite3

def reset_indicators():
    DATABASE = 'app.db'
    
    # Conectar ao banco de dados
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Deletar registros de tickets concluídos
    cursor.execute('DELETE FROM tickets WHERE status = "concluido"')
    rows_deleted = cursor.rowcount
    print(f"Registros deletados: {rows_deleted}")
    
    conn.commit()
    conn.close()
    print("Indicadores resetados com sucesso.")

if __name__ == "__main__":
    reset_indicators()
