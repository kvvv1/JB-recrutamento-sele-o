from app import get_db, parse_datetime, app  # Importe funções e app do seu app.py
from datetime import datetime
import pytz

BRASILIA_TZ = pytz.timezone('America/Sao_Paulo')

# Função para ajustar o fuso horário de datas existentes
def adjust_existing_dates():
    db = get_db()
    rows = db.execute('SELECT id, created_at, called_at, concluded_at FROM tickets').fetchall()

    for row in rows:
        # Ajustar cada data se necessário
        for column in ['created_at', 'called_at', 'concluded_at']:
            if row[column]:
                try:
                    dt = parse_datetime(row[column])
                    adjusted_date = dt.strftime('%Y-%m-%d %H:%M:%S')
                    db.execute(f'UPDATE tickets SET {column} = ? WHERE id = ?', (adjusted_date, row['id']))
                except ValueError:
                    print(f"Erro ao ajustar a data {row[column]} para o ticket {row['id']}")
    
    db.commit()
    print("Datas existentes ajustadas.")

# Executar ajuste
if __name__ == "__main__":
    with app.app_context():
        adjust_existing_dates()
