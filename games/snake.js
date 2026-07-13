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
      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#0a0a16');
      bgGrad.addColorStop(1, '#12122b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Grid lines with neon blue cyber pulse
      ctx.strokeStyle = 'rgba(6,182,212,0.06)';
      ctx.lineWidth = 1;
      for(let x=0;x<=COLS;x++) { 
        ctx.beginPath(); 
        ctx.moveTo(x*CELL,0); 
        ctx.lineTo(x*CELL,H); 
        ctx.stroke(); 
      }
      for(let y=0;y<=ROWS;y++) { 
        ctx.beginPath(); 
        ctx.moveTo(0,y*CELL); 
        ctx.lineTo(W,y*CELL); 
        ctx.stroke(); 
      }

      // Dynamic glowing grid border
      ctx.strokeStyle = 'rgba(16,185,129,0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, W, H);

      // Particles
      particles = particles.filter(p => p.life > 0);
      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4*p.life, 0, Math.PI*2);
        ctx.fill();
        p.x += p.vx; p.y += p.vy; p.vx *= 0.92; p.vy *= 0.92; p.life -= 0.04;
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Food with 4D outer neon glow
      const foodPulse = Math.sin(frame * 0.15) * 5;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 15 + foodPulse;
      drawRoundRect(food.x*CELL+2, food.y*CELL+2, CELL-4, CELL-4, 5, '#ef4444');
      
      // Food inner pulse
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 5;
      drawRoundRect(food.x*CELL+5, food.y*CELL+5, CELL-10, CELL-10, 3, '#f59e0b');
      ctx.shadowBlur = 0;

      // Snake body with glowing gradient trails and digital pulse wave
      snake.forEach((seg, i) => {
        const isHead = i === 0;
        const ratio = 1 - (i / snake.length);
        const wave = Math.sin(frame * 0.2 - i * 0.5) * 2;
        const h = 130 + (i / snake.length) * 45;
        
        ctx.shadowColor = `hsl(${h}, 85%, 55%)`;
        ctx.shadowBlur = isHead ? 20 : 8 + wave;
        
        const sizeOffset = isHead ? 0 : 1 + (i / snake.length) * 2;
        const color = `hsl(${h}, 85%, ${isHead ? 50 : 40 + ratio * 20}%)`;
        
        drawRoundRect(
          seg.x * CELL + sizeOffset, 
          seg.y * CELL + sizeOffset, 
          CELL - sizeOffset * 2, 
          CELL - sizeOffset * 2, 
          isHead ? 7 : 4, 
          color
        );

        // Head eyes
        if (isHead) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          // Simplified eyes with nice neon glow
          if (dir.x === 1) { ctx.fillRect(seg.x*CELL+12,seg.y*CELL+4,4,4); ctx.fillRect(seg.x*CELL+12,seg.y*CELL+12,4,4); }
          else if (dir.x === -1) { ctx.fillRect(seg.x*CELL+4,seg.y*CELL+4,4,4); ctx.fillRect(seg.x*CELL+4,seg.y*CELL+12,4,4); }
          else if (dir.y === 1) { ctx.fillRect(seg.x*CELL+4,seg.y*CELL+12,4,4); ctx.fillRect(seg.x*CELL+12,seg.y*CELL+12,4,4); }
          else { ctx.fillRect(seg.x*CELL+4,seg.y*CELL+4,4,4); ctx.fillRect(seg.x*CELL+12,seg.y*CELL+4,4,4); }
        }
      });
      ctx.shadowBlur = 0;

      // Score overlay
      ctx.fillStyle = 'rgba(10, 10, 26, 0.8)';
      ctx.strokeStyle = 'rgba(6,182,212,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(8,8,120,38,10);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 12px Orbitron, monospace';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      ctx.fillText(`SCORE: ${score}`, 18, 31);
      ctx.shadowBlur = 0;

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
