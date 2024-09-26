from app import app, socketio

if __name__ == "__main__":
    socketio.run(app, host='192.168.1.64', port=5000)
