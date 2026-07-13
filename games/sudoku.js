// ===== SUDOKU GAME =====
window.SudokuGame = {
  launch() {
    const area = document.getElementById('game-area');
    document.getElementById('game-instructions').innerHTML =
      'Klik sel → Ketik 1-9 untuk mengisi &nbsp;|&nbsp; Del/Backspace untuk hapus &nbsp;|&nbsp; Hint untuk bantuan';

    const style = document.createElement('style');
    style.textContent = `
      .sudoku-wrap { display:flex; flex-direction:column; align-items:center; gap:18px; }
      .sudoku-toolbar { display:flex; gap:12px; align-items:center; flex-wrap:wrap; justify-content:center; }
      .sudoku-board { display:grid; grid-template-columns:repeat(9,1fr); gap:1.5px; background:rgba(6, 182, 212, 0.25); border:3px solid rgba(6, 182, 212, 0.4); border-radius:12px; overflow:hidden; padding:3px; box-shadow: 0 0 25px rgba(6, 182, 212, 0.2), inset 0 0 15px rgba(6, 182, 212, 0.15); }
      .sudoku-cell { width:42px; height:42px; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:700; font-family:Orbitron,monospace; cursor:pointer; transition:all 0.2s cubic-bezier(0.4, 0, 0.2, 1); user-select:none; border-radius:6px; position:relative; }
      .sudoku-cell.fixed { background:rgba(255, 255, 255, 0.05); color:#a855f7; text-shadow: 0 0 8px rgba(168, 85, 247, 0.4); }
      .sudoku-cell.empty { background:rgba(10, 10, 24, 0.85); color:#06b6d4; }
      .sudoku-cell.selected { background:rgba(6, 182, 212, 0.3) !important; box-shadow:inset 0 0 0 2px #06b6d4, 0 0 15px rgba(6, 182, 212, 0.4); z-index: 2; }
      .sudoku-cell.highlight { background:rgba(124, 58, 237, 0.18); }
      .sudoku-cell.error { background:rgba(239, 68, 68, 0.35) !important; color:#ef4444 !important; text-shadow: 0 0 8px #ef4444; box-shadow: inset 0 0 8px rgba(239, 68, 68, 0.5); }
      .sudoku-cell.correct { background:rgba(16, 185, 129, 0.25); color:#10b981; }
      .sudoku-cell.hint { background:rgba(245, 158, 11, 0.35) !important; color:#f59e0b !important; text-shadow: 0 0 8px #f59e0b; }
      /* 3x3 block borders */
      .sudoku-cell:nth-child(3n) { border-right: 2px solid rgba(6, 182, 212, 0.4); }
      .sudoku-cell:nth-child(9n) { border-right: none; }
      /* Horizontal 3x3 dividers */
      .sudoku-board > div:nth-child(n+19):nth-child(-n+27),
      .sudoku-board > div:nth-child(n+46):nth-child(-n+54) { border-bottom: 2px solid rgba(6, 182, 212, 0.4); }
      
      .sudoku-numpad { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-top:8px; }
      .sudoku-num-btn { width:46px; height:46px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; color:#f0f0ff; font-family:Orbitron,monospace; font-size:18px; font-weight:700; cursor:pointer; transition:all 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
      .sudoku-num-btn:hover { background:rgba(6, 182, 212, 0.25); border-color:#06b6d4; box-shadow: 0 0 10px rgba(6, 182, 212, 0.4); transform: translateY(-2px); }
      .sudoku-num-btn:active { transform: translateY(0); }
      .sudoku-time { font-family:Orbitron,monospace; font-size:16px; color:#06b6d4; text-shadow: 0 0 8px rgba(6, 182, 212, 0.4); font-weight:700; }
      .sudoku-info { display:flex; gap:20px; font-size:13px; color:#9090b8; margin-top:4px; }
      .sudoku-info span { color:#a855f7; font-weight:700; text-shadow: 0 0 5px rgba(168, 85, 247, 0.4); }
    `;
    document.head.appendChild(style);

    area.innerHTML = `
      <div class="sudoku-wrap">
        <div class="sudoku-toolbar">
          <div class="sudoku-time" id="sudoku-timer">00:00</div>
          <button class="btn-secondary" id="sudoku-hint" style="font-size:13px;padding:8px 16px">💡 Hint (<span id="hint-count">3</span>)</button>
          <button class="btn-secondary" id="sudoku-check" style="font-size:13px;padding:8px 16px">✅ Check</button>
          <button class="btn-primary" id="sudoku-new" style="font-size:13px;padding:8px 16px">🔄 Baru</button>
        </div>
        <div class="sudoku-board" id="sudoku-board"></div>
        <div class="sudoku-numpad" id="sudoku-numpad"></div>
        <div class="sudoku-info"><div>Kesalahan: <span id="sudoku-errors">0</span></div><div>Hints: <span id="sudoku-hints-used">0</span></div></div>
      </div>
    `;

    // Puzzles (easy difficulty)
    const PUZZLES = [
      '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
      '003020600900305001001806400008102900700000008006708200002609500800203009005010300',
      '200080300060070084030500209000105408000000000402706000301007040720040060004010003',
      '000000907000420180000705026100904000050000040000507009920108000034059000507000000',
    ];

    let puzzle = [], solution = [], selected = null;
    let errors = 0, hintsLeft = 3, hintsUsed = 0;
    let timerInterval, seconds = 0;
    let score = 0;

    function parsePuzzle(str) {
      return str.split('').map(Number);
    }

    function solveSudoku(board) {
      const b = [...board];
      function isValid(b,pos,num) {
        const row=Math.floor(pos/9), col=pos%9;
        for(let i=0;i<9;i++) { if(b[row*9+i]===num||b[i*9+col]===num) return false; }
        const br=Math.floor(row/3)*3, bc=Math.floor(col/3)*3;
        for(let r=0;r<3;r++) for(let c=0;c<3;c++) if(b[(br+r)*9+bc+c]===num) return false;
        return true;
      }
      function solve() {
        const empty = b.findIndex(v=>!v);
        if(empty===-1) return true;
        for(let n=1;n<=9;n++) {
          if(isValid(b,empty,n)) { b[empty]=n; if(solve()) return true; b[empty]=0; }
        }
        return false;
      }
      solve();
      return b;
    }

    function initPuzzle() {
      const raw = PUZZLES[Math.floor(Math.random()*PUZZLES.length)];
      puzzle = parsePuzzle(raw);
      solution = solveSudoku([...puzzle]);
      errors = 0; hintsLeft = 3; hintsUsed = 0; seconds = 0; score = 0; selected = null;
      document.getElementById('sudoku-errors').textContent = '0';
      document.getElementById('hint-count').textContent = '3';
      document.getElementById('sudoku-hints-used').textContent = '0';
      clearInterval(timerInterval);
      timerInterval = setInterval(updateTimer, 1000);
      render();
    }

    function updateTimer() {
      seconds++;
      const m = String(Math.floor(seconds/60)).padStart(2,'0');
      const s = String(seconds%60).padStart(2,'0');
      document.getElementById('sudoku-timer').textContent = `${m}:${s}`;
    }

    function render() {
      const board = document.getElementById('sudoku-board');
      if(!board) return;
      board.innerHTML = '';
      puzzle.forEach((val,i) => {
        const cell = document.createElement('div');
        const isFixed = parsePuzzle(PUZZLES.find(p=>p)||PUZZLES[0])[i] !== 0 || puzzle[i] !== 0;
        cell.className = `sudoku-cell ${puzzle[i] !== 0 ? 'fixed' : 'empty'}`;
        if(puzzle[i] === 0 && solution[i] !== 0) cell.className = 'sudoku-cell empty';
        // Re-check: original non-zero = fixed
        const origPuzzle = parsePuzzle(board._origPuzzle || PUZZLES[0]);
        cell.textContent = val || '';
        cell.dataset.idx = i;

        if(selected === i) cell.classList.add('selected');

        cell.addEventListener('click', () => {
          selected = i;
          renderHighlights();
        });
        board.appendChild(cell);
      });
      board._origPuzzle = board._origPuzzle || PUZZLES[0];
    }

    function renderHighlights() {
      const cells = document.querySelectorAll('.sudoku-cell');
      cells.forEach(cell => {
        cell.classList.remove('selected','highlight');
        const idx = parseInt(cell.dataset.idx);
        if(idx === selected) {
          cell.classList.add('selected');
        } else if(selected !== null) {
          const selRow = Math.floor(selected/9), selCol = selected%9;
          const cellRow = Math.floor(idx/9), cellCol = idx%9;
          const selBox = [Math.floor(selRow/3), Math.floor(selCol/3)];
          const cellBox = [Math.floor(cellRow/3), Math.floor(cellCol/3)];
          if(cellRow===selRow || cellCol===selCol || (cellBox[0]===selBox[0]&&cellBox[1]===selBox[1])) {
            cell.classList.add('highlight');
          }
        }
      });
    }

    function inputNumber(num) {
      if(selected === null) return;
      const origPuzzle = parsePuzzle(PUZZLES[0]);
      // Check if it was originally fixed
      if(puzzle[selected] !== 0 && !document.querySelector(`[data-idx="${selected}"]`)?.classList.contains('empty')) return;

      const cell = document.querySelector(`[data-idx="${selected}"]`);
      if(!cell) return;

      cell.classList.remove('error','correct','hint');

      if(num === 0) {
        puzzle[selected] = 0;
        cell.textContent = '';
      } else {
        puzzle[selected] = num;
        cell.textContent = num;
        if(num === solution[selected]) {
          cell.classList.add('correct');
          score += 10;
          window.updateScore(score);
          if(puzzle.every((v,i)=>v===solution[i])) {
            setTimeout(()=>winGame(), 300);
          }
        } else {
          cell.classList.add('error');
          errors++;
          document.getElementById('sudoku-errors').textContent = errors;
          if(errors >= 5) setTimeout(()=>endGame(), 500);
        }
      }
    }

    function winGame() {
      clearInterval(timerInterval);
      const timeBonus = Math.max(0, 500 - seconds);
      score += timeBonus;
      window.updateScore(score);
      window.gameOver?.(score);
      window.showToast?.(`🎉 Selesai! ${seconds}s | Skor: ${score}`, 'success');
    }

    function endGame() {
      clearInterval(timerInterval);
      window.gameOver?.(score);
      const overlay = document.createElement('div');
      overlay.className = 'game-over-overlay';
      overlay.innerHTML = `
        <div class="game-over-content">
          <div class="game-over-title" style="color:#8b5cf6">GAME OVER</div>
          <div class="game-over-score">${errors} Kesalahan</div>
          <div class="game-over-best">Skor: ${score}</div>
          <div class="game-over-actions">
            <button class="btn-primary" onclick="document.getElementById('game-restart-btn').click()">🔄 Coba Lagi</button>
          </div>
        </div>
      `;
      area.style.position = 'relative';
      area.appendChild(overlay);
    }

    // Numpad
    const numpad = document.getElementById('sudoku-numpad');
    [1,2,3,4,5,6,7,8,9,'✕'].forEach(n => {
      const btn = document.createElement('button');
      btn.className = 'sudoku-num-btn';
      btn.textContent = n;
      btn.addEventListener('click', () => inputNumber(n === '✕' ? 0 : n));
      numpad.appendChild(btn);
    });

    document.getElementById('sudoku-hint')?.addEventListener('click', () => {
      if(hintsLeft <= 0) return window.showToast?.('Tidak ada hint tersisa!', 'error');
      if(selected === null) return window.showToast?.('Pilih sel dulu!', 'info');
      hintsLeft--; hintsUsed++;
      puzzle[selected] = solution[selected];
      const cell = document.querySelector(`[data-idx="${selected}"]`);
      if(cell) { cell.textContent = solution[selected]; cell.className = 'sudoku-cell hint'; }
      document.getElementById('hint-count').textContent = hintsLeft;
      document.getElementById('sudoku-hints-used').textContent = hintsUsed;
    });

    document.getElementById('sudoku-check')?.addEventListener('click', () => {
      let correct = 0, wrong = 0;
      document.querySelectorAll('.sudoku-cell').forEach(cell => {
        const idx = parseInt(cell.dataset.idx);
        if(puzzle[idx] && puzzle[idx] !== 0) {
          if(puzzle[idx] === solution[idx]) { cell.classList.add('correct'); correct++; }
          else { cell.classList.add('error'); wrong++; }
        }
      });
      window.showToast?.(`✅ Benar: ${correct} | ❌ Salah: ${wrong}`, 'info');
    });

    document.getElementById('sudoku-new')?.addEventListener('click', initPuzzle);

    const keyHandler = e => {
      if(e.key>='1'&&e.key<='9') inputNumber(parseInt(e.key));
      else if(e.key==='Backspace'||e.key==='Delete') inputNumber(0);
    };
    document.addEventListener('keydown', keyHandler);

    initPuzzle();

    return {
      destroy() {
        clearInterval(timerInterval);
        document.removeEventListener('keydown', keyHandler);
        style.remove();
      }
    };
  }
};
