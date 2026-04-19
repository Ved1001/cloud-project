let board = ['', '', '', '', '', '', '', '', ''];
let current_player = 'X';
let mode = 'pvp';
let game_over = false;

// Persistent Settings & Scores
let p1Name = "Player 1";
let p2Name = "Player 2";
let difficulty = "medium";
let scores = { X: 0, O: 0, draws: 0 };

// DOM Elements
const body = document.body;
const themeToggleBtn = document.getElementById('theme-toggle');
const homeScreen = document.getElementById('home-screen');
const menuActions = document.querySelector('.menu-actions');
const setupForm = document.getElementById('setup-form');
const gameScreen = document.getElementById('game-screen');

const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('game-status');
const restartBtn = document.getElementById('restart-btn');
const backBtn = document.getElementById('back-btn');
const btnPvp = document.getElementById('btn-pvp');
const btnAi = document.getElementById('btn-ai');
const startBtn = document.getElementById('start-btn');
const aiLoading = document.getElementById('ai-loading');

function init() {
    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('pink-theme');
    });

    btnPvp.addEventListener('click', () => showSetup('pvp'));
    btnAi.addEventListener('click', () => showSetup('ai'));
    startBtn.addEventListener('click', startGame);
    
    restartBtn.addEventListener('click', restartGame);
    backBtn.addEventListener('click', goHome);
    
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
}

function showSetup(selectedMode) {
    mode = selectedMode;
    menuActions.classList.add('hidden');
    setupForm.classList.remove('hidden');
    
    if (mode === 'pvp') {
        document.getElementById('group-p1').classList.remove('hidden');
        document.getElementById('group-p2').classList.remove('hidden');
        document.getElementById('group-diff').classList.add('hidden');
        document.querySelector('label[for="p1-name"]').innerText = "Player 1 (X) Name:";
    } else {
        document.getElementById('group-p1').classList.remove('hidden');
        document.getElementById('group-p2').classList.add('hidden');
        document.getElementById('group-diff').classList.remove('hidden');
        document.querySelector('label[for="p1-name"]').innerText = "Player (X) Name:";
    }
}

function startGame() {
    p1Name = document.getElementById('p1-name').value.trim() || 'Player 1';
    
    if (mode === 'pvp') {
        p2Name = document.getElementById('p2-name').value.trim() || 'Player 2';
    } else {
        p2Name = "Computer";
        difficulty = document.getElementById('difficulty').value;
    }
    
    document.getElementById('score-name-x').innerText = `${p1Name} (X)`;
    document.getElementById('score-name-o').innerText = `${p2Name} (O)`;
    updateScoreBoard();

    homeScreen.classList.remove('active');
    homeScreen.classList.add('hidden');
    
    gameScreen.classList.remove('hidden');
    setTimeout(() => {
        gameScreen.classList.add('active');
    }, 10);
    
    restartGame();
}

function goHome() {
    gameScreen.classList.remove('active');
    gameScreen.classList.add('hidden');
    
    setupForm.classList.add('hidden');
    menuActions.classList.remove('hidden');
    
    homeScreen.classList.remove('hidden');
    setTimeout(() => {
        homeScreen.classList.add('active');
    }, 10);
}

function getName(symbol) {
    return symbol === 'X' ? p1Name : p2Name;
}

function updateScoreBoard() {
    document.getElementById('score-val-x').innerText = scores.X;
    document.getElementById('score-val-o').innerText = scores.O;
    document.getElementById('score-val-draws').innerText = scores.draws;
}

function restartGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    current_player = 'X';
    game_over = false;
    
    updateUI(board);
    statusText.innerText = `${getName(current_player)}'s Turn`;
}

async function handleCellClick(e) {
    if (game_over) return;
    
    const index = parseInt(e.target.getAttribute('data-index'));
    if (board[index] !== '') return;
    
    if (mode === 'ai' && current_player !== 'X') return;
    
    board[index] = current_player;
    await sendGameState(board, current_player, mode, difficulty);
}

async function sendGameState(requestBoard, requestingPlayer, currentMode, currentDifficulty) {
    if (currentMode === 'ai' && requestingPlayer === 'O') {
        aiLoading.classList.remove('hidden');
    }

    try {
        const response = await fetch('/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                board: requestBoard,
                current_player: requestingPlayer,
                mode: currentMode,
                difficulty: currentDifficulty
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error('Server error:', data.error);
            if (currentMode === 'ai') aiLoading.classList.add('hidden');
            return;
        }

        board = data.updated_board;
        current_player = data.next_player;
        
        if (currentMode === 'ai') {
            aiLoading.classList.add('hidden');
        }

        updateUI(board);

        if (data.winner) {
            game_over = true;
            scores[data.winner]++;
            updateScoreBoard();
            statusText.innerText = `${getName(data.winner)} Wins!`;
            if (data.winningLine) {
                data.winningLine.forEach(idx => {
                    document.querySelector(`.cell[data-index="${idx}"]`).classList.add('win');
                });
            }
            return;
        }

        if (data.draw) {
            game_over = true;
            scores.draws++;
            updateScoreBoard();
            statusText.innerText = 'Game ended in a draw!';
            return;
        }

        if (current_player) {
            statusText.innerText = `${getName(current_player)}'s Turn`;
        }

        if (mode === 'ai' && current_player === 'O' && !game_over) {
            setTimeout(() => {
                sendGameState(board, 'O', mode, difficulty);
            }, 600);
        }

    } catch (error) {
        console.error('Error communicating with backend:', error);
        if (currentMode === 'ai') aiLoading.classList.add('hidden');
        game_over = false;
    }
}

function updateUI(newBoard) {
    cells.forEach((cell, index) => {
        const val = newBoard[index];
        cell.innerText = val;
        cell.className = 'cell';
        if (val === 'X') {
            cell.classList.add('occupied', 'x');
        } else if (val === 'O') {
            cell.classList.add('occupied', 'o');
        }
    });
}

init();
