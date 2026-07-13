// ===== TIC TAC TOE GAME =====
window.TicTacToeGame = {
  launch() {
    const area = document.getElementById('game-area');
    document.getElementById('game-instructions').innerHTML =
      '⭕ = Kamu &nbsp;|&nbsp; ❌ = AI (Minimax) &nbsp;|&nbsp; Klik sel untuk bermain';

    const style = document.createElement('style');
    style.textContent = `
      .ttt-wrap { display:flex; flex-direction:column; align-items:center; gap:24px; }
      .ttt-status { font-family:Orbitron,monospace; font-size:16px; font-weight:700; text-align:center; min-height:28px; color:#f0f0ff; text-transform:uppercase; letter-spacing:1.5px; }
      .ttt-board { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; background:rgba(6, 182, 212, 0.05); padding:16px; border-radius:24px; border:1px solid rgba(6, 182, 212, 0.15); box-shadow: inset 0 0 15px rgba(6, 182, 212, 0.1); }
      .ttt-cell { width:100px; height:100px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:18px; display:flex; align-items:center; justify-content:center; font-size:48px; cursor:pointer; transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1); user-select:none; }
      .ttt-cell:hover:not(.taken) { background:rgba(6, 182, 212, 0.15); border-color:#06b6d4; box-shadow: 0 0 15px rgba(6, 182, 212, 0.3); transform: translateY(-4px) scale(1.02); }
      .ttt-cell.X { color:#ec4899; text-shadow:0 0 15px rgba(236,72,153,0.8), 0 0 30px rgba(236,72,153,0.4); font-family:Orbitron,monospace; font-weight:900; }
      .ttt-cell.O { color:#06b6d4; text-shadow:0 0 15px rgba(6,182,212,0.8), 0 0 30px rgba(6,182,212,0.4); font-family:Orbitron,monospace; font-weight:900; }
      .ttt-cell.win { background:rgba(16,185,129,0.2) !important; border-color:#10b981 !important; box-shadow: 0 0 25px rgba(16,185,129,0.5); animation:ttt-win-pulse 0.6s ease infinite alternate; }
      .ttt-cell.taken { cursor:not-allowed; }
      @keyframes ttt-win-pulse { 0%{transform:scale(1)} 100%{transform:scale(1.05)} }
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
