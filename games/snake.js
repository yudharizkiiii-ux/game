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
      for(let i=0;i<15;i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        particles.push({
          x: x*CELL + CELL/2,
          y: y*CELL + CELL/2,
          vx: Math.cos(angle)*speed,
          vy: Math.sin(angle)*speed,
          life: 1,
          color: `hsl(${120+Math.random()*60}, 90%, 60%)`,
          size: Math.random()*3 + 2
        });
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
        if (speed > 60) {
          speed -= 3;
          clearInterval(timerId);
          timerId = setInterval(update, speed);
        }
      } else {
        snake.pop();
      }
    }

    function draw() {
      frame++;
      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#090a15');
      bgGrad.addColorStop(1, '#111226');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = 'rgba(6,182,212,0.04)';
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

      // Border glow
      ctx.strokeStyle = 'rgba(16,185,129,0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, W, H);

      // Particles
      particles = particles.filter(p => p.life > 0);
      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size*p.life, 0, Math.PI*2);
        ctx.fill();
        p.x += p.vx; p.y += p.vy; p.vx *= 0.93; p.vy *= 0.93; p.life -= 0.03;
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Draw Food (Pulsing neon glowing sphere)
      if (food) {
        const foodPulse = Math.sin(frame * 0.15) * 2;
        const fx = food.x * CELL + CELL/2;
        const fy = food.y * CELL + CELL/2;
        const r = (CELL/2 - 2) + foodPulse * 0.5;

        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 15 + foodPulse * 3;

        // Food main body
        const foodGrad = ctx.createRadialGradient(fx - 2, fy - 2, 1, fx, fy, r);
        foodGrad.addColorStop(0, '#fca5a5');
        foodGrad.addColorStop(0.3, '#ef4444');
        foodGrad.addColorStop(1, '#991b1b');
        
        ctx.fillStyle = foodGrad;
        ctx.beginPath();
        ctx.arc(fx, fy, r, 0, Math.PI*2);
        ctx.fill();

        // Food stem
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fx, fy - r);
        ctx.quadraticCurveTo(fx + 3, fy - r - 4, fx + 5, fy - r - 3);
        ctx.stroke();

        ctx.shadowBlur = 0;
      }

      // Draw Snake (3D round segment scaling)
      snake.forEach((seg, i) => {
        const isHead = i === 0;
        const ratio = 1 - (i / snake.length) * 0.45; // taper towards the tail
        const size = (CELL / 2 - 1.5) * ratio;
        
        const cx = seg.x * CELL + CELL/2;
        const cy = seg.y * CELL + CELL/2;

        const h = 130 + (i / snake.length) * 45;
        ctx.shadowColor = `hsl(${h}, 85%, 55%)`;
        ctx.shadowBlur = isHead ? 15 : 6;

        // Body gradient
        const segGrad = ctx.createRadialGradient(cx - size/3, cy - size/3, 1, cx, cy, size);
        if (isHead) {
          segGrad.addColorStop(0, '#ffffff');
          segGrad.addColorStop(0.4, '#10b981');
          segGrad.addColorStop(1, '#064e3b');
        } else {
          segGrad.addColorStop(0, `hsl(${h}, 85%, 65%)`);
          segGrad.addColorStop(0.5, `hsl(${h}, 85%, 45%)`);
          segGrad.addColorStop(1, `hsl(${h}, 85%, 25%)`);
        }

        ctx.fillStyle = segGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, size, 0, Math.PI*2);
        ctx.fill();

        // Draw eyes and pupils on Head
        if (isHead) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          let ex1, ey1, ex2, ey2;
          
          if (dir.x === 1) { // Right
            ex1 = cx + 4; ey1 = cy - 4; ex2 = cx + 4; ey2 = cy + 4;
          } else if (dir.x === -1) { // Left
            ex1 = cx - 4; ey1 = cy - 4; ex2 = cx - 4; ey2 = cy + 4;
          } else if (dir.y === 1) { // Down
            ex1 = cx - 4; ey1 = cy + 4; ex2 = cx + 4; ey2 = cy + 4;
          } else { // Up
            ex1 = cx - 4; ey1 = cy - 4; ex2 = cx + 4; ey2 = cy - 4;
          }
          
          ctx.beginPath(); ctx.arc(ex1, ey1, 2.5, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(ex2, ey2, 2.5, 0, Math.PI*2); ctx.fill();
          
          // Pupils (Black dots looking in direction of motion)
          ctx.fillStyle = '#000000';
          const px = dir.x * 0.7;
          const py = dir.y * 0.7;
          ctx.beginPath(); ctx.arc(ex1 + px, ey1 + py, 1.2, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(ex2 + px, ey2 + py, 1.2, 0, Math.PI*2); ctx.fill();
        }
      });
      ctx.shadowBlur = 0;

      // Score overlay UI
      ctx.fillStyle = 'rgba(10, 10, 26, 0.8)';
      ctx.strokeStyle = 'rgba(6,182,212,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(8, 8, 120, 38, 10);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 12px Orbitron, monospace';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      ctx.fillText(`SCORE: ${score}`, 18, 31);
      ctx.shadowBlur = 0;

      if (gameRunning) {
        animId = requestAnimationFrame(draw);
      }
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
