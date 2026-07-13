// ===== TIC TAC TOE GAME =====
window.TicTacToeGame = {
  launch() {
    const area = document.getElementById('game-area');
    document.getElementById('game-instructions').innerHTML =
      '⭕ = Kamu &nbsp;|&nbsp; ❌ = AI (Minimax) &nbsp;|&nbsp; Klik sel untuk bermain';

    const style = document.createElement('style');
    style.textContent = `
      .ttt-wrap { display:flex; flex-direction:column; align-items:center; gap:20px; }
      .ttt-status { font-size:18px; font-weight:600; text-align:center; min-height:28px; }
      .ttt-board { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
      .ttt-cell { width:110px; height:110px; background:rgba(255,255,255,0.05); border:2px solid rgba(255,255,255,0.1); border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:52px; cursor:pointer; transition:all 0.2s; user-select:none; }
      .ttt-cell:hover:not(.taken) { background:rgba(124,58,237,0.15); border-color:#7c3aed; transform:scale(1.03); }
      .ttt-cell.X { color:#ec4899; text-shadow:0 0 20px rgba(236,72,153,0.5); }
      .ttt-cell.O { color:#06b6d4; text-shadow:0 0 20px rgba(6,182,212,0.5); }
      .ttt-cell.win { background:rgba(16,185,129,0.2) !important; border-color:#10b981 !important; animation:ttt-win-pulse 0.5s ease; }
      .ttt-cell.taken { cursor:not-allowed; }
      @keyframes ttt-win-pulse { 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
      .ttt-scores { display:flex; gap:24px; }
      .ttt-score-item { text-align:center; }
      .ttt-score-label { font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:1px; display:block; }
      .ttt-score-val { font-family:Orbitron,monospace; font-size:28px; font-weight:700; }
      .ttt-score-item.you .ttt-score-val { color:#06b6d4; }
      .ttt-score-item.ai .ttt-score-val { color:#ec4899; }
      .ttt-score-item.draw .ttt-score-val { color:#6b7280; }
      .ttt-difficulty { display:flex; gap:8px; }
      .ttt-diff-btn { padding:6px 14px; border-radius:20px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:#9ca3af; font-size:12px; font-weight:600; cursor:pointer; font-family:Outfit,sans-serif; transition:all 0.15s; }
      .ttt-diff-btn.active { background:#7c3aed; border-color:#7c3aed; color:white; }
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
        if(cell) { cell.textContent='❌'; cell.classList.add('O','taken'); }
        const res = checkWinner(board);
        if(res) handleResult(res);
        else document.getElementById('ttt-status').textContent = '⭕ Giliran Kamu!';
      }
    }

    function handleResult(res) {
      gameActive = false;
      if(res.winner === 'draw') {
        scores.draw++;
        document.getElementById('ttt-draw').textContent = scores.draw;
        document.getElementById('ttt-status').textContent = '🤝 Seri!';
        totalScore += 5;
      } else if(res.winner === 'X') {
        scores.you++;
        document.getElementById('ttt-you').textContent = scores.you;
        document.getElementById('ttt-status').textContent = '🎉 Kamu Menang!';
        totalScore += 20;
        res.line?.forEach(i => {
          const cell = document.querySelector(`[data-idx="${i}"]`);
          if(cell) cell.classList.add('win');
        });
      } else {
        scores.ai++;
        document.getElementById('ttt-ai').textContent = scores.ai;
        document.getElementById('ttt-status').textContent = '🤖 AI Menang!';
        totalScore += 0;
        res.line?.forEach(i => {
          const cell = document.querySelector(`[data-idx="${i}"]`);
          if(cell) cell.classList.add('win');
        });
      }
      window.updateScore(totalScore);
      window.gameOver?.(totalScore);
      setTimeout(resetBoard, 2500);
    }

    function resetBoard() {
      board = Array(9).fill(null);
      gameActive = true;
      document.getElementById('ttt-status').textContent = '⭕ Giliran Kamu!';
      renderBoard();
    }

    function renderBoard() {
      const boardEl = document.getElementById('ttt-board');
      if(!boardEl) return;
      boardEl.innerHTML = '';
      board.forEach((v,i)=>{
        const cell = document.createElement('div');
        cell.className = `ttt-cell${v?' taken '+(v==='X'?'X':'O'):''}`;
        cell.textContent = v ? (v==='X'?'⭕':'❌') : '';
        cell.dataset.idx = i;
        cell.addEventListener('click', ()=>{
          if(!gameActive||board[i]) return;
          board[i]='X';
          cell.textContent='⭕';
          cell.classList.add('X','taken');
          const res = checkWinner(board);
          if(res) { handleResult(res); return; }
          document.getElementById('ttt-status').textContent = '🤖 AI berpikir...';
          setTimeout(()=>{aiMove();},400+Math.random()*300);
        });
        boardEl.appendChild(cell);
      });
    }

    // Difficulty buttons
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
