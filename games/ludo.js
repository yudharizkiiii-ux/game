// ===== LUDO GAME =====
window.LudoGame = {
  launch() {
    const area = document.getElementById('game-area');
    document.getElementById('game-instructions').innerHTML =
      '🔴 = Bidakmu (Red) &nbsp;|&nbsp; 🟢 = Bidak AI (Green) &nbsp;|&nbsp; Klik dadu untuk memutar, klik bidak untuk memindahkan';

    const style = document.createElement('style');
    style.textContent = `
      .ludo-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; width: 100%; max-width: 440px; margin: 0 auto; }
      .ludo-status { font-family: Orbitron, monospace; font-size: 14px; font-weight: 700; text-align: center; color: #f0f0ff; text-transform: uppercase; letter-spacing: 1px; min-height: 20px; }
      
      /* Ludo Board 15x15 grid */
      .ludo-board {
        display: grid;
        grid-template-columns: repeat(15, 1fr);
        grid-template-rows: repeat(15, 1fr);
        width: 100%;
        aspect-ratio: 1;
        background: #1e293b;
        border-radius: 12px;
        overflow: hidden;
        border: 3px solid rgba(255,255,255,0.08);
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        position: relative;
      }

      .ludo-square {
        border: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      /* Board Colors */
      .ludo-red-yard { background-color: #ef4444 !important; }
      .ludo-green-yard { background-color: #10b981 !important; }
      .ludo-yellow-yard { background-color: #eab308 !important; }
      .ludo-blue-yard { background-color: #3b82f6 !important; }

      .ludo-red-path { background-color: rgba(239, 68, 68, 0.25) !important; }
      .ludo-green-path { background-color: rgba(16, 185, 129, 0.25) !important; }
      .ludo-yellow-path { background-color: rgba(234, 179, 8, 0.25) !important; }
      .ludo-blue-path { background-color: rgba(59, 130, 246, 0.25) !important; }

      .ludo-red-home { background-color: #ef4444 !important; border: 1px solid #fff; }
      .ludo-green-home { background-color: #10b981 !important; border: 1px solid #fff; }

      .ludo-white-sq { background-color: #f8fafc; }
      .ludo-home-center { background: linear-gradient(135deg, #ef4444, #10b981, #eab308, #3b82f6); }

      /* Tokens */
      .ludo-token {
        width: 75%;
        height: 75%;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.4);
        position: absolute;
        z-index: 10;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .ludo-token.red {
        background: radial-gradient(circle at 30% 30%, #ff8787, #e01b1b);
      }
      .ludo-token.green {
        background: radial-gradient(circle at 30% 30%, #8ce99a, #0ca678);
      }
      .ludo-token.movable {
        animation: ludo-bounce 0.6s infinite alternate;
        box-shadow: 0 0 12px #38bdf8, 0 0 4px #0284c7;
        border-color: #38bdf8;
      }
      @keyframes ludo-bounce {
        from { transform: translateY(0) scale(1); }
        to { transform: translateY(-4px) scale(1.08); }
      }

      /* Dice Area */
      .ludo-control-panel {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        background: rgba(255, 255, 255, 0.03);
        padding: 12px 20px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .ludo-dice-container {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .ludo-dice {
        width: 44px;
        height: 44px;
        background: white;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: 800;
        color: #1e293b;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0,0,0,0.25);
        user-select: none;
        transition: transform 0.2s;
        border: 2px solid #cbd5e1;
      }
      .ludo-dice:active {
        transform: scale(0.9);
      }
      .ludo-dice.rolling {
        animation: ludo-roll 0.4s infinite;
      }
      @keyframes ludo-roll {
        0% { transform: rotate(0deg) scale(1.05); }
        50% { transform: rotate(180deg) scale(0.9); }
        100% { transform: rotate(360deg) scale(1.05); }
      }
    `;
    document.head.appendChild(style);

    area.innerHTML = `
      <div class="ludo-wrap">
        <div class="ludo-control-panel">
          <div class="ludo-dice-container">
            <div class="ludo-dice" id="ludo-dice">🎲</div>
            <span style="font-size: 12px; color: #9090b8" id="ludo-roll-info">Putar Dadu!</span>
          </div>
          <div style="text-align: right">
            <span style="font-size: 11px; color: #9090b8; display:block">Skor</span>
            <span style="font-family: Orbitron, monospace; font-size: 18px; font-weight:700; color: #10b981" id="ludo-score-val">0</span>
          </div>
        </div>
        <div class="ludo-status" id="ludo-status">Giliranmu! Lempar dadu.</div>
        <div class="ludo-board" id="ludo-board"></div>
        <button class="btn-primary" id="ludo-reset" style="margin-top: 4px">🔄 Reset Game</button>
      </div>
    `;

    // Coordinates mapping for 15x15 board
    // Player Red Path (Starts at (6,1), moves clockwise, goes into Red Home (7,1)-(7,6))
    const redPath = [
      {r: 6, c: 1}, {r: 6, c: 2}, {r: 6, c: 3}, {r: 6, c: 4}, {r: 6, c: 5},
      {r: 5, c: 6}, {r: 4, c: 6}, {r: 3, c: 6}, {r: 2, c: 6}, {r: 1, c: 6}, {r: 0, c: 6},
      {r: 0, c: 7}, // top-middle neutral
      {r: 0, c: 8}, {r: 1, c: 8}, {r: 2, c: 8}, {r: 3, c: 8}, {r: 4, c: 8}, {r: 5, c: 8},
      {r: 6, c: 9}, {r: 6, c: 10}, {r: 6, c: 11}, {r: 6, c: 12}, {r: 6, c: 13}, {r: 6, c: 14},
      {r: 7, c: 14}, // right-middle neutral
      {r: 8, c: 14}, {r: 8, c: 13}, {r: 8, c: 12}, {r: 8, c: 11}, {r: 8, c: 10}, {r: 8, c: 9},
      {r: 9, c: 8}, {r: 10, c: 8}, {r: 11, c: 8}, {r: 12, c: 8}, {r: 13, c: 8}, {r: 14, c: 8},
      {r: 14, c: 7}, // bottom-middle neutral
      {r: 14, c: 6}, {r: 13, c: 6}, {r: 12, c: 6}, {r: 11, c: 6}, {r: 10, c: 6}, {r: 9, c: 6},
      {r: 8, c: 5}, {r: 8, c: 4}, {r: 8, c: 3}, {r: 8, c: 2}, {r: 8, c: 1}, {r: 8, c: 0},
      {r: 7, c: 0}, // left-middle neutral
      // Home path for Red
      {r: 7, c: 1}, {r: 7, c: 2}, {r: 7, c: 3}, {r: 7, c: 4}, {r: 7, c: 5}, {r: 7, c: 6}, {r: 7, c: 7} // finish
    ];

    // AI Green Path (Starts at (8,13), moves clockwise, goes into Green Home (7,13)-(7,8))
    // We can offset Green path indices relative to Red path
    const greenPath = [
      {r: 8, c: 13}, {r: 8, c: 12}, {r: 8, c: 11}, {r: 8, c: 10}, {r: 8, c: 9},
      {r: 9, c: 8}, {r: 10, c: 8}, {r: 11, c: 8}, {r: 12, c: 8}, {r: 13, c: 8}, {r: 14, c: 8},
      {r: 14, c: 7},
      {r: 14, c: 6}, {r: 13, c: 6}, {r: 12, c: 6}, {r: 11, c: 6}, {r: 10, c: 6}, {r: 9, c: 6},
      {r: 8, c: 5}, {r: 8, c: 4}, {r: 8, c: 3}, {r: 8, c: 2}, {r: 8, c: 1}, {r: 8, c: 0},
      {r: 7, c: 0},
      {r: 6, c: 0}, {r: 6, c: 1}, {r: 6, c: 2}, {r: 6, c: 3}, {r: 6, c: 4}, {r: 6, c: 5},
      {r: 5, c: 6}, {r: 4, c: 6}, {r: 3, c: 6}, {r: 2, c: 6}, {r: 1, c: 6}, {r: 0, c: 6},
      {r: 0, c: 7},
      {r: 0, c: 8}, {r: 1, c: 8}, {r: 2, c: 8}, {r: 3, c: 8}, {r: 4, c: 8}, {r: 5, c: 8},
      {r: 6, c: 9}, {r: 6, c: 10}, {r: 6, c: 11}, {r: 6, c: 12}, {r: 6, c: 13}, {r: 6, c: 14},
      {r: 7, c: 14},
      // Home path for Green
      {r: 7, c: 13}, {r: 7, c: 12}, {r: 7, c: 11}, {r: 7, c: 10}, {r: 7, c: 9}, {r: 7, c: 8}, {r: 7, c: 7} // finish
    ];

    // Starting yard (home bases)
    const redHomeBase = [{r: 2, c: 2}, {r: 3, c: 3}];
    const greenHomeBase = [{r: 11, c: 11}, {r: 12, c: 12}];

    let tokens = {
      red: [
        { id: 0, pos: -1, base: redHomeBase[0] }, // -1 means in base yard
        { id: 1, pos: -1, base: redHomeBase[1] }
      ],
      green: [
        { id: 0, pos: -1, base: greenHomeBase[0] },
        { id: 1, pos: -1, base: greenHomeBase[1] }
      ]
    };

    let turn = 'red'; // 'red' (player) or 'green' (AI)
    let diceVal = 0;
    let hasRolled = false;
    let score = 0;

    function renderLudoBoard() {
      const boardEl = document.getElementById('ludo-board');
      if (!boardEl) return;
      boardEl.innerHTML = '';

      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
          const sq = document.createElement('div');
          sq.className = 'ludo-square';
          sq.dataset.row = r;
          sq.dataset.col = c;

          // Style Red Base
          if (r < 6 && c < 6) {
            sq.classList.add('ludo-red-yard');
          }
          // Style Green Base
          else if (r >= 9 && c >= 9) {
            sq.classList.add('ludo-green-yard');
          }
          // Style Yellow Base
          else if (r < 6 && c >= 9) {
            sq.classList.add('ludo-yellow-yard');
          }
          // Style Blue Base
          else if (r >= 9 && c < 6) {
            sq.classList.add('ludo-blue-yard');
          }
          // Center home triangle
          else if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
            sq.classList.add('ludo-home-center');
          }
          // Neutral white paths
          else {
            sq.classList.add('ludo-white-sq');
          }

          // Specially color the starting positions and home tracks
          // Red starting square (6, 1) and path (7, 1)-(7, 6)
          if (r === 6 && c === 1) sq.style.backgroundColor = '#fca5a5';
          if (r === 7 && c >= 1 && c <= 6) sq.classList.add('ludo-red-home');

          // Green starting square (8, 13) and path (7, 9)-(7, 13)
          if (r === 8 && c === 13) sq.style.backgroundColor = '#86efac';
          if (r === 7 && c >= 9 && c <= 13) sq.classList.add('ludo-green-home');

          boardEl.appendChild(sq);
        }
      }

      renderTokens();
    }

    function renderTokens() {
      // Clear existing tokens from squares
      document.querySelectorAll('.ludo-token').forEach(t => t.remove());

      const boardEl = document.getElementById('ludo-board');
      if (!boardEl) return;

      const drawToken = (tok, color) => {
        let coord;
        if (tok.pos === -1) {
          coord = tok.base;
        } else {
          const path = color === 'red' ? redPath : greenPath;
          coord = path[tok.pos];
        }

        // Find the square element on the board
        const sqEl = boardEl.querySelector(`[data-row="${coord.r}"][data-col="${coord.c}"]`);
        if (sqEl) {
          const tokEl = document.createElement('div');
          tokEl.className = `ludo-token ${color}`;
          if (color === 'red' && turn === 'red' && hasRolled && isMovable(tok, diceVal)) {
            tokEl.classList.add('movable');
          }
          tokEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (turn === 'red' && color === 'red' && hasRolled) {
              movePlayerToken(tok);
            }
          });
          sqEl.appendChild(tokEl);
        }
      };

      tokens.red.forEach(t => drawToken(t, 'red'));
      tokens.green.forEach(t => drawToken(t, 'green'));
    }

    function isMovable(tok, val) {
      if (tok.pos === -1 && val !== 6) return false;
      if (tok.pos !== -1 && tok.pos + val >= redPath.length) return false;
      return true;
    }

    function playSound(freq = 523, duration = 0.15) {
      if (window.getGameSettings?.().sound) {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          osc.stop(ctx.currentTime + duration);
        } catch (e) {}
      }
    }

    function rollDice() {
      if (hasRolled) return;
      
      const diceEl = document.getElementById('ludo-dice');
      diceEl.classList.add('rolling');
      playSound(300, 0.3);

      setTimeout(() => {
        diceEl.classList.remove('rolling');
        diceVal = Math.floor(Math.random() * 6) + 1;
        const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        diceEl.textContent = faces[diceVal - 1];
        document.getElementById('ludo-roll-info').textContent = `Dadu: ${diceVal}`;
        hasRolled = true;

        // Check if any moves are available
        const currentTokens = turn === 'red' ? tokens.red : tokens.green;
        const availableMoves = currentTokens.filter(t => isMovable(t, diceVal));

        if (availableMoves.length === 0) {
          document.getElementById('ludo-status').textContent = 'Tidak ada gerakan! Giliran berganti.';
          setTimeout(switchTurn, 1000);
        } else {
          renderTokens();
          if (turn === 'green') {
            setTimeout(() => aiDecideMove(availableMoves), 800);
          }
        }
      }, 500);
    }

    function movePlayerToken(tok) {
      if (!isMovable(tok, diceVal)) return;

      if (tok.pos === -1 && diceVal === 6) {
        tok.pos = 0; // enter path
      } else {
        tok.pos += diceVal;
      }

      playSound(600, 0.2);
      checkCaptures();
      checkWinningState();
      renderTokens();

      if (tok.pos === redPath.length - 1) {
        score += 200;
        document.getElementById('ludo-score-val').textContent = score;
        window.updateScore(score);
      }

      switchTurn();
    }

    function aiDecideMove(availableMoves) {
      // AI chooses a token to move
      // Priority: Move token that is already active, or exit base yard if 6
      const exitBase = availableMoves.find(t => t.pos === -1);
      const chosen = exitBase || availableMoves[0];

      if (chosen.pos === -1 && diceVal === 6) {
        chosen.pos = 0;
      } else {
        chosen.pos += diceVal;
      }

      playSound(450, 0.2);
      checkCaptures();
      checkWinningState();
      renderTokens();
      switchTurn();
    }

    function checkCaptures() {
      // If player lands on AI token, send AI token back to yard
      // Same for AI landing on player token
      tokens.red.forEach(rTok => {
        if (rTok.pos === -1 || rTok.pos >= redPath.length - 7) return; // ignore in yard or home track
        const rCoord = redPath[rTok.pos];

        tokens.green.forEach(gTok => {
          if (gTok.pos === -1 || gTok.pos >= greenPath.length - 7) return;
          const gCoord = greenPath[gTok.pos];

          if (rCoord.r === gCoord.r && rCoord.c === gCoord.c) {
            // Collision!
            if (turn === 'red') {
              gTok.pos = -1; // Send AI back to yard
              score += 100;
              document.getElementById('ludo-score-val').textContent = score;
              window.updateScore(score);
              window.showToast('Kamu memakan bidak AI! 🔥', 'info');
              playSound(880, 0.4);
            } else {
              rTok.pos = -1; // Send player back to yard
              window.showToast('Bidakmu dimakan AI! ☠️', 'error');
              playSound(220, 0.4);
            }
          }
        });
      });
    }

    function checkWinningState() {
      // Check if player or AI won (all tokens reached index 56)
      const redWon = tokens.red.every(t => t.pos === redPath.length - 1);
      const greenWon = tokens.green.every(t => t.pos === greenPath.length - 1);

      if (redWon) {
        score += 1000;
        document.getElementById('ludo-score-val').textContent = score;
        window.updateScore(score);
        document.getElementById('ludo-status').textContent = 'KAMU MENANG LUDO! 🏆';
        window.gameOver(score);
      } else if (greenWon) {
        document.getElementById('ludo-status').textContent = 'AI MENANG LUDO! 👾';
        window.gameOver(score);
      }
    }

    function switchTurn() {
      turn = turn === 'red' ? 'green' : 'red';
      hasRolled = false;
      diceVal = 0;
      
      const diceEl = document.getElementById('ludo-dice');
      diceEl.textContent = '🎲';
      document.getElementById('ludo-roll-info').textContent = 'Putar Dadu!';

      if (turn === 'red') {
        document.getElementById('ludo-status').textContent = 'Giliranmu! Lempar dadu.';
      } else {
        document.getElementById('ludo-status').textContent = 'Giliran AI...';
        // Auto roll for AI
        setTimeout(rollDice, 1000);
      }
      renderTokens();
    }

    function initGame() {
      tokens = {
        red: [
          { id: 0, pos: -1, base: redHomeBase[0] },
          { id: 1, pos: -1, base: redHomeBase[1] }
        ],
        green: [
          { id: 0, pos: -1, base: greenHomeBase[0] },
          { id: 1, pos: -1, base: greenHomeBase[1] }
        ]
      };
      turn = 'red';
      diceVal = 0;
      hasRolled = false;
      score = 0;
      document.getElementById('ludo-score-val').textContent = '0';
      window.updateScore(0);
      document.getElementById('ludo-status').textContent = 'Giliranmu! Lempar dadu.';
      renderLudoBoard();
    }

    document.getElementById('ludo-dice')?.addEventListener('click', () => {
      if (turn === 'red') rollDice();
    });

    document.getElementById('ludo-reset')?.addEventListener('click', initGame);

    initGame();

    return {
      destroy() {
        style.remove();
      }
    };
  }
};
