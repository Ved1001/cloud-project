import random

def check_winner(board):
    """
    Checks if there is a winner on the given board.
    Returns a dict with 'winner' and 'line' if a winner is found, else None.
    """
    win_conditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],  # Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8],  # Columns
        [0, 4, 8], [2, 4, 6]              # Diagonals
    ]
    for condition in win_conditions:
        a, b, c = condition
        if board[a] and board[a] == board[b] == board[c]:
            return {'winner': board[a], 'line': condition}
    return None

def check_draw(board):
    """
    Checks if the board is fully occupied resulting in a draw.
    Assumes check_winner is called first.
    """
    return all(cell in ['X', 'O'] for cell in board)

def get_available_moves(board):
    return [i for i, cell in enumerate(board) if cell not in ['X', 'O']]

def validate_move(board, index):
    if 0 <= index <= 8 and board[index] not in ['X', 'O']:
        return True
    return False

def ai_move(board, ai_player, difficulty='medium'):
    """
    Determines the best move for the AI.
    """
    opponent = 'X' if ai_player == 'O' else 'O'
    available_moves = get_available_moves(board)
    
    if not available_moves:
        return None

    if difficulty == 'easy':
        return random.choice(available_moves)

    # Medium and Hard: Priority 1: Check if AI can win
    for move in available_moves:
        board_copy = list(board)
        board_copy[move] = ai_player
        if check_winner(board_copy):
            return move

    # Medium and Hard: Priority 2: Block opponent from winning
    for move in available_moves:
        board_copy = list(board)
        board_copy[move] = opponent
        if check_winner(board_copy):
            return move

    # Hard Mode: Strategic Positioning
    if difficulty == 'hard':
        if 4 in available_moves:
            return 4
        corners = [0, 2, 6, 8]
        available_corners = [c for c in corners if c in available_moves]
        if available_corners:
            return random.choice(available_corners)

    # Priority 3: Random move
    return random.choice(available_moves)
