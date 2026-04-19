import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_FILE = "notes.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route('/notes', methods=['GET'])
def get_notes():
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({'error': 'userId required'}), 400

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('SELECT id, title, content FROM notes WHERE user_id = ?', (user_id,))
    notes = [{'id': row[0], 'title': row[1], 'content': row[2]} for row in c.fetchall()]
    conn.close()
    return jsonify(notes)

@app.route('/notes', methods=['POST'])
def create_note():
    data = request.json
    user_id = data.get('userId')
    title = data.get('title')
    content = data.get('content')

    if not all([user_id, title, content]):
        return jsonify({'error': 'Missing required fields'}), 400

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)', (user_id, title, content))
    conn.commit()
    note_id = c.lastrowid
    conn.close()

    return jsonify({'id': note_id, 'message': 'Note created successfully'}), 201

@app.route('/notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({'error': 'userId required'}), 400

    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    # Check if note belongs to user
    c.execute('SELECT user_id FROM notes WHERE id = ?', (note_id,))
    note = c.fetchone()
    if not note:
        conn.close()
        return jsonify({'error': 'Note not found'}), 404
    
    if int(note[0]) != int(user_id):
        conn.close()
        return jsonify({'error': 'Unauthorized'}), 403

    c.execute('DELETE FROM notes WHERE id = ?', (note_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Note deleted successfully'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
