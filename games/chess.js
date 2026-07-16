// ===== CHESS GAME =====
window.ChessGame = {
  launch() {
    const area = document.getElementById('game-area');
    document.getElementById('game-instructions').innerHTML =
      '👑 = Putih (Kamu) &nbsp;|&nbsp; ⚔️ = Hitam (AI) &nbsp;|&nbsp; Klik bidak dan pilih tujuan';

    const style = document.createElement('style');
    style.textContent = `
      .chess-wrap { display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; max-width: 480px; margin: 0 auto; }
      .chess-status { font-family: Orbitron, monospace; font-size: 15px; font-weight: 700; text-align: center; color: #f0f0ff; text-transform: uppercase; letter-spacing: 1.5px; min-height: 24px; }
      .chess-board {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        grid-template-rows: repeat(8, 1fr);
        width: 100%;
        aspect-ratio: 1;
        border-radius: 16px;
        overflow: hidden;
        border: 2px solid rgba(139, 92, 246, 0.25);
        box-shadow: 0 10px 30px rgba(0,0,0,0.4), inset 0 0 20px rgba(139, 92, 246, 0.05);
        position: relative;
        background: rgba(255,255,255,0.02);
      }
      .chess-square {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;
        user-select: none;
        transition: all 0.2s ease;
      }
      .chess-square.light {
        background-color: rgba(255, 255, 255, 0.07);
      }
      .chess-square.dark {
        background-color: rgba(139, 92, 246, 0.15);
      }
      .chess-piece {
        font-size: 2.2rem;
        z-index: 2;
        transition: transform 0.2s ease;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
      }
      @media (max-width: 400px) {
        .chess-piece { font-size: 1.6rem; }
      }
      .chess-piece.white {
        color: #f8fafc;
        filter: drop-shadow(0 2px 6px rgba(255,255,255,0.2)) drop-shadow(0 2px 4px rgba(0,0,0,0.6));
      }
      .chess-piece.black {
        color: #1e1b4b;
        filter: drop-shadow(0 2px 6px rgba(139, 92, 246, 0.5)) drop-shadow(0 2px 4px rgba(0,0,0,0.8));
      }
      .chess-square.selected {
        background-color: rgba(139, 92, 246, 0.45) !important;
        box-shadow: inset 0 0 10px rgba(139, 92, 246, 0.8);
      }
      .chess-square.valid-move::after {
        content: '';
        width: 16px;
        height: 16px;
        background: rgba(16, 185, 129, 0.6);
        border-radius: 50%;
        position: absolute;
        z-index: 3;
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
      }
      .chess-square.valid-move.has-piece::after {
        width: 80%;
        height: 80%;
        background: transparent;
        border: 4px solid rgba(239, 68, 68, 0.6);
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
      }
      .chess-square.last-move {
        background-color: rgba(245, 158, 11, 0.25) !important;
      }
      .chess-info {
        display: flex;
        justify-content: space-between;
        width: 100%;
        background: rgba(255, 255, 255, 0.02);
        padding: 10px 16px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .chess-captured {
        display: flex;
        gap: 4px;
        font-size: 1.2rem;
        min-height: 24px;
      }
    `;
    document.head.appendChild(style);

    area.innerHTML = `
      <div class="chess-wrap">
        <div class="chess-info">
          <div>
            <span style="font-size: 11px; color:#9090b8; display:block">Bidak AI Terambil</span>
            <div class="chess-captured" id="chess-captured-black"></div>
          </div>
          <div style="text-align: right">
            <span style="font-size: 11px; color:#9090b8; display:block">Bidakmu Terambil</span>
            <div class="chess-captured" id="chess-captured-white"></div>
          </div>
        </div>
        <div class="chess-status" id="chess-status">Giliranmu (Putih)</div>
        <div class="chess-board" id="chess-board"></div>
        <button class="btn-primary" id="chess-reset" style="margin-top: 4px">🔄 Reset Papan</button>
      </div>
    `;

    // Chess Logic
    const PIECES = {
      p: { symbol: '♟', value: 10, name: 'Pawn' },
      r: { symbol: '♜', value: 50, name: 'Rook' },
      n: { symbol: '♞', value: 30, name: 'Knight' },
      b: { symbol: '♝', value: 30, name: 'Bishop' },
      q: { symbol: '♛', value: 90, name: 'Queen' },
      k: { symbol: '♚', value: 900, name: 'King' }
    };

    let board = [];
    let selectedSquare = null;
    let validMoves = [];
    let turn = 'w'; // 'w' or 'b'
    let score = 0;
    let lastMove = null; // {from, to}
    let capturedWhite = [];
    let capturedBlack = [];

    function initBoard() {
      board = [
        [ { type: 'r', color: 'b' }, { type: 'n', color: 'b' }, { type: 'b', color: 'b' }, { type: 'q', color: 'b' }, { type: 'k', color: 'b' }, { type: 'b', color: 'b' }, { type: 'n', color: 'b' }, { type: 'r', color: 'b' } ],
        [ { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' } ],
        [ null, null, null, null, null, null, null, null ],
        [ null, null, null, null, null, null, null, null ],
        [ null, null, null, null, null, null, null, null ],
        [ null, null, null, null, null, null, null, null ],
        [ { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' } ],
        [ { type: 'r', color: 'w' }, { type: 'n', color: 'w' }, { type: 'b', color: 'w' }, { type: 'q', color: 'w' }, { type: 'k', color: 'w' }, { type: 'b', color: 'w' }, { type: 'n', color: 'w' }, { type: 'r', color: 'w' } ]
      ];
      selectedSquare = null;
      validMoves = [];
      turn = 'w';
      score = 0;
      lastMove = null;
      capturedWhite = [];
      capturedBlack = [];
      window.updateScore(0);
      renderBoard();
      updateCapturedUI();
    }

    function renderBoard() {
      const boardEl = document.getElementById('chess-board');
      if (!boardEl) return;
      boardEl.innerHTML = '';

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const square = document.createElement('div');
          const isLight = (r + c) % 2 === 0;
          square.className = `chess-square ${isLight ? 'light' : 'dark'}`;
          square.dataset.row = r;
          square.dataset.col = c;

          if (lastMove && ((lastMove.from.r === r && lastMove.from.c === c) || (lastMove.to.r === r && lastMove.to.c === c))) {
            square.classList.add('last-move');
          }

          if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
            square.classList.add('selected');
          }

          const isVM = validMoves.some(m => m.r === r && m.c === c);
          if (isVM) {
            square.classList.add('valid-move');
            if (board[r][c]) {
              square.classList.add('has-piece');
            }
          }

          const piece = board[r][c];
          if (piece) {
            const pieceEl = document.createElement('span');
            pieceEl.className = `chess-piece ${piece.color === 'w' ? 'white' : 'black'}`;
            pieceEl.innerHTML = PIECES[piece.type].symbol;
            square.appendChild(pieceEl);
          }

          square.addEventListener('click', () => onSquareClick(r, c));
          boardEl.appendChild(square);
        }
      }
    }

    function updateCapturedUI() {
      const blackCap = document.getElementById('chess-captured-black');
      const whiteCap = document.getElementById('chess-captured-white');
      if (blackCap) blackCap.innerHTML = capturedBlack.map(p => `<span class="chess-piece white" style="font-size: 1.1rem">${PIECES[p].symbol}</span>`).join('');
      if (whiteCap) whiteCap.innerHTML = capturedWhite.map(p => `<span class="chess-piece black" style="font-size: 1.1rem">${PIECES[p].symbol}</span>`).join('');
    }

    function getMoves(r, c, b = board) {
      const piece = b[r][c];
      if (!piece) return [];
      const color = piece.color;
      const moves = [];

      const addMove = (nr, nc) => {
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const target = b[nr][nc];
          if (!target) {
            moves.push({ r: nr, c: nc });
            return true;
          } else if (target.color !== color) {
            moves.push({ r: nr, c: nc });
            return false;
          }
        }
        return false;
      };

      if (piece.type === 'p') {
        const dir = color === 'w' ? -1 : 1;
        if (r + dir >= 0 && r + dir < 8 && !b[r + dir][c]) {
          moves.push({ r: r + dir, c: c });
          const startRank = color === 'w' ? 6 : 1;
          if (r === startRank && !b[r + 2 * dir][c]) {
            moves.push({ r: r + 2 * dir, c: c });
          }
        }
        for (const dc of [-1, 1]) {
          const nc = c + dc;
          const nr = r + dir;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = b[nr][nc];
            if (target && target.color !== color) {
              moves.push({ r: nr, c: nc });
            }
          }
        }
      } else if (piece.type === 'r') {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dr, dc] of dirs) {
          let nr = r + dr, nc = c + dc;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const empty = addMove(nr, nc);
            if (!empty) break;
            nr += dr; nc += dc;
          }
        }
      } else if (piece.type === 'b') {
        const dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dr, dc] of dirs) {
          let nr = r + dr, nc = c + dc;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const empty = addMove(nr, nc);
            if (!empty) break;
            nr += dr; nc += dc;
          }
        }
      } else if (piece.type === 'q') {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dr, dc] of dirs) {
          let nr = r + dr, nc = c + dc;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const empty = addMove(nr, nc);
            if (!empty) break;
            nr += dr; nc += dc;
          }
        }
      } else if (piece.type === 'n') {
        const offsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        for (const [dr, dc] of offsets) {
          addMove(r + dr, c + dc);
        }
      } else if (piece.type === 'k') {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dr, dc] of dirs) {
          addMove(r + dr, c + dc);
        }
      }

      return moves;
    }

    function playSound() {
      if (window.getGameSettings?.().sound) {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(400, ctx.currentTime);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          osc.stop(ctx.currentTime + 0.1);
        } catch (e) {}
      }
    }

    function checkGameEnd() {
      let whiteKing = false;
      let blackKing = false;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p && p.type === 'k') {
            if (p.color === 'w') whiteKing = true;
            if (p.color === 'b') blackKing = true;
          }
        }
      }

      if (!blackKing) {
        score += 500;
        window.updateScore(score);
        document.getElementById('chess-status').textContent = 'KAMU MENANG! 🏆';
        window.gameOver(score);
        return true;
      }
      if (!whiteKing) {
        document.getElementById('chess-status').textContent = 'AI MENANG! 👾';
        window.gameOver(score);
        return true;
      }
      return false;
    }

    function makeMove(fromR, fromC, toR, toC) {
      const piece = board[fromR][fromC];
      const target = board[toR][toC];

      if (target) {
        if (target.color === 'w') capturedWhite.push(target.type);
        else {
          capturedBlack.push(target.type);
          score += PIECES[target.type].value;
          window.updateScore(score);
        }
      }

      board[toR][toC] = piece;
      board[fromR][fromC] = null;

      if (piece.type === 'p' && (toR === 0 || toR === 7)) {
        piece.type = 'q';
      }

      lastMove = { from: { r: fromR, c: fromC }, to: { r: toR, c: toC } };
      selectedSquare = null;
      validMoves = [];
      playSound();
      updateCapturedUI();

      if (checkGameEnd()) return;

      turn = turn === 'w' ? 'b' : 'w';
      if (turn === 'b') {
        document.getElementById('chess-status').textContent = 'AI Sedang Berpikir... ⚙️';
        setTimeout(aiMove, 600);
      } else {
        document.getElementById('chess-status').textContent = 'Giliranmu (Putih)';
      }
      renderBoard();
    }

    function onSquareClick(r, c) {
      if (turn !== 'w') return;

      const clickedPiece = board[r][c];

      if (selectedSquare) {
        const isVM = validMoves.some(m => m.r === r && m.c === c);
        if (isVM) {
          makeMove(selectedSquare.r, selectedSquare.c, r, c);
          return;
        }
      }

      if (clickedPiece && clickedPiece.color === 'w') {
        selectedSquare = { r, c };
        validMoves = getMoves(r, c);
      } else {
        selectedSquare = null;
        validMoves = [];
      }
      renderBoard();
    }

    function aiMove() {
      let allMoves = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece && piece.color === 'b') {
            const moves = getMoves(r, c);
            moves.forEach(m => {
              allMoves.push({ from: { r, c }, to: m, weight: evaluateMove({ r, c }, m) });
            });
          }
        }
      }

      if (allMoves.length === 0) {
        checkGameEnd();
        return;
      }

      allMoves.sort((a, b) => b.weight - a.weight + (Math.random() - 0.5) * 2);

      const difficultySetting = window.getGameSettings?.().difficulty || 'medium';
      let chosenMove;
      if (difficultySetting === 'easy' && Math.random() > 0.4 && allMoves.length > 1) {
        chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
      } else if (difficultySetting === 'medium' && Math.random() > 0.8 && allMoves.length > 1) {
        chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
      } else {
        chosenMove = allMoves[0];
      }

      makeMove(chosenMove.from.r, chosenMove.from.c, chosenMove.to.r, chosenMove.to.c);
    }

    function evaluateMove(from, to) {
      let weight = 0;
      const piece = board[from.r][from.c];
      const target = board[to.r][to.c];

      if (target) {
        weight += PIECES[target.type].value * 10;
      }

      if (piece.type === 'p') {
        weight += to.r;
      }

      const distFromCenter = Math.abs(3.5 - to.r) + Math.abs(3.5 - to.c);
      weight += (7 - distFromCenter) * 0.5;

      return weight;
    }

    document.getElementById('chess-reset')?.addEventListener('click', initBoard);

    initBoard();

    return {
      destroy() {
        style.remove();
      }
    };
  }
};
