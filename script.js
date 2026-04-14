const boardElement = document.getElementById('board');
const turnDisplay = document.getElementById('turn-display');
const gameModeSelect = document.getElementById('game-mode');
const diffInput = document.getElementById('difficulty');
const diffLabel = document.getElementById('diff-label');

const piecesSymbols = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
};

const pieceValues = { 'p': 10, 'n': 30, 'b': 30, 'r': 50, 'q': 90, 'k': 900, 'P': 10, 'N': 30, 'B': 30, 'R': 50, 'Q': 90, 'K': 900 };

let boardLayout = [];
let selectedSquare = null;
let validMoves = [];
let isWhiteTurn = true;
let isBotThinking = false;

// Funkcja Inicjalizująca - to ona odpowiada za RESET
function initGame() {
    boardLayout = [
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R']
    ];
    isWhiteTurn = true;
    isBotThinking = false;
    selectedSquare = null;
    validMoves = [];
    if(turnDisplay) turnDisplay.innerText = "Białe";
    createBoard();
    console.log("Gra zresetowana. Tryb:", gameModeSelect.value);
}

function createBoard() {
    boardElement.innerHTML = '';
    const whiteInCheck = isKingInCheck(boardLayout, true);
    const blackInCheck = isKingInCheck(boardLayout, false);

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('div');
            square.className = `square ${(r + c) % 2 === 0 ? 'white-sq' : 'black-sq'}`;
            const piece = boardLayout[r][c];
            
            if (piece) {
                square.innerText = piecesSymbols[piece];
                square.style.color = piece === piece.toUpperCase() ? "#fff" : "#000";
                if (piece === piece.toUpperCase()) square.style.textShadow = "0 0 4px #000";
                
                if ((piece === 'K' && whiteInCheck) || (piece === 'k' && blackInCheck)) {
                    square.style.backgroundColor = "#e74c3c";
                }
            }

            if (validMoves.some(m => m.r === r && m.c === c)) {
                square.classList.add('highlight');
                if (piece) square.classList.add('capture');
            }
            if (selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c) square.classList.add('selected');

            square.onclick = () => handleSquareClick(r, c);
            boardElement.appendChild(square);
        }
    }
}

function isKingInCheck(layout, isWhite) {
    let kingPos = null;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (layout[r][c] === (isWhite ? 'K' : 'k')) {
                kingPos = {r, c}; break;
            }
        }
    }
    if (!kingPos) return false;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = layout[r][c];
            if (p && (p === p.toUpperCase()) !== isWhite) {
                const moves = getRawMoves(r, c, layout);
                if (moves.some(m => m.r === kingPos.r && m.c === kingPos.c)) return true;
            }
        }
    }
    return false;
}

function getLegalMoves(r, c, layout) {
    const rawMoves = getRawMoves(r, c, layout);
    const piece = layout[r][c];
    const isWhite = piece === piece.toUpperCase();
    
    return rawMoves.filter(m => {
        const temp = layout[m.r][m.c];
        layout[m.r][m.c] = piece;
        layout[r][c] = '';
        const inCheck = isKingInCheck(layout, isWhite);
        layout[r][c] = piece;
        layout[m.r][m.c] = temp;
        return !inCheck;
    });
}

function getRawMoves(r, c, layout) {
    let moves = [];
    const piece = layout[r][c];
    if (!piece) return [];
    const type = piece.toLowerCase();
    const isWhite = piece === piece.toUpperCase();
    const dirs = {
        'r': [[0,1], [0,-1], [1,0], [-1,0]],
        'b': [[1,1], [1,-1], [-1,1], [-1,-1]],
        'q': [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]],
        'n': [[2,1], [2,-1], [-2,1], [-2,-1], [1,2], [1,-2], [-1,2], [-1,-2]],
        'k': [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]]
    };

    if (type === 'p') {
        const dir = isWhite ? -1 : 1;
        if (layout[r+dir] && layout[r+dir][c] === '') {
            moves.push({r: r+dir, c: c});
            if (r === (isWhite ? 6 : 1) && layout[r+2*dir] && layout[r+2*dir][c] === '') moves.push({r: r+2*dir, c: c});
        }
        [[dir, 1], [dir, -1]].forEach(off => {
            const tr = r + off[0], tc = c + off[1];
            const target = layout[tr] ? layout[tr][tc] : null;
            if (target && (target === target.toUpperCase()) !== isWhite) moves.push({r: tr, c: tc});
        });
    } else if (dirs[type]) {
        dirs[type].forEach(d => {
            let cr = r + d[0], cc = c + d[1];
            while (cr >= 0 && cr < 8 && cc >= 0 && cc < 8) {
                const target = layout[cr][cc];
                if (target === '') {
                    moves.push({r: cr, c: cc});
                    if (type === 'n' || type === 'k') break;
                } else {
                    if ((target === target.toUpperCase()) !== isWhite) moves.push({r: cr, c: cc});
                    break;
                }
                cr += d[0]; cc += d[1];
            }
        });
    }
    return moves;
}

