// ===== SNAKE GAME =====
window.SnakeGame = {
  launch() {
    const area = document.getElementById('game-area');
    area.innerHTML = '';

    const CELL = 20, COLS = 24, ROWS = 20;
    const W = COLS * CELL, H = ROWS * CELL;

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    canvas.style.cssText = 'border-radius:12px;box-shadow:0 0 40px rgba(16,185,129,0.3)';
    area.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    document.getElementById('game-instructions').innerHTML =
      '🕹️ Arrow Keys / WASD untuk bergerak &nbsp;|&nbsp; ESC untuk keluar';

    let snake = [{x:10,y:10}];
    let dir = {x:1,y:0};
    let nextDir = {x:1,y:0};
    let food = null;
    let score = 0;
    let gameRunning = true;
    let speed = 150;
    let animId, timerId;
    let particles = [];
    let frame = 0;

    function placeFood() {
      let pos;
      do {
        pos = {x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS)};
      } while (snake.some(s => s.x===pos.x && s.y===pos.y));
      food = pos;
    }
    placeFood();

    function addParticle(x, y) {
      for(let i=0;i<8;i++) {
        const angle = (Math.PI*2/8)*i;
        particles.push({x:x*CELL+CELL/2, y:y*CELL+CELL/2, vx:Math.cos(angle)*3, vy:Math.sin(angle)*3, life:1, color:`hsl(${120+Math.random()*60},80%,60%)`});
      }
    }

    function update() {
      if (!gameRunning) return;
      dir = {...nextDir};
      const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};

      // Wall collision
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) { endGame(); return; }
      // Self collision
      if (snake.some(s => s.x===head.x && s.y===head.y)) { endGame(); return; }

      snake.unshift(head);
      if (head.x===food.x && head.y===food.y) {
        score += 10;
        window.updateScore(score);
        addParticle(food.x, food.y);
        placeFood();
        if (speed > 60) speed -= 3;
      } else {
        snake.pop();
      }
    }

    function drawRoundRect(x, y, w, h, r, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x,y,w,h,r);
      ctx.fill();
    }

    function draw() {
      frame++;
      // Background grid
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for(let x=0;x<=COLS;x++) { ctx.beginPath(); ctx.moveTo(x*CELL,0); ctx.lineTo(x*CELL,H); ctx.stroke(); }
      for(let y=0;y<=ROWS;y++) { ctx.beginPath(); ctx.moveTo(0,y*CELL); ctx.lineTo(W,y*CELL); ctx.stroke(); }

      // Particles
      particles = particles.filter(p => p.life > 0);
      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3*p.life, 0, Math.PI*2);
        ctx.fill();
        p.x += p.vx; p.y += p.vy; p.vx *= 0.92; p.vy *= 0.92; p.life -= 0.05;
      });
      ctx.globalAlpha = 1;

      // Food with glow
      const foodPulse = Math.sin(frame * 0.1) * 2;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 15 + foodPulse;
      drawRoundRect(food.x*CELL+2, food.y*CELL+2, CELL-4, CELL-4, 4, '#ef4444');
      // Apple shine
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.ellipse(food.x*CELL+7, food.y*CELL+6, 3, 2, -0.5, 0, Math.PI*2);
      ctx.fill();

      // Snake body
      snake.forEach((seg, i) => {
        const isHead = i === 0;
        const ratio = 1 - (i / snake.length) * 0.5;
        const h = 120 + (i/snake.length)*60;
        ctx.shadowColor = isHead ? '#10b981' : 'transparent';
        ctx.shadowBlur = isHead ? 15 : 0;
        const color = `hsl(${h}, 70%, ${40+ratio*20}%)`;
        drawRoundRect(seg.x*CELL+1, seg.y*CELL+1, CELL-2, CELL-2, isHead ? 6 : 4, color);
        // Head eyes
        if (isHead) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'white';
          const eyeX = dir.x === 1 ? 14 : dir.x === -1 ? 5 : dir.y === 1 ? [7,13] : [7,13];
          const eyeY = dir.y === 1 ? 14 : dir.y === -1 ? 5 : dir.x ? [7,7] : null;
          // Simplified eyes
          if (dir.x === 1) { ctx.fillRect(seg.x*CELL+14,seg.y*CELL+5,3,3); ctx.fillRect(seg.x*CELL+14,seg.y*CELL+12,3,3); }
          else if (dir.x === -1) { ctx.fillRect(seg.x*CELL+3,seg.y*CELL+5,3,3); ctx.fillRect(seg.x*CELL+3,seg.y*CELL+12,3,3); }
          else if (dir.y === 1) { ctx.fillRect(seg.x*CELL+5,seg.y*CELL+14,3,3); ctx.fillRect(seg.x*CELL+12,seg.y*CELL+14,3,3); }
          else { ctx.fillRect(seg.x*CELL+5,seg.y*CELL+3,3,3); ctx.fillRect(seg.x*CELL+12,seg.y*CELL+3,3,3); }
          ctx.fillStyle = '#0d1117';
          if (dir.x === 1) { ctx.fillRect(seg.x*CELL+15,seg.y*CELL+6,1,1); ctx.fillRect(seg.x*CELL+15,seg.y*CELL+13,1,1); }
          else if (dir.x === -1) { ctx.fillRect(seg.x*CELL+4,seg.y*CELL+6,1,1); ctx.fillRect(seg.x*CELL+4,seg.y*CELL+13,1,1); }
        }
      });
      ctx.shadowBlur = 0;

      // Score overlay
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.roundRect(8,8,110,36,8);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 12px Orbitron, monospace';
      ctx.fillText(`SCORE: ${score}`, 18, 31);

      animId = requestAnimationFrame(draw);
    }

    function endGame() {
      gameRunning = false;
      clearInterval(timerId);
      window.gameOver(score);

      const overlay = document.createElement('div');
      overlay.className = 'game-over-overlay';
      overlay.innerHTML = `
        <div class="game-over-content">
          <div class="game-over-title" style="color:#10b981">GAME OVER</div>
          <div class="game-over-score">Skor: ${score.toLocaleString()}</div>
          <div class="game-over-best">Best: ${window.GameRegistry?.getBestScore('snake').toLocaleString() || score}</div>
          <div class="game-over-actions">
            <button class="btn-primary" id="snake-restart">🔄 Main Lagi</button>
            <button class="btn-secondary" id="snake-close">✕ Keluar</button>
          </div>
        </div>
      `;
      canvas.parentElement.style.position = 'relative';
      canvas.parentElement.appendChild(overlay);
      overlay.querySelector('#snake-restart').addEventListener('click', () => {
        overlay.remove(); document.getElementById('game-restart-btn').click();
      });
      overlay.querySelector('#snake-close').addEventListener('click', () => {
        document.getElementById('game-close-btn').click();
      });
    }

    const keyHandler = e => {
      const map = { ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0},
                    w:{x:0,y:-1}, s:{x:0,y:1}, a:{x:-1,y:0}, d:{x:1,y:0},
                    W:{x:0,y:-1}, S:{x:0,y:1}, A:{x:-1,y:0}, D:{x:1,y:0} };
      const newDir = map[e.key];
      if (newDir && !(newDir.x === -dir.x && newDir.y === -dir.y)) {
        nextDir = newDir;
        if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
      }
    };
    document.addEventListener('keydown', keyHandler);

    timerId = setInterval(update, speed);
    draw();

    return {
      destroy() {
        clearInterval(timerId);
        cancelAnimationFrame(animId);
        document.removeEventListener('keydown', keyHandler);
      }
    };
  }
};
