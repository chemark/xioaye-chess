const boardElement = document.getElementById('board');
let board = [];
let selected = null;
let currentPlayer = 'red'; // red moves first

const pieceChars = {
    rK: '帅', rA: '仕', rE: '相', rR: '车', rH: '马', rC: '炮', rP: '兵',
    bK: '将', bA: '士', bE: '象', bR: '车', bH: '马', bC: '炮', bP: '卒'
};

function initBoard() {
    board = Array.from({ length: 10 }, () => Array(9).fill(null));
    const setup = [
        ['bR','bH','bE','bA','bK','bA','bE','bH','bR'],
        [null,'bC',null,null,null,null,null,'bC',null],
        ['bP',null,'bP',null,'bP',null,'bP',null,'bP'],
    ];
    board[0] = setup[0];
    board[2] = setup[2];
    board[1] = setup[1];
    board[7] = ['rP',null,'rP',null,'rP',null,'rP',null,'rP'];
    board[9] = ['rR','rH','rE','rA','rK','rA','rE','rH','rR'];
    board[8] = [null,'rC',null,null,null,null,null,'rC',null];
}

function renderBoard() {
    boardElement.innerHTML = '';
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            const piece = board[r][c];
            if (piece) {
                cell.textContent = pieceChars[piece];
                cell.classList.add(piece[0] === 'r' ? 'red' : 'black');
            }
            cell.addEventListener('click', onCellClick);
            boardElement.appendChild(cell);
        }
    }
}

function inBounds(r, c) {
    return r >= 0 && r < 10 && c >= 0 && c < 9;
}

function isEmpty(r, c) {
    return inBounds(r,c) && !board[r][c];
}

function sameColor(p1, p2) {
    return p1 && p2 && p1[0] === p2[0];
}

function addIfValid(arr, r, c, color) {
    if (!inBounds(r,c)) return;
    const piece = board[r][c];
    if (!piece || piece[0] !== color) {
        arr.push([r,c]);
    }
}

function getRookMoves(r, c, color) {
    const moves = [];
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dr, dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        while (inBounds(nr,nc)) {
            if (!board[nr][nc]) {
                moves.push([nr,nc]);
            } else {
                if (board[nr][nc][0] !== color) moves.push([nr,nc]);
                break;
            }
            nr += dr; nc += dc;
        }
    }
    return moves;
}

function getHorseMoves(r, c, color) {
    const moves = [];
    const candidates = [
        [r+2,c+1,r+1,c],[r+2,c-1,r+1,c],[r-2,c+1,r-1,c],[r-2,c-1,r-1,c],
        [r+1,c+2,r,c+1],[r-1,c+2,r,c+1],[r+1,c-2,r,c-1],[r-1,c-2,r,c-1]
    ];
    for (const [nr,nc,br,bc] of candidates) {
        if (isEmpty(br,bc) && (!board[nr][nc] || board[nr][nc][0] !== color)) {
            if (inBounds(nr,nc)) moves.push([nr,nc]);
        }
    }
    return moves;
}

function getCannonMoves(r, c, color) {
    const moves = [];
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dr,dc] of dirs) {
        let nr = r + dr, nc = c + dc;
        while (inBounds(nr,nc) && !board[nr][nc]) {
            moves.push([nr,nc]);
            nr += dr; nc += dc;
        }
        nr += dr; nc += dc;
        while (inBounds(nr,nc)) {
            if (board[nr][nc]) {
                if (board[nr][nc][0] !== color) moves.push([nr,nc]);
                break;
            }
            nr += dr; nc += dc;
        }
    }
    return moves;
}

function palaceRange(color) {
    if (color === 'r') return {r0:7,r1:9,c0:3,c1:5};
    return {r0:0,r1:2,c0:3,c1:5};
}

function inPalace(color, r, c) {
    const p = palaceRange(color);
    return r >= p.r0 && r <= p.r1 && c >= p.c0 && c <= p.c1;
}