function handleSquareClick(r, c) {
    if (isBotThinking) return;
    const move = validMoves.find(m => m.r === r && m.c === c);

    if (move && selectedSquare) {
        executeMove(selectedSquare[0], selectedSquare[1], r, c);
        if (gameModeSelect.value === 'pve' && !isWhiteTurn) {
            isBotThinking = true;
            setTimeout(makeBotMove, 400);
        }
        return;
    }

    const piece = boardLayout[r][c];
    if (piece && (piece === piece.toUpperCase()) === isWhiteTurn) {
        selectedSquare = [r, c];
        validMoves = getLegalMoves(r, c, boardLayout);
        createBoard();
    } else {
        selectedSquare = null;
        validMoves = [];
        createBoard();
    }
}

function executeMove(fromR, fromC, toR, toC) {
    let piece = boardLayout[fromR][fromC];
    if (piece.toLowerCase() === 'p' && (toR === 0 || toR === 7)) piece = piece === 'P' ? 'Q' : 'q';
    boardLayout[toR][toC] = piece;
    boardLayout[fromR][fromC] = '';
    selectedSquare = null;
    validMoves = [];
    isWhiteTurn = !isWhiteTurn;
    turnDisplay.innerText = isWhiteTurn ? "Białe" : "Czarne";
    createBoard();
}

function makeBotMove() {
    if (isWhiteTurn) return; // Zabezpieczenie przed ruchem bota w turze gracza
    const depth = parseInt(diffInput.value);
    let moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = boardLayout[r][c];
            if (p && p === p.toLowerCase()) {
                getLegalMoves(r, c, boardLayout).forEach(m => moves.push({fr: r, fc: c, tr: m.r, tc: m.c}));
            }
        }
    }

    if (moves.length === 0) {
        alert(isKingInCheck(boardLayout, false) ? "Szach-mat! Białe wygrywają." : "Pat!");
        isBotThinking = false;
        return;
    }

    let bestMove = (depth === 1) ? moves[Math.floor(Math.random() * moves.length)] : null;
    
    if (!bestMove) {
        let bestVal = Infinity;
        moves.forEach(m => {
            const temp = boardLayout[m.tr][m.tc];
            boardLayout[m.tr][m.tc] = boardLayout[m.fr][m.fc];
            boardLayout[m.fr][m.fc] = '';
            let val = minimax(boardLayout, depth - 1, -Infinity, Infinity, true);
            boardLayout[m.fr][m.fc] = boardLayout[m.tr][m.tc];
            boardLayout[m.tr][m.tc] = temp;
            if (val <= bestVal) { bestVal = val; bestMove = m; }
        });
    }

    if (bestMove) executeMove(bestMove.fr, bestMove.fc, bestMove.tr, bestMove.tc);
    isBotThinking = false;
}

function minimax(layout, depth, alpha, beta, isMax) {
    if (depth === 0) return evaluateBoard(layout);
    let moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = layout[r][c];
            if (p && (p === p.toUpperCase()) === isMax) {
                getRawMoves(r, c, layout).forEach(m => moves.push({fr: r, fc: c, tr: m.r, tc: m.c}));
            }
        }
    }

    if (isMax) {
        let v = -Infinity;
        for (let m of moves) {
            const t = layout[m.tr][m.tc];
            layout[m.tr][m.tc] = layout[m.fr][m.fc]; layout[m.fr][m.fc] = '';
            v = Math.max(v, minimax(layout, depth - 1, alpha, beta, false));
            layout[m.fr][m.fc] = layout[m.tr][m.tc]; layout[m.tr][m.tc] = t;
            alpha = Math.max(alpha, v); if (beta <= alpha) break;
        }
        return v;
    } else {
        let v = Infinity;
        for (let m of moves) {
            const t = layout[m.tr][m.tc];
            layout[m.tr][m.tc] = layout[m.fr][m.fc]; layout[m.fr][m.fc] = '';
            v = Math.min(v, minimax(layout, depth - 1, alpha, beta, true));
            layout[m.fr][m.fc] = layout[m.tr][m.tc]; layout[m.tr][m.tc] = t;
            beta = Math.min(beta, v); if (beta <= alpha) break;
        }
        return v;
    }
}

function evaluateBoard(l) {
    let s = 0;
    for(let r=0; r<8; r++) for(let c=0; c<8; c++) {
        const p = l[r][c];
        if(p) s += (p === p.toUpperCase() ? pieceValues[p] : -pieceValues[p]);
    }
    return s;
}

function updateDiffLabel() { diffLabel.innerText = diffInput.value; }

// Inicjalizacja przy pierwszym załadowaniu
initGame();
