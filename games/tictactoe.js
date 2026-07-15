// ===== TIC TAC TOE GAME =====
window.TicTacToeGame = {
  launch() {
    const area = document.getElementById('game-area');
    document.getElementById('game-instructions').innerHTML =
      '⭕ = Kamu &nbsp;|&nbsp; ❌ = AI &nbsp;|&nbsp; Klik sel untuk bermain';

    const style = document.createElement('style');
    style.textContent = `
      .ttt-wrap { display:flex; flex-direction:column; align-items:center; gap:24px; }
      .ttt-status { font-family:Orbitron,monospace; font-size:16px; font-weight:700; text-align:center; min-height:28px; color:#f0f0ff; text-transform:uppercase; letter-spacing:1.5px; transition: all 0.3s ease; }
      .ttt-board { 
        display:grid; 
        grid-template-columns:repeat(3,100px); 
        grid-template-rows:repeat(3,100px);
        gap:12px; 
        background:rgba(6, 182, 212, 0.03); 
        padding:16px; 
        border-radius:24px; 
        border:1px solid rgba(6, 182, 212, 0.15); 
        box-shadow: inset 0 0 20px rgba(6, 182, 212, 0.05), 0 10px 30px rgba(0,0,0,0.2); 
        position: relative;
      }
      .ttt-cell { 
        width:100px; 
        height:100px; 
        background:rgba(255,255,255,0.02); 
        border:1px solid rgba(255,255,255,0.06); 
        border-radius:18px; 
        display:flex; 
        align-items:center; 
        justify-content:center; 
        cursor:pointer; 
        transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
        user-select:none; 
        position: relative;
        overflow: hidden;
      }
      .ttt-cell:hover:not(.taken) { 
        background:rgba(6, 182, 212, 0.1); 
        border-color:rgba(6, 182, 212, 0.5); 
        box-shadow: 0 0 15px rgba(6, 182, 212, 0.2); 
        transform: translateY(-2px); 
      }
      .ttt-cell:active:not(.taken) {
        transform: scale(0.95);
      }
      .ttt-cell.taken { cursor:not-allowed; }
      
      /* Symbol Animations */
      .ttt-symbol {
        width: 65%;
        height: 65%;
        display: block;
      }
      
      .circle-symbol circle {
        stroke-dasharray: 220;
        stroke-dashoffset: 220;
        animation: ttt-draw-circle 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        filter: drop-shadow(0 0 6px rgba(6, 182, 212, 0.8));
      }
      
      .cross-symbol line {
        stroke-dasharray: 100;
        stroke-dashoffset: 100;
        animation: ttt-draw-line 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        filter: drop-shadow(0 0 6px rgba(236, 72, 153, 0.8));
      }
      .cross-symbol line:nth-child(2) {
        animation-delay: 0.18s;
      }
      
      @keyframes ttt-draw-circle {
        to { stroke-dashoffset: 0; }
      }
      @keyframes ttt-draw-line {
        to { stroke-dashoffset: 0; }
      }
      
      /* Hover Preview */
      .ttt-preview {
        width: 60%;
        height: 60%;
        opacity: 0;
        transition: opacity 0.2s ease, transform 0.2s ease;
        pointer-events: none;
        transform: scale(0.8);
      }
      .ttt-cell:hover:not(.taken) .ttt-preview {
        opacity: 1;
        transform: scale(1);
      }
      .ttt-preview circle {
        animation: ttt-rotate-preview 10s linear infinite;
        transform-origin: center;
      }
      @keyframes ttt-rotate-preview {
        to { transform: rotate(360deg); }
      }
      
      /* Winning states */
      .ttt-cell.win { 
        background:rgba(16,185,129,0.12) !important; 
        border-color:rgba(16,185,129,0.4) !important; 
        box-shadow: 0 0 20px rgba(16,185,129,0.3); 
        animation:ttt-win-pulse 0.8s ease-in-out infinite alternate; 
      }
      @keyframes ttt-win-pulse { 
        0%{transform:scale(1)} 
        100%{transform:scale(1.04)} 
      }
      
      .ttt-scores { display:flex; gap:20px; background:rgba(255,255,255,0.02); padding:10px 20px; border-radius:16px; border:1px solid rgba(255,255,255,0.05); }
      .ttt-score-item { text-align:center; min-width:60px; }
      .ttt-score-label { font-size:10px; color:#9090b8; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:4px; }
      .ttt-score-val { font-family:Orbitron,monospace; font-size:24px; font-weight:700; }
      .ttt-score-item.you .ttt-score-val { color:#06b6d4; text-shadow: 0 0 8px rgba(6,182,212,0.3); }
      .ttt-score-item.ai .ttt-score-val { color:#ec4899; text-shadow: 0 0 8px rgba(236,72,153,0.3); }
      .ttt-score-item.draw .ttt-score-val { color:#9090b8; }
      
      .ttt-difficulty { display:flex; gap:10px; }
      .ttt-diff-btn { padding:6px 16px; border-radius:20px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); color:#9090b8; font-size:11px; font-weight:600; cursor:pointer; font-family:Outfit,sans-serif; transition:all 0.2s; }
      .ttt-diff-btn:hover { background:rgba(255,255,255,0.08); color:#f0f0ff; }
      .ttt-diff-btn.active { background:linear-gradient(135deg,#7c3aed,#06b6d4); border-color:#06b6d4; color:white; box-shadow: 0 0 10px rgba(6,182,212,0.4); }
      
      .ttt-win-line {
        filter: drop-shadow(0 0 10px var(--glow-color));
      }
    `;
    document.head.appendChild(style);

    area.innerHTML = `
      <div class="ttt-wrap">
        <div class="ttt-scores">
          <div class="ttt-score-item you"><span class="ttt-score-label">⭕ Kamu</span><span class="ttt-score-val" id="ttt-you">0</span></div>
          <div class="ttt-score-item draw"><span class="ttt-score-label">Seri</span><span class="ttt-score-val" id="ttt-draw">0</span></div>
          <div class="ttt-score-item ai"><span class="ttt-score-label">❌ AI</span><span class="ttt-score-val" id="ttt-ai">0</span></div>
        </div>
        <div class="ttt-difficulty">
          <button class="ttt-diff-btn" data-diff="easy">Mudah</button>
          <button class="ttt-diff-btn active" data-diff="medium">Sedang</button>
          <button class="ttt-diff-btn" data-diff="hard">Sulit</button>
        </div>
        <div class="ttt-status" id="ttt-status">⭕ Giliran Kamu!</div>
        <div class="ttt-board" id="ttt-board"></div>
        <button class="btn-primary" id="ttt-reset" style="margin-top:4px">🔄 Reset</button>
      </div>
    `;

    let board = Array(9).fill(null);
    let gameActive = true;
    let scores = {you:0,ai:0,draw:0};
    let totalScore = 0;
    let difficulty = 'medium';

    const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    
    const WIN_LINES = {
      '0,1,2': { x1: '5%', y1: '16.6%', x2: '95%', y2: '16.6%' },
      '3,4,5': { x1: '5%', y1: '50%', x2: '95%', y2: '50%' },
      '6,7,8': { x1: '5%', y1: '83.3%', x2: '95%', y2: '83.3%' },
      '0,3,6': { x1: '16.6%', y1: '5%', x2: '16.6%', y2: '95%' },
      '1,4,7': { x1: '50%', y1: '5%', x2: '50%', y2: '95%' },
      '2,5,8': { x1: '83.3%', y1: '5%', x2: '83.3%', y2: '95%' },
      '0,4,8': { x1: '10%', y1: '10%', x2: '90%', y2: '90%' },
      '2,4,6': { x1: '90%', y1: '10%', x2: '10%', y2: '90%' }
    };

    function checkWinner(b) {
      for(const [a,c,d] of WINS) {
        if(b[a] && b[a]===b[c] && b[a]===b[d]) return {winner:b[a], line:[a,c,d]};
      }
      return b.every(v=>v) ? {winner:'draw'} : null;
    }

    function minimax(b, isMax, alpha=-Infinity, beta=Infinity) {
      const res = checkWinner(b);
      if(res) { if(res.winner==='X') return -10; if(res.winner==='O') return 10; return 0; }
      if(isMax) {
        let best = -Infinity;
        for(let i=0;i<9;i++) {
          if(!b[i]) {
            b[i]='O'; best=Math.max(best,minimax(b,false,alpha,beta));
            b[i]=null; alpha=Math.max(alpha,best);
            if(beta<=alpha) break;
          }
        }
        return best;
      } else {
        let best = Infinity;
        for(let i=0;i<9;i++) {
          if(!b[i]) {
            b[i]='X'; best=Math.min(best,minimax(b,true,alpha,beta));
            b[i]=null; beta=Math.min(beta,best);
            if(beta<=alpha) break;
          }
        }
        return best;
      }
    }

    function aiMove() {
      const empty = board.reduce((acc,v,i)=>(!v?[...acc,i]:acc),[]);
      if(!empty.length) return;

      let chosen;
      if(difficulty === 'easy') {
        chosen = empty[Math.floor(Math.random()*empty.length)];
      } else if(difficulty === 'medium') {
        if(Math.random() < 0.5) {
          chosen = empty[Math.floor(Math.random()*empty.length)];
        } else {
          let best=-Infinity;
          empty.forEach(i=>{
            board[i]='O';
            const score=minimax(board,false);
            board[i]=null;
            if(score>best){best=score;chosen=i;}
          });
        }
      } else {
        let best=-Infinity;
        empty.forEach(i=>{
          board[i]='O';
          const score=minimax(board,false);
          board[i]=null;
          if(score>best){best=score;chosen=i;}
        });
      }

      if(chosen !== undefined) {
        board[chosen] = 'O';
        const cell = document.querySelector(`[data-idx="${chosen}"]`);
        if(cell) {
          cell.innerHTML = `
            <svg class="ttt-symbol cross-symbol" viewBox="0 0 100 100">
              <line x1="22" y1="22" x2="78" y2="78" stroke="#ec4899" stroke-width="10" stroke-linecap="round" />
              <line x1="78" y1="22" x2="22" y2="78" stroke="#ec4899" stroke-width="10" stroke-linecap="round" />
            </svg>
          `;
          cell.classList.add('taken');
        }
        const res = checkWinner(board);
        if(res) handleResult(res);
        else {
          document.getElementById('ttt-status').textContent = '⭕ Giliran Kamu!';
          document.getElementById('ttt-status').style.color = '#06b6d4';
        }
      }
    }

    function handleResult(res) {
      gameActive = false;
      if(res.winner === 'draw') {
        scores.draw++;
        document.getElementById('ttt-draw').textContent = scores.draw;
        document.getElementById('ttt-status').textContent = '🤝 Seri!';
        document.getElementById('ttt-status').style.color = '#9090b8';
        totalScore += 5;
      } else if(res.winner === 'X') {
        scores.you++;
        document.getElementById('ttt-you').textContent = scores.you;
        document.getElementById('ttt-status').textContent = '🎉 Kamu Menang!';
        document.getElementById('ttt-status').style.color = '#06b6d4';
        totalScore += 20;
        drawWinningLine(res);
      } else {
        scores.ai++;
        document.getElementById('ttt-ai').textContent = scores.ai;
        document.getElementById('ttt-status').textContent = '🤖 AI Menang!';
        document.getElementById('ttt-status').style.color = '#ec4899';
        totalScore += 0;
        drawWinningLine(res);
      }
      window.updateScore(totalScore);
      window.gameOver?.(totalScore);
      setTimeout(resetBoard, 2500);
    }

    // Helper to draw winning line SVG overlay
    function drawWinningLine(res) {
      res.line?.forEach(i => {
        const cell = document.querySelector(`[data-idx="${i}"]`);
        if(cell) cell.classList.add('win');
      });

      const lineKey = res.line?.sort((a,b)=>a-b).join(',');
      const lineData = WIN_LINES[lineKey];
      if (lineData) {
        const boardEl = document.getElementById('ttt-board');
        const winSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        winSvg.id = 'ttt-win-svg';
        winSvg.setAttribute('style', 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:10;');
        
        const glowColor = res.winner === 'X' ? '#06b6d4' : '#ec4899';
        winSvg.style.setProperty('--glow-color', glowColor);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', lineData.x1);
        line.setAttribute('y1', lineData.y1);
        line.setAttribute('x2', lineData.x2);
        line.setAttribute('y2', lineData.y2);
        line.setAttribute('stroke', glowColor);
        line.setAttribute('stroke-width', '8');
        line.setAttribute('stroke-linecap', 'round');
        
        line.style.strokeDasharray = '400';
        line.style.strokeDashoffset = '400';
        line.style.transition = 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        
        winSvg.appendChild(line);
        boardEl.appendChild(winSvg);
        
        setTimeout(() => {
          line.style.strokeDashoffset = '0';
        }, 50);
      }
    }

    function resetBoard() {
      board = Array(9).fill(null);
      gameActive = true;
      document.getElementById('ttt-status').textContent = '⭕ Giliran Kamu!';
      document.getElementById('ttt-status').style.color = '#06b6d4';
      const winSvg = document.getElementById('ttt-win-svg');
      if (winSvg) winSvg.remove();
      renderBoard();
    }

    // Main render
    function renderBoard() {
      const boardEl = document.getElementById('ttt-board');
      if(!boardEl) return;
      boardEl.innerHTML = '';
      
      board.forEach((v,i)=>{
        const cell = document.createElement('div');
        cell.className = 'ttt-cell';
        cell.dataset.idx = i;
        
        if (v === 'X') {
          cell.innerHTML = `
            <svg class="ttt-symbol circle-symbol" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="32" stroke="#06b6d4" stroke-width="10" fill="none" stroke-linecap="round" />
            </svg>
          `;
          cell.classList.add('taken');
        } else if (v === 'O') {
          cell.innerHTML = `
            <svg class="ttt-symbol cross-symbol" viewBox="0 0 100 100">
              <line x1="22" y1="22" x2="78" y2="78" stroke="#ec4899" stroke-width="10" stroke-linecap="round" />
              <line x1="78" y1="22" x2="22" y2="78" stroke="#ec4899" stroke-width="10" stroke-linecap="round" />
            </svg>
          `;
          cell.classList.add('taken');
        } else {
          cell.innerHTML = `
            <svg class="ttt-preview" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="32" stroke="rgba(6, 182, 212, 0.25)" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="6 6" />
            </svg>
          `;
        }

        cell.addEventListener('click', ()=>{
          if(!gameActive||board[i]) return;
          board[i]='X';
          
          cell.innerHTML = `
            <svg class="ttt-symbol circle-symbol" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="32" stroke="#06b6d4" stroke-width="10" fill="none" stroke-linecap="round" />
            </svg>
          `;
          cell.classList.add('taken');
          
          const res = checkWinner(board);
          if(res) { handleResult(res); return; }
          
          document.getElementById('ttt-status').textContent = '🤖 AI berpikir...';
          document.getElementById('ttt-status').style.color = '#ec4899';
          setTimeout(()=>{aiMove();}, 400 + Math.random()*300);
        });
        
        boardEl.appendChild(cell);
      });
    }

    document.querySelectorAll('.ttt-diff-btn').forEach(btn => {
      btn.addEventListener('click', ()=>{
        document.querySelectorAll('.ttt-diff-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        difficulty = btn.dataset.diff;
        resetBoard();
      });
    });

    document.getElementById('ttt-reset')?.addEventListener('click', ()=>{
      scores={you:0,ai:0,draw:0}; totalScore=0;
      document.getElementById('ttt-you').textContent='0';
      document.getElementById('ttt-ai').textContent='0';
      document.getElementById('ttt-draw').textContent='0';
      window.updateScore(0);
      resetBoard();
    });

    renderBoard();

    return {
      destroy() { style.remove(); }
    };
  }
};
