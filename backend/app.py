import os
from flask import Flask, request, jsonify, send_from_directory
import model

# Determine path to frontend directory relative to this file
current_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dir = os.path.join(current_dir, '..', 'frontend')

app = Flask(__name__, static_folder=frontend_dir, static_url_path='')

@app.route('/')
def index():
    """Serve the main index.html file."""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/move', methods=['POST'])
def process_move():
    """
    Process a move made by a player or calculate the AI move.
    """
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    board = data.get('board')
    current_player = data.get('current_player')
    mode = data.get('mode', 'pvp')
    difficulty = data.get('difficulty', 'medium')
    
    if not isinstance(board, list) or len(board) != 9 or current_player not in ['X', 'O']:
        return jsonify({'error': 'Invalid request parameters'}), 400

    # 1. AI Logic triggers ONLY in AI mode when it is 'O's turn
    if mode == 'ai' and current_player == 'O':
        ai_idx = model.ai_move(board, 'O', difficulty)
        if ai_idx is not None:
            board[ai_idx] = 'O'
            
    # 2. Check if the newly updated board has a winner
    win_result = model.check_winner(board)
    if win_result:
        return jsonify({
            'updated_board': board,
            'next_player': None,
            'winner': win_result['winner'],
            'winningLine': win_result['line'],
            'draw': False
        })
        
    # 3. Check if the game is a draw
    if model.check_draw(board):
        return jsonify({
            'updated_board': board,
            'next_player': None,
            'winner': None,
            'winningLine': None,
            'draw': True
        })

    # The game continues. Swap player.
    next_player = 'O' if current_player == 'X' else 'X'

    return jsonify({
        'updated_board': board,
        'next_player': next_player,
        'winner': None,
        'winningLine': None,
        'draw': False
    })

@app.route('/reset', methods=['POST'])
def reset():
    """Endpoint to reset the game."""
    return jsonify({
        'updated_board': [''] * 9,
        'next_player': 'X',
        'winner': None,
        'winningLine': None,
        'draw': False
    })

if __name__ == '__main__':
    # Run the server
    app.run(debug=True)
