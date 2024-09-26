import sqlite3
from werkzeug.security import generate_password_hash

DATABASE = 'app.db'

def add_user(username, name, email, password, is_admin=False):
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    hashed_password = generate_password_hash(password)
    
    try:
        db.execute('INSERT INTO users (username, name, email, password, is_admin) VALUES (?, ?, ?, ?, ?)', 
                    (username, name, email, hashed_password, is_admin))
        db.commit()
        print(f"Usuário '{username}' adicionado com sucesso.")
    except sqlite3.IntegrityError as e:
        print(f"Erro ao adicionar usuário: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    add_user('kaike.vittor', 'Kaike Vittor', 'kaike.vittor@jbconservadora.com.br', '794613852', True)
