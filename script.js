// Chess Game Logic

const pieces = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

let board = [];
let selectedSquare = null;
let turn = 'white';
let whiteCaptured = [];
let blackCaptured = [];

// Initial board setup
function initBoard() {
    board = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        ['', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
    turn = 'white';
    whiteCaptured = [];
    blackCaptured = [];
    renderBoard();
}

// Render the board
function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    
    const inCheck = isKingInCheck(turn);
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            const isLight = (row + col) % 2 === 0;
            square.className = `square ${isLight ? 'light' : 'dark'}`;
            square.dataset.row = row;
            square.dataset.col = col;
            
            const piece = board[row][col];
            if (piece) {
                square.textContent = pieces[piece];
                // Color the pieces
                if (piece === piece.toUpperCase()) {
                    square.style.color = '#fff';
                    square.style.textShadow = '0 0 2px #000';
                } else {
                    square.style.color = '#000';
                }
            }
            
            if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
                square.classList.add('selected');
            }
            
            // Highlight valid moves
            if (selectedSquare) {
                const validMoves = getValidMoves(selectedSquare.row, selectedSquare.col);
                if (validMoves.some(m => m.row === row && m.col === col)) {
                    square.classList.add('valid-move');
                }
            }
            
            // Highlight king in check
            if (inCheck && piece && (turn === 'white' ? piece === 'K' : piece === 'k')) {
                square.classList.add('check');
            }
            
            square.addEventListener('click', () => handleClick(row, col));
            boardEl.appendChild(square);
        }
    }
    
    updateStatus();
}

// Handle click on square
function handleClick(row, col) {
    const piece = board[row][col];
    
    // If clicking on own piece, select it
    if (piece && isPieceOwn(piece)) {
        selectedSquare = { row, col };
        renderBoard();
        return;
    }
    
    // If a piece is selected, try to move
    if (selectedSquare) {
        const validMoves = getValidMoves(selectedSquare.row, selectedSquare.col);
        const isValidMove = validMoves.some(m => m.row === row && m.col === col);
        
        if (isValidMove) {
            movePiece(selectedSquare.row, selectedSquare.col, row, col);
            selectedSquare = null;
            turn = turn === 'white' ? 'black' : 'white';
            renderBoard();
            return;
        }
        
        // If invalid move, deselect
        selectedSquare = null;
        renderBoard();
    }
}

// Check if piece belongs to current player
function isPieceOwn(piece) {
    if (!piece) return false;
    return turn === 'white' ? piece === piece.toUpperCase() : piece === piece.toLowerCase();
}

// Move piece
function movePiece(fromRow, fromCol, toRow, toCol) {
    const movingPiece = board[fromRow][fromCol];
    const capturedPiece = board[toRow][toCol];
    
    // Handle capture
    if (capturedPiece) {
        if (turn === 'white') {
            whiteCaptured.push(capturedPiece.toUpperCase());
        } else {
            blackCaptured.push(capturedPiece.toLowerCase());
        }
        updateCapturedPieces();
    }
    
    // Move the piece
    board[toRow][toCol] = movingPiece;
    board[fromRow][fromCol] = '';
    
    // Handle pawn promotion (auto-promote to queen)
    if (movingPiece === 'P' && toRow === 0) {
        board[toRow][toCol] = 'Q';
    }
    if (movingPiece === 'p' && toRow === 7) {
        board[toRow][toCol] = 'q';
    }
}

function updateCapturedPieces() {
    document.getElementById('white-captured').textContent = 'Black taken: ' + 
        whiteCaptured.map(p => pieces[p] || p).join(' ');
    document.getElementById('black-captured').textContent = 'White taken: ' + 
        blackCaptured.map(p => pieces[p] || p).join(' ');
}

// Get valid moves for a piece
function getValidMoves(row, col) {
    const piece = board[row][col];
    if (!piece) return [];
    
    const moves = [];
    const pieceType = piece.toUpperCase();
    const isWhite = piece === piece.toUpperCase();
    
    switch (pieceType) {
        case 'P': // Pawn
            const direction = isWhite ? -1 : 1;
            const startRow = isWhite ? 6 : 1;
            
            // Move forward
            if (board[row + direction]?.[col] === '') {
                moves.push({ row: row + direction, col });
                // Double move from start
                if (row === startRow && board[row + 2 * direction]?.[col] === '') {
                    moves.push({ row: row + 2 * direction, col });
                }
            }
            
            // Capture diagonal
            [[row + direction, col - 1], [row + direction, col + 1]].forEach(([r, c]) => {
                const target = board[r]?.[c];
                if (target && (isWhite ? target === target.toLowerCase() : target === target.toUpperCase())) {
                    moves.push({ row: r, col: c });
                }
            });
            break;
            
        case 'R': // Rook
            addSlidingMoves(row, col, [[0, -1], [0, 1], [-1, 0], [1, 0]], moves, isWhite);
            break;
            
        case 'B': // Bishop
            addSlidingMoves(row, col, [[-1, -1], [-1, 1], [1, -1], [1, 1]], moves, isWhite);
            break;
            
        case 'Q': // Queen
            addSlidingMoves(row, col, [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]], moves, isWhite);
            break;
            
        case 'N': // Knight
            const knightMoves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
            knightMoves.forEach(([dr, dc]) => {
                const r = row + dr, c = col + dc;
                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    const target = board[r][c];
                    if (!target || (isWhite ? target === target.toLowerCase() : target === target.toUpperCase())) {
                        moves.push({ row: r, col: c });
                    }
                }
            });
            break;
            
        case 'K': // King
            const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
            kingMoves.forEach(([dr, dc]) => {
                const r = row + dr, c = col + dc;
                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    const target = board[r][c];
                    if (!target || (isWhite ? target === target.toLowerCase() : target === target.toUpperCase())) {
                        moves.push({ row: r, col: c });
                    }
                }
            });
            break;
    }
    
    return moves;
}

// Add sliding moves (rook, bishop, queen)
function addSlidingMoves(row, col, directions, moves, isWhite) {
    directions.forEach(([dr, dc]) => {
        let r = row + dr, c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const target = board[r][c];
            if (target) {
                if (isWhite ? target === target.toLowerCase() : target === target.toUpperCase()) {
                    moves.push({ row: r, col: c });
                }
                break;
            }
            moves.push({ row: r, col: c });
            r += dr;
            c += dc;
        }
    });
}

// Check if king is in check
function isKingInCheck(isWhite) {
    let kingRow, kingCol;
    const king = isWhite ? 'K' : 'k';
    
    // Find the king
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === king) {
                kingRow = r;
                kingCol = c;
                break;
            }
        }
    }
    
    if (!kingRow && kingRow !== 0) return false;
    
    // Check if any enemy piece can attack the king
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && (isWhite ? piece === piece.toLowerCase() : piece === piece.toUpperCase())) {
                const moves = getValidMoves(r, c);
                if (moves.some(m => m.row === kingRow && m.col === kingCol)) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

function updateStatus() {
    const statusEl = document.getElementById('status');
    const inCheck = isKingInCheck(turn);
    
    if (inCheck) {
        statusEl.textContent = `${turn.charAt(0).toUpperCase() + turn.slice(1)}'s King is in Check!`;
    } else {
        statusEl.textContent = `${turn.charAt(0).toUpperCase() + turn.slice(1)}'s Turn`;
    }
}

function resetGame() {
    initBoard();
}

// Start the game
initBoard();
