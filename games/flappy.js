// ===== FLAPPY BIRD (ORIGINAL) =====
window.FlappyGame = {
  launch() {
    const area = document.getElementById('game-area');
    area.innerHTML = '';
    document.getElementById('game-instructions').innerHTML =
      'Space / Klik / Tap untuk terbang ke atas &nbsp;|&nbsp; Jangan sentuh pipa!';

    const W = 360, H = 560;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    canvas.style.cssText = 'border-radius:12px;box-shadow:0 0 40px rgba(132,204,22,0.3);cursor:pointer';
    area.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const GRAVITY = 0.45, FLAP = -7, PIPE_W = 52, GAP = 160, PIPE_SPEED = 2.2;

    let bird = {x:90, y:H/2, vy:0, r:16, angle:0, flapTimer:0};
    let pipes = [];
    let score = 0, best = parseInt(localStorage.getItem('flappy_best')||'0');
    let frame = 0, gameState = 'ready'; // ready, playing, dead
    let animId;
    let particles = [];
    let pipeTimer = 0;
    const PIPE_INTERVAL = 95;

    // Sky colors
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0,'#0c4a6e');
    skyGrad.addColorStop(0.6,'#0369a1');
    skyGrad.addColorStop(1,'#0ea5e9');

    function flap() {
      if(gameState === 'dead') return;
      if(gameState === 'ready') gameState = 'playing';
      bird.vy = FLAP;
      bird.flapTimer = 8;
      addParticle(bird.x-10, bird.y+10);
    }

    function addParticle(x, y) {
      for(let i=0;i<4;i++) {
        particles.push({x,y,vx:(Math.random()-0.5)*3,vy:-(Math.random()*2+1),life:1,size:Math.random()*4+2});
      }
    }

    function spawnPipe() {
      const minH = 60, maxH = H-GAP-minH-80;
      const topH = minH + Math.random()*(maxH-minH);
      pipes.push({x:W, topH, scored:false});
    }

    function drawBird(b) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle * Math.PI/180);

      // Body
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(0, 0, b.r, b.r*0.85, 0, 0, Math.PI*2);
      ctx.fill();

      // Wing
      const wingY = b.flapTimer > 0 ? -6 : 4;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(-4, wingY, 10, 5, -0.3, 0, Math.PI*2);
      ctx.fill();

      // Eye
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(8, -5, 6, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(9, -5, 3, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(10, -6, 1, 0, Math.PI*2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(12, -1);
      ctx.lineTo(20, 2);
      ctx.lineTo(12, 5);
      ctx.closePath();
      ctx.fill();

      // Cheek
      ctx.fillStyle = 'rgba(239,68,68,0.4)';
      ctx.beginPath();
      ctx.ellipse(6, 2, 4, 3, 0, 0, Math.PI*2);
      ctx.fill();

      ctx.restore();
    }

    function drawPipe(p) {
      const gapY = p.topH + GAP;
      const pipeColor = '#16a34a';
      const pipeHighlight = '#22c55e';
      const pipeShadow = '#14532d';

      // Top pipe
      ctx.fillStyle = pipeColor;
      ctx.fillRect(p.x, 0, PIPE_W, p.topH);
      // Cap
      ctx.fillStyle = pipeHighlight;
      ctx.fillRect(p.x-4, p.topH-20, PIPE_W+8, 22);
      ctx.fillStyle = pipeColor;
      ctx.fillRect(p.x-4, p.topH-20, PIPE_W+8, 4);

      // Bottom pipe
      ctx.fillStyle = pipeColor;
      ctx.fillRect(p.x, gapY, PIPE_W, H-gapY-60);
      // Cap
      ctx.fillStyle = pipeHighlight;
      ctx.fillRect(p.x-4, gapY, PIPE_W+8, 22);
      ctx.fillStyle = pipeColor;
      ctx.fillRect(p.x-4, gapY+18, PIPE_W+8, 4);

      // Shine on pipes
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(p.x+4, 0, 8, p.topH-20);
      ctx.fillRect(p.x+4, gapY+22, 8, H-gapY-80);
    }

    function drawGround() {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(0, H-60, W, 60);
      ctx.fillStyle = '#a16207';
      ctx.fillRect(0, H-60, W, 10);

      // Grass
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(0, H-62, W, 6);

      // Moving ground marks
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for(let i=0;i<12;i++) {
        const gx = ((frame*PIPE_SPEED*0.5 + i*45) % W);
        ctx.fillRect(gx, H-55, 25, 4);
      }
    }

    function drawClouds() {
      const cloudX1 = (W - (frame*0.3)%W+W)%W;
      const cloudX2 = (W - (frame*0.2+180)%W+W)%W;
      const draw = (x,y) => {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.arc(x,y,20,0,Math.PI*2);
        ctx.arc(x+18,y-6,16,0,Math.PI*2);
        ctx.arc(x+34,y,18,0,Math.PI*2);
        ctx.fill();
      };
      draw(cloudX1, 80); draw(cloudX2, 140);
    }

    function update() {
      frame++;
      if(bird.flapTimer>0) bird.flapTimer--;

      if(gameState !== 'playing') return;

      bird.vy += GRAVITY;
      bird.vy = Math.min(bird.vy, 10);
      bird.y += bird.vy;
      bird.angle = Math.max(-30, Math.min(90, bird.vy*4));

      // Pipes
      pipeTimer++;
      if(pipeTimer >= PIPE_INTERVAL) { spawnPipe(); pipeTimer=0; }
      pipes.forEach(p => p.x -= PIPE_SPEED * (1+score*0.01));
      pipes = pipes.filter(p => p.x > -PIPE_W-10);

      // Score
      pipes.forEach(p => {
        if(!p.scored && p.x+PIPE_W < bird.x-bird.r) {
          p.scored = true; score++;
          if(score > best) { best=score; localStorage.setItem('flappy_best',best); }
          window.updateScore(score);
          if(score%5===0) window.showToast?.(`🎯 ${score} Pipa! Keren!`, 'info');
        }
      });

      // Collision
      if(bird.y > H-60-bird.r || bird.y < bird.r) { die(); return; }
      for(const p of pipes) {
        if(bird.x+bird.r>p.x && bird.x-bird.r<p.x+PIPE_W) {
          if(bird.y-bird.r<p.topH || bird.y+bird.r>p.topH+GAP) { die(); return; }
        }
      }

      // Particles
      particles = particles.filter(pt => {
        pt.x+=pt.vx; pt.y+=pt.vy; pt.vy+=0.1; pt.life-=0.06;
        return pt.life>0;
      });
    }

    function die() {
      gameState = 'dead';
      for(let i=0;i<20;i++) {
        const angle = Math.random()*Math.PI*2;
        const s = Math.random()*5+2;
        particles.push({x:bird.x, y:bird.y, vx:Math.cos(angle)*s, vy:Math.sin(angle)*s, life:1, size:Math.random()*6+2});
      }
      setTimeout(()=>{
        window.gameOver?.(score);
        drawDeadScreen();
      }, 600);
    }

    function draw() {
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0,0,W,H);
      drawClouds();

      pipes.forEach(drawPipe);
      drawGround();

      // Particles
      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size*p.life, 0, Math.PI*2);
        ctx.fill();
      });
      ctx.globalAlpha=1; ctx.shadowBlur=0;

      if(gameState !== 'dead') drawBird(bird);

      // Score display
      ctx.fillStyle = 'white';
      ctx.font = 'bold 36px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(score, W/2, 60);
      ctx.font = '14px Orbitron, monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(`BEST: ${best}`, W/2, 82);
      ctx.textAlign = 'left';
      ctx.shadowBlur = 0;

      // Ready screen
      if(gameState === 'ready') {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 22px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TAP / SPACE', W/2, H/2-10);
        ctx.font = '14px Outfit, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('untuk mulai terbang!', W/2, H/2+18);
        ctx.textAlign = 'left';
      }

      animId = requestAnimationFrame(loop);
    }

    function loop() { update(); draw(); }

    function drawDeadScreen() {
      const overlay = document.createElement('div');
      overlay.className = 'game-over-overlay';
      overlay.innerHTML = `
        <div class="game-over-content">
          <div class="game-over-title" style="color:#84cc16">GAME OVER</div>
          <div class="game-over-score">Skor: ${score}</div>
          <div class="game-over-best">Best: ${best}</div>
          <div class="game-over-actions">
            <button class="btn-primary" onclick="document.getElementById('game-restart-btn').click()">🔄 Terbang Lagi</button>
            <button class="btn-secondary" onclick="document.getElementById('game-close-btn').click()">✕ Keluar</button>
          </div>
        </div>
      `;
      area.style.position='relative';
      area.appendChild(overlay);
    }

    canvas.addEventListener('click', flap);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); flap(); }, {passive:false});
    const keyHandler = e => { if(e.key===' '||e.key==='ArrowUp') { flap(); e.preventDefault(); } };
    document.addEventListener('keydown', keyHandler);

    loop();

    return {
      destroy() {
        cancelAnimationFrame(animId);
        document.removeEventListener('keydown', keyHandler);
      }
    };
  }
};
