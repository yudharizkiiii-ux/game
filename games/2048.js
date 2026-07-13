// ===== 2048 GAME =====
window.Game2048 = {
  launch() {
    const area = document.getElementById('game-area');
    document.getElementById('game-instructions').innerHTML =
      '← → ↑ ↓ Arrow Keys atau Swipe untuk menggeser ubin';

    const SIZE = 4;
    let grid = [], score = 0, best = 0, won = false, moved = false;

    const COLORS = {
      0: { bg: '#1a1a2e', text: '#1a1a2e' },
      2: { bg: '#e6e0f8', text: '#3b0764' },
      4: { bg: '#d4c5f4', text: '#3b0764' },
      8: { bg: '#c084fc', text: '#ffffff' },
      16: { bg: '#a855f7', text: '#ffffff' },
      32: { bg: '#9333ea', text: '#ffffff' },
      64: { bg: '#7e22ce', text: '#ffffff' },
      128: { bg: '#facc15', text: '#ffffff', shadow: '#eab308' },
      256: { bg: '#f59e0b', text: '#ffffff', shadow: '#d97706' },
      512: { bg: '#ef4444', text: '#ffffff', shadow: '#dc2626' },
      1024: { bg: '#dc2626', text: '#ffffff', shadow: '#b91c1c' },
      2048: { bg: '#10b981', text: '#ffffff', shadow: '#059669' },
    };

    area.innerHTML = `
      <div class="g2048-wrap">
        <div class="g2048-header">
          <div style="font-family:Orbitron,monospace;font-size:28px;font-weight:900;background:linear-gradient(135deg,#7c3aed,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent">2048</div>
          <div style="display:flex;gap:12px">
            <div class="g2048-score-box"><div class="g2048-score-label">SKOR</div><div id="g2048-score" class="g2048-score-val">0</div></div>
            <div class="g2048-score-box"><div class="g2048-score-label">BEST</div><div id="g2048-best" class="g2048-score-val">0</div></div>
          </div>
        </div>
        <div class="g2048-board" id="g2048-board"></div>
        <div style="text-align:center;margin-top:12px">
          <button class="btn-primary" id="g2048-new" style="font-size:14px;padding:10px 20px">🔄 Baru</button>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .g2048-wrap { width: 340px; }
      .g2048-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
      .g2048-score-box { background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:8px 16px; text-align:center; min-width:70px; }
      .g2048-score-label { font-size:10px; color:#6b7280; text-transform:uppercase; letter-spacing:1px; }
      .g2048-score-val { font-family:Orbitron,monospace; font-size:20px; font-weight:700; color:#f59e0b; }
      .g2048-board { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; background:#0d1117; padding:12px; border-radius:14px; border:1px solid rgba(255,255,255,0.08); }
      .g2048-cell { width:70px; height:70px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-family:Orbitron,monospace; font-weight:700; transition:transform 0.1s; cursor:default; user-select:none; }
      .g2048-cell.pop { animation: pop2048 0.15s ease; }
      .g2048-cell.new { animation: new2048 0.2s ease; }
      @keyframes pop2048 { 0%{transform:scale(1)} 50%{transform:scale(1.12)} 100%{transform:scale(1)} }
      @keyframes new2048 { 0%{transform:scale(0)} 100%{transform:scale(1)} }
    `;
    document.head.appendChild(style);

    best = parseInt(localStorage.getItem('g2048_best') || '0');
    document.getElementById('g2048-best').textContent = best;

    function init() {
      grid = Array.from({length:SIZE}, ()=>Array(SIZE).fill(0));
      score = 0; won = false;
      addTile(); addTile();
      render();
      window.updateScore(0);
    }

    function addTile() {
      const empty = [];
      grid.forEach((row,r)=>row.forEach((v,c)=>{if(!v)empty.push({r,c})}));
      if(!empty.length) return false;
      const {r,c} = empty[Math.floor(Math.random()*empty.length)];
      grid[r][c] = Math.random()<0.9?2:4;
      return {r,c};
    }

    function compress(row) {
      let arr = row.filter(v=>v);
      let gained = 0;
      for(let i=0;i<arr.length-1;i++) {
        if(arr[i]===arr[i+1]) {
          arr[i]*=2; gained+=arr[i]; arr.splice(i+1,1);
        }
      }
      while(arr.length<SIZE) arr.push(0);
      return {row:arr, gained};
    }

    function move(dir) {
      let changed = false, gained = 0;
      let newGrid = grid.map(r=>[...r]);

      const process = (getRow, setRow) => {
        for(let i=0;i<SIZE;i++) {
          const orig = getRow(newGrid,i);
          const {row:compressed, gained:g} = compress(orig);
          if(compressed.join()!==orig.join()) changed = true;
          gained += g;
          setRow(newGrid,i,compressed);
        }
      };

      if(dir==='left') process((g,i)=>g[i], (g,i,r)=>g[i]=r);
      else if(dir==='right') process((g,i)=>g[i].slice().reverse(), (g,i,r)=>g[i]=r.reverse());
      else if(dir==='up') process((g,i)=>g.map(r=>r[i]), (g,i,r)=>r.forEach((v,j)=>g[j][i]=v));
      else if(dir==='down') process((g,i)=>g.map(r=>r[i]).reverse(), (g,i,r)=>r.reverse().forEach((v,j)=>g[j][i]=v));

      if(changed) {
        grid = newGrid;
        score += gained;
        if(score > best) { best = score; localStorage.setItem('g2048_best',best); }
        window.updateScore(score);
        document.getElementById('g2048-score').textContent = score.toLocaleString();
        document.getElementById('g2048-best').textContent = best.toLocaleString();
        addTile();
        render();
        if(!won && grid.some(r=>r.some(v=>v===2048))) {
          won = true;
          setTimeout(()=>showWin(), 300);
        } else if(!hasMoves()) {
          setTimeout(()=>endGame(), 300);
        }
      }
    }

    function hasMoves() {
      for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) {
        if(!grid[r][c]) return true;
        if(r<SIZE-1 && grid[r][c]===grid[r+1][c]) return true;
        if(c<SIZE-1 && grid[r][c]===grid[r][c+1]) return true;
      }
      return false;
    }

    function getCellStyle(val) {
      const c = COLORS[val] || {bg:'#065f46',text:'#ffffff'};
      const fontSize = val >= 1024 ? '18px' : val >= 128 ? '22px' : '26px';
      return `background:${c.bg};color:${c.text};font-size:${fontSize};${c.shadow?`box-shadow:0 4px 15px ${c.shadow}66`:''};`;
    }

    function render() {
      const board = document.getElementById('g2048-board');
      if(!board) return;
      board.innerHTML = '';
      grid.forEach((row,r)=>row.forEach((val,c)=>{
        const cell = document.createElement('div');
        cell.className = 'g2048-cell';
        cell.style.cssText = getCellStyle(val);
        cell.textContent = val || '';
        board.appendChild(cell);
      }));
    }

    function showWin() {
      window.showToast?.('🎉 Selamat! Kamu mencapai 2048!', 'success');
      window.gameOver?.(score);
    }

    function endGame() {
      window.gameOver?.(score);
      const board = document.getElementById('g2048-board');
      if(!board) return;
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;border-radius:14px;backdrop-filter:blur(8px)';
      overlay.innerHTML = `<div style="text-align:center"><div style="font-family:Orbitron,monospace;font-size:24px;font-weight:900;color:#ef4444;margin-bottom:8px">GAME OVER</div><div style="color:#f59e0b;font-family:Orbitron,monospace;margin-bottom:16px">${score.toLocaleString()}</div><button class="btn-primary" onclick="document.getElementById('game-restart-btn').click()">🔄 Coba Lagi</button></div>`;
      board.style.position = 'relative';
      board.appendChild(overlay);
    }

    document.getElementById('g2048-new')?.addEventListener('click', init);

    const keyHandler = e => {
      const map = { ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down' };
      if(map[e.key]) { move(map[e.key]); e.preventDefault(); }
    };
    document.addEventListener('keydown', keyHandler);

    // Touch/swipe
    let touchStartX=0,touchStartY=0;
    area.addEventListener('touchstart', e=>{touchStartX=e.touches[0].clientX;touchStartY=e.touches[0].clientY;},{passive:true});
    area.addEventListener('touchend', e=>{
      const dx=e.changedTouches[0].clientX-touchStartX, dy=e.changedTouches[0].clientY-touchStartY;
      if(Math.abs(dx)>Math.abs(dy)) move(dx>0?'right':'left');
      else move(dy>0?'down':'up');
    });

    init();

    return {
      destroy() {
        document.removeEventListener('keydown', keyHandler);
        style.remove();
      }
    };
  }
};
