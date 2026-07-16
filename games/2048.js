// ===== 2048 GAME =====
window.Game2048 = {
  launch() {
    const area = document.getElementById('game-area');
    document.getElementById('game-instructions').innerHTML =
      '← → ↑ ↓ Arrow Keys atau Swipe untuk menggeser ubin';

    const SIZE = 4;
    let grid = [], score = 0, best = 0, won = false;
    let previousGrid = Array.from({length:SIZE}, ()=>Array(SIZE).fill(0));

    const COLORS = {
      0: { bg: 'rgba(255, 255, 255, 0.02)', text: 'transparent', shadow: 'transparent' },
      2: { bg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(6, 182, 212, 0.25))', text: '#22d3ee', shadow: '#06b6d4' },
      4: { bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.25))', text: '#34d399', shadow: '#10b981' },
      8: { bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.35))', text: '#fbbf24', shadow: '#f59e0b' },
      16: { bg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.18), rgba(249, 115, 22, 0.38))', text: '#fb923c', shadow: '#f97316' },
      32: { bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.4))', text: '#f87171', shadow: '#ef4444' },
      64: { bg: 'linear-gradient(135deg, rgba(236, 72, 153, 0.22), rgba(236, 72, 153, 0.42))', text: '#f472b6', shadow: '#ec4899' },
      128: { bg: 'linear-gradient(135deg, rgba(217, 70, 239, 0.25), rgba(217, 70, 239, 0.45))', text: '#e879f9', shadow: '#d946ef' },
      256: { bg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.28), rgba(139, 92, 246, 0.48))', text: '#a78bfa', shadow: '#8b5cf6' },
      512: { bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.5))', text: '#60a5fa', shadow: '#3b82f6' },
      1024: { bg: 'linear-gradient(135deg, #0284c7, #0369a1)', text: '#ffffff', shadow: '#0284c7' },
      2048: { bg: 'linear-gradient(135deg, #10b981, #047857)', text: '#ffffff', shadow: '#10b981' },
    };

    area.innerHTML = `
      <div class="g2048-wrap">
        <div class="g2048-header">
          <div style="font-family:Orbitron,monospace;font-size:28px;font-weight:900;background:linear-gradient(135deg,#7c3aed,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent">2048</div>
          <div style="display:flex;gap:12px">
            <div class="g2048-score-box"><div class="g2048-score-label">SKOR</div><div id="g2048-score" class="g2048-score-val">0</div></div>
            <div class="g2048-score-box"><div class="g2048-score-label">BEST</div><div id="g2048-best" class="g2048-score-val">0</div></div>
          </div>
        </div>
        <div class="g2048-board" id="g2048-board"></div>
        <div style="text-align:center;margin-top:16px">
          <button class="btn-primary" id="g2048-new" style="font-size:14px;padding:10px 20px">🔄 Baru</button>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .g2048-wrap { width: 340px; }
      .g2048-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
      .g2048-score-box { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:8px 16px; text-align:center; min-width:75px; }
      .g2048-score-label { font-size:10px; color:#9090b8; text-transform:uppercase; letter-spacing:1px; }
      .g2048-score-val { font-family:Orbitron,monospace; font-size:18px; font-weight:700; color:#06b6d4; }
      .g2048-board { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; background:rgba(10, 10, 24, 0.7); padding:16px; border-radius:16px; border:1px solid rgba(6, 182, 212, 0.15); box-shadow: inset 0 0 15px rgba(6, 182, 212, 0.1); }
      .g2048-cell { 
        width:68px; 
        height:68px; 
        border-radius:12px; 
        display:flex; 
        align-items:center; 
        justify-content:center; 
        font-family:Orbitron,monospace; 
        font-weight:700; 
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
        cursor:default; 
        user-select:none; 
        border: 1px solid rgba(255, 255, 255, 0.05); 
      }
      .g2048-cell:not(:empty) { border: 1px solid rgba(255, 255, 255, 0.15); }
      .g2048-cell.pop { animation: pop2048 0.16s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      .g2048-cell.new { animation: new2048 0.22s cubic-bezier(0.34, 1.56, 0.64, 1); }
      @keyframes pop2048 { 
        0% { transform: scale(1); } 
        50% { transform: scale(1.18); filter: brightness(1.25); } 
        100% { transform: scale(1); } 
      }
      @keyframes new2048 { 
        0% { transform: scale(0.4); opacity: 0; } 
        100% { transform: scale(1); opacity: 1; } 
      }
    `;
    document.head.appendChild(style);

    best = parseInt(localStorage.getItem('g2048_best') || '0');
    document.getElementById('g2048-best').textContent = best;

    function init() {
      grid = Array.from({length:SIZE}, ()=>Array(SIZE).fill(0));
      previousGrid = Array.from({length:SIZE}, ()=>Array(SIZE).fill(0));
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
      const c = COLORS[val] || {bg:'linear-gradient(135deg,#065f46,#022c22)',text:'#ffffff',shadow:'#065f46'};
      const fontSize = val >= 1024 ? '18px' : val >= 128 ? '21px' : '25px';
      const shadowStyle = c.shadow && c.shadow !== 'transparent' ? `box-shadow: 0 4px 15px ${c.shadow}40, inset 0 0 10px ${c.shadow}30` : '';
      return `background:${c.bg};color:${c.text};font-size:${fontSize};${shadowStyle};`;
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
        
        const prevVal = previousGrid[r] ? previousGrid[r][c] : 0;
        if (val > 0) {
          if (prevVal === 0) {
            cell.classList.add('new');
          } else if (val > prevVal) {
            cell.classList.add('pop');
          }
        }
        board.appendChild(cell);
      }));
      previousGrid = grid.map(r=>[...r]);
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