function getKingMoves(r, c, color) {
    const moves = [];
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    const range = palaceRange(color);
    for (const [dr,dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr>=range.r0 && nr<=range.r1 && nc>=range.c0 && nc<=range.c1) {
            if (!board[nr][nc] || board[nr][nc][0] !== color) moves.push([nr,nc]);
        }
    }
    // flying general
    let col = c;
    let enemy = color==='r'?'bK':'rK';
    let step = color==='r'?-1:1;
    let rr = r + step;
    while (inBounds(rr,col)) {
        if (board[rr][col]) {
            if (board[rr][col] === enemy) moves.push([rr,col]);
            break;
        }
        rr += step;
    }
    return moves;
}

function getAdvisorMoves(r, c, color) {
    const moves = [];
    const deltas = [[1,1],[1,-1],[-1,1],[-1,-1]];
    const range = palaceRange(color);
    for (const [dr,dc] of deltas) {
        const nr = r + dr, nc = c + dc;
        if (nr>=range.r0 && nr<=range.r1 && nc>=range.c0 && nc<=range.c1) {
            if (!board[nr][nc] || board[nr][nc][0] !== color) moves.push([nr,nc]);
        }
    }
    return moves;
}

function getElephantMoves(r, c, color) {
    const moves = [];
    const deltas = [[2,2],[2,-2],[-2,2],[-2,-2]];
    for (const [dr,dc] of deltas) {
        const mr = r + dr/2, mc = c + dc/2;
        const nr = r + dr, nc = c + dc;
        if (!isEmpty(mr,mc)) continue;
        if (!inBounds(nr,nc)) continue;
        if (color==='r' && nr<5) continue;
        if (color==='b' && nr>4) continue;
        if (!board[nr][nc] || board[nr][nc][0] !== color) moves.push([nr,nc]);
    }
    return moves;
}

function getPawnMoves(r, c, color) {
    const moves = [];
    const forward = color==='r'? -1 : 1;
    addIfValid(moves, r+forward, c, color);
    if ((color==='r' && r<=4) || (color==='b' && r>=5)) {
        addIfValid(moves, r, c+1, color);
        addIfValid(moves, r, c-1, color);
    }
    return moves;
}

function getLegalMoves(r, c) {
    const piece = board[r][c];
    if (!piece) return [];
    const color = piece[0];
    switch(piece[1]) {
        case 'R': return getRookMoves(r,c,color);
        case 'H': return getHorseMoves(r,c,color);
        case 'C': return getCannonMoves(r,c,color);
        case 'K': return getKingMoves(r,c,color);
        case 'A': return getAdvisorMoves(r,c,color);
        case 'E': return getElephantMoves(r,c,color);
        case 'P': return getPawnMoves(r,c,color);
    }
    return [];
}

function clearHighlights() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('selected','legal');
    });
}

function onCellClick(e) {
    const r = parseInt(e.currentTarget.dataset.row);
    const c = parseInt(e.currentTarget.dataset.col);
    const piece = board[r][c];
    if (selected) {
        const [sr,sc] = selected;
        const legal = getLegalMoves(sr,sc).map(x=>x[0]+','+x[1]);
        if (legal.includes(r+','+c)) {
            board[r][c] = board[sr][sc];
            board[sr][sc] = null;
            selected = null;
            clearHighlights();
            currentPlayer = currentPlayer==='red'?'black':'red';
            renderBoard();
            setTimeout(aiMove, 500);
            return;
        }
    }
    if (piece && piece[0] === (currentPlayer==='red'?'r':'b')) {
        selected = [r,c];
        clearHighlights();
        e.currentTarget.classList.add('selected');
        getLegalMoves(r,c).forEach(([nr,nc]) => {
            const idx = nr*9+nc;
            boardElement.children[idx].classList.add('legal');
        });
    }
}

function aiMove() {
    if (currentPlayer === 'red') return; // wait for black
    const moves = [];
    for (let r=0;r<10;r++) {
        for (let c=0;c<9;c++) {
            const piece = board[r][c];
            if (piece && piece[0] === 'b') {
                const lm = getLegalMoves(r,c);
                lm.forEach(m=>moves.push([[r,c],m]));
            }
        }
    }
    if (moves.length === 0) return;
    const choice = moves[Math.floor(Math.random()*moves.length)];
    const [[sr,sc],[tr,tc]] = choice;
    board[tr][tc] = board[sr][sc];
    board[sr][sc] = null;
    currentPlayer = 'red';
    renderBoard();
}

initBoard();
renderBoard();
