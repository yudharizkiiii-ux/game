// ===== TETRIS GAME =====
window.TetrisGame = {
  launch() {
    const area = document.getElementById('game-area');
    area.innerHTML = `
      <div style="display:flex;gap:20px;align-items:flex-start">
        <canvas id="tetris-canvas" width="240" height="480" style="border-radius:12px;box-shadow:0 0 40px rgba(6,182,212,0.3)"></canvas>
        <div style="display:flex;flex-direction:column;gap:16px;min-width:120px">
          <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px;text-align:center">
            <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Level</div>
            <div id="tetris-level" style="font-family:Orbitron,monospace;font-size:24px;font-weight:700;color:#06b6d4">1</div>
          </div>
          <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px;text-align:center">
            <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Lines</div>
            <div id="tetris-lines" style="font-family:Orbitron,monospace;font-size:24px;font-weight:700;color:#10b981">0</div>
          </div>
          <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px;text-align:center">
            <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Next</div>
            <canvas id="tetris-next" width="100" height="100"></canvas>
          </div>
        </div>
      </div>
    `;
    document.getElementById('game-instructions').innerHTML =
      '← → Gerak &nbsp;|&nbsp; ↑ Rotasi &nbsp;|&nbsp; ↓ Turun Cepat &nbsp;|&nbsp; Space Drop';

    const canvas = document.getElementById('tetris-canvas');
    const ctx = canvas.getContext('2d');
    const nextCanvas = document.getElementById('tetris-next');
    const nextCtx = nextCanvas.getContext('2d');

    const COLS = 12, ROWS = 24, BLOCK = 20;

    const PIECES = [
      { shape: [[1,1,1,1]], color: '#06b6d4' },            // I
      { shape: [[1,1],[1,1]], color: '#f59e0b' },          // O
      { shape: [[0,1,0],[1,1,1]], color: '#8b5cf6' },      // T
      { shape: [[1,0,0],[1,1,1]], color: '#f97316' },      // J
      { shape: [[0,0,1],[1,1,1]], color: '#3b82f6' },      // L
      { shape: [[0,1,1],[1,1,0]], color: '#10b981' },      // S
      { shape: [[1,1,0],[0,1,1]], color: '#ef4444' },      // Z
    ];

    let board = Array.from({length:ROWS}, () => Array(COLS).fill(0));
    let current = null;
    let currentPos = {x:0, y:0};
    let nextPiece = null;
    let score = 0, level = 1, lines = 0;
    let gameRunning = true;
    let animId, dropTimer, dropInterval = 800;
    let flashLines = [];

    function randomPiece() {
      return {...PIECES[Math.floor(Math.random()*PIECES.length)]};
    }

    function spawnPiece() {
      current = nextPiece || randomPiece();
      nextPiece = randomPiece();
      currentPos = {x: Math.floor(COLS/2) - Math.floor(current.shape[0].length/2), y: 0};
      if (collides()) endGame();
      drawNext();
    }

    function rotate(shape) {
      const rows = shape.length, cols = shape[0].length;
      const rotated = Array.from({length:cols}, (_,i) => Array.from({length:rows}, (_,j) => shape[rows-1-j][i]));
      return rotated;
    }

    function collides(piece=current, pos=currentPos) {
      for(let r=0;r<piece.shape.length;r++) {
        for(let c=0;c<piece.shape[r].length;c++) {
          if(!piece.shape[r][c]) continue;
          const nx = pos.x+c, ny = pos.y+r;
          if(nx<0||nx>=COLS||ny>=ROWS) return true;
          if(ny>=0 && board[ny][nx]) return true;
        }
      }
      return false;
    }

    function lock() {
      current.shape.forEach((row,r) => row.forEach((v,c) => {
        if(v) {
          const y = currentPos.y+r;
          if(y>=0) board[y][currentPos.x+c] = current.color;
        }
      }));
      clearLines();
      spawnPiece();
    }

    function clearLines() {
      let cleared = 0;
      for(let r=ROWS-1;r>=0;r--) {
        if(board[r].every(v=>v)) {
          flashLines.push(r);
          board.splice(r,1);
          board.unshift(Array(COLS).fill(0));
          cleared++; r++;
        }
      }
      if(cleared>0) {
        const pts = [0,100,300,500,800][cleared] * level;
        score += pts;
        lines += cleared;
        level = Math.floor(lines/10)+1;
        dropInterval = Math.max(80, 800 - (level-1)*70);
        window.updateScore(score);
        document.getElementById('tetris-level').textContent = level;
        document.getElementById('tetris-lines').textContent = lines;
        restartDrop();
        setTimeout(()=>flashLines=[], 200);
      }
    }

    function drop() {
      currentPos.y++;
      if(collides()) { currentPos.y--; lock(); }
    }

    function hardDrop() {
      while(!collides({...current}, {x:currentPos.x, y:currentPos.y+1})) currentPos.y++;
      lock();
    }

    function restartDrop() {
      clearInterval(dropTimer);
      dropTimer = setInterval(drop, dropInterval);
    }

    function drawBlock(ctx, x, y, color, size=BLOCK) {
      const g = ctx.createLinearGradient(x,y,x+size,y+size);
      g.addColorStop(0, lighten(color, 30));
      g.addColorStop(1, color);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x+1, y+1, size-2, size-2, 3);
      ctx.fill();
      // Shine
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x+3, y+3, size/2-4, 3);
    }

    function lighten(hex, amt) {
      const n = parseInt(hex.slice(1),16);
      const r = Math.min(255,(n>>16)+amt), g = Math.min(255,((n>>8)&0xff)+amt), b = Math.min(255,(n&0xff)+amt);
      return `rgb(${r},${g},${b})`;
    }

    function getGhostY() {
      let gy = currentPos.y;
      while(!collides(current, {x:currentPos.x, y:gy+1})) gy++;
      return gy;
    }

    function draw() {
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0,0,canvas.width,canvas.height);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 0.5;
      for(let x=0;x<=COLS;x++) { ctx.beginPath(); ctx.moveTo(x*BLOCK,0); ctx.lineTo(x*BLOCK,canvas.height); ctx.stroke(); }
      for(let y=0;y<=ROWS;y++) { ctx.beginPath(); ctx.moveTo(0,y*BLOCK); ctx.lineTo(canvas.width,y*BLOCK); ctx.stroke(); }

      // Board
      board.forEach((row,r) => row.forEach((color,c) => {
        if(color) {
          if(flashLines.includes(r)) {
            ctx.fillStyle = 'white';
            ctx.fillRect(c*BLOCK,r*BLOCK,BLOCK,BLOCK);
          } else {
            drawBlock(ctx, c*BLOCK, r*BLOCK, color);
          }
        }
      }));

      // Ghost piece
      if(current) {
        const gy = getGhostY();
        current.shape.forEach((row,r) => row.forEach((v,c) => {
          if(v) {
            ctx.strokeStyle = current.color+'60';
            ctx.lineWidth = 1;
            ctx.strokeRect(
              (currentPos.x+c)*BLOCK+1, (gy+r)*BLOCK+1, BLOCK-2, BLOCK-2
            );
          }
        }));
      }

      // Current piece
      if(current) {
        current.shape.forEach((row,r) => row.forEach((v,c) => {
          if(v) drawBlock(ctx, (currentPos.x+c)*BLOCK, (currentPos.y+r)*BLOCK, current.color);
        }));
      }

      animId = requestAnimationFrame(draw);
    }

    function drawNext() {
      if(!nextPiece) return;
      nextCtx.fillStyle = '#0d1117';
      nextCtx.fillRect(0,0,100,100);
      const shape = nextPiece.shape;
      const offX = (5 - shape[0].length)/2;
      const offY = (5 - shape.length)/2;
      shape.forEach((row,r) => row.forEach((v,c) => {
        if(v) drawBlock(nextCtx, (offX+c)*20, (offY+r)*20, nextPiece.color);
      }));
    }

    function endGame() {
      gameRunning = false;
      clearInterval(dropTimer);
      window.gameOver(score);
      setTimeout(() => {
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
          <div class="game-over-content">
            <div class="game-over-title" style="color:#06b6d4">GAME OVER</div>
            <div class="game-over-score">Skor: ${score.toLocaleString()}</div>
            <div class="game-over-best">Level ${level} | ${lines} Lines</div>
            <div class="game-over-actions">
              <button class="btn-primary" onclick="document.getElementById('game-restart-btn').click()">🔄 Main Lagi</button>
              <button class="btn-secondary" onclick="document.getElementById('game-close-btn').click()">✕ Keluar</button>
            </div>
          </div>
        `;
        area.style.position = 'relative';
        area.appendChild(overlay);
      }, 300);
    }

    const keyHandler = e => {
      if(!gameRunning) return;
      if(e.key === 'ArrowLeft') { currentPos.x--; if(collides()) currentPos.x++; }
      else if(e.key === 'ArrowRight') { currentPos.x++; if(collides()) currentPos.x--; }
      else if(e.key === 'ArrowDown') { drop(); }
      else if(e.key === 'ArrowUp') {
        const rotated = {...current, shape: rotate(current.shape)};
        if(!collides(rotated)) current.shape = rotated.shape;
      }
      else if(e.key === ' ') { hardDrop(); e.preventDefault(); }
      if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp'].includes(e.key)) e.preventDefault();
    };
    document.addEventListener('keydown', keyHandler);

    spawnPiece();
    restartDrop();
    draw();

    return {
      destroy() {
        clearInterval(dropTimer);
        cancelAnimationFrame(animId);
        document.removeEventListener('keydown', keyHandler);
      }
    };
  }
};
