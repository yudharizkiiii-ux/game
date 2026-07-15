// ===== FLAPPY BIRD =====
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

    const GRAVITY = 0.42, FLAP = -6.8, PIPE_W = 56, GAP = 155, PIPE_SPEED = 2.2;

    let bird = {x:90, y:H/2, vy:0, r:16, angle:0, flapTimer:0};
    let pipes = [];
    let score = 0, best = parseInt(localStorage.getItem('flappy_best')||'0');
    let frame = 0, gameState = 'ready'; // ready, playing, dead
    let animId;
    let particles = [];
    let pipeTimer = 0;
    const PIPE_INTERVAL = 95;
    
    // Parallax background elements
    let clouds = [
      {x: 40, y: 70, w: 70, speed: 0.2},
      {x: 200, y: 130, w: 90, speed: 0.1},
      {x: 320, y: 50, w: 60, speed: 0.15}
    ];

    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0,'#050024');
    skyGrad.addColorStop(0.5,'#5d0c8d');
    skyGrad.addColorStop(1,'#d946ef');

    function flap() {
      if(gameState === 'dead') return;
      if(gameState === 'ready') gameState = 'playing';
      bird.vy = FLAP;
      bird.flapTimer = 8;
      addParticle(bird.x - 12, bird.y);
    }

    function addParticle(x, y, count=8) {
      for(let i=0;i<count;i++) {
        const angle = Math.random()*Math.PI*2;
        const speed = Math.random()*3+1.5;
        particles.push({
          x, y,
          vx: -(Math.random()*3+1),
          vy: (Math.random()-0.5)*3,
          life: 1,
          size: Math.random()*5+2.5,
          color: Math.random() < 0.5 ? '#22d3ee' : '#e879f9',
          decay: 0.04
        });
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

      // Cyber Glow
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 12;

      // Bird body (Glowing circle with radial shading)
      const bodyGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, b.r);
      bodyGrad.addColorStop(0, '#ffffff');
      bodyGrad.addColorStop(0.4, '#22d3ee');
      bodyGrad.addColorStop(1, '#0891b2');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, Math.PI*2);
      ctx.fill();

      // Cyber Beak (yellow glowing arrow)
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(b.r - 2, -6);
      ctx.lineTo(b.r + 10, 0);
      ctx.lineTo(b.r - 2, 6);
      ctx.closePath();
      ctx.fill();

      // Big round Eye
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.beginPath();
      ctx.arc(5, -4, 5, 0, Math.PI*2);
      ctx.fill();

      // Pupil (looking forward)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(6.5, -4, 2.2, 0, Math.PI*2);
      ctx.fill();

      // Animated Cyber Wing (flapping up/down)
      ctx.shadowColor = '#d946ef';
      ctx.fillStyle = '#d946ef';
      const wingCycle = Math.sin(frame * 0.4) * 8;
      const wingOffset = b.flapTimer > 0 ? -12 : wingCycle;
      
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.quadraticCurveTo(-4, -12 + wingOffset, 2, 0);
      ctx.quadraticCurveTo(-4, 4 + wingOffset/2, -10, 0);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      ctx.shadowBlur = 0;
    }

    function drawPipe(p) {
      const gapY = p.topH + GAP;
      
      ctx.save();
      // Neon green column style (glow)
      ctx.shadowColor = '#84cc16';
      ctx.shadowBlur = 8;
      
      // Top Pipe Column Gradient
      const topGrad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
      topGrad.addColorStop(0, '#3f6212');
      topGrad.addColorStop(0.3, '#a3e635');
      topGrad.addColorStop(0.7, '#84cc16');
      topGrad.addColorStop(1, '#3f6212');

      ctx.fillStyle = topGrad;
      // Top pipe
      ctx.fillRect(p.x, 0, PIPE_W, p.topH);
      // Top pipe lip
      ctx.fillStyle = '#a3e635';
      ctx.fillRect(p.x - 3, p.topH - 18, PIPE_W + 6, 18);
      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x - 3, p.topH - 18, PIPE_W + 6, 18);

      // Bottom Pipe Column
      const bottomGrad = ctx.createLinearGradient(p.x, gapY, p.x + PIPE_W, gapY);
      bottomGrad.addColorStop(0, '#3f6212');
      bottomGrad.addColorStop(0.3, '#a3e635');
      bottomGrad.addColorStop(0.7, '#84cc16');
      bottomGrad.addColorStop(1, '#3f6212');
      
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(p.x, gapY, PIPE_W, H-gapY-60);
      
      // Bottom pipe lip
      ctx.fillStyle = '#a3e635';
      ctx.fillRect(p.x - 3, gapY, PIPE_W + 6, 18);
      ctx.strokeRect(p.x - 3, gapY, PIPE_W + 6, 18);

      ctx.restore();
    }

    function drawGround() {
      // Dark cybernetic floor
      ctx.fillStyle = '#080816';
      ctx.fillRect(0, H-60, W, 60);
      
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, H-60);
      ctx.lineTo(W, H-60);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Moving cyber floor grid
      ctx.strokeStyle = 'rgba(217, 70, 239, 0.25)';
      ctx.lineWidth = 1.5;
      for(let i=0;i<12;i++) {
        const gx = ((frame * PIPE_SPEED * 0.7 + i * 40) % (W + 40)) - 20;
        ctx.beginPath();
        ctx.moveTo(gx, H-60);
        ctx.lineTo(gx - 15, H);
        ctx.stroke();
      }
    }

    function drawClouds() {
      clouds.forEach(c => {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.w/3, 0, Math.PI*2);
        ctx.arc(c.x + c.w/4, c.y - 5, c.w/3.5, 0, Math.PI*2);
        ctx.arc(c.x + c.w/2, c.y, c.w/3, 0, Math.PI*2);
        ctx.fill();
        
        if (gameState === 'playing') c.x -= c.speed;
        if (c.x + c.w < -20) { c.x = W + 40; c.y = 40 + Math.random()*80; }
      });
    }

    function update() {
      frame++;
      if(bird.flapTimer>0) bird.flapTimer--;

      if(gameState !== 'playing') return;

      bird.vy += GRAVITY;
      bird.vy = Math.min(bird.vy, 9.5);
      bird.y += bird.vy;
      bird.angle = Math.max(-25, Math.min(80, bird.vy * 4.5));

      // Pipes
      pipeTimer++;
      if(pipeTimer >= PIPE_INTERVAL) { spawnPipe(); pipeTimer=0; }
      pipes.forEach(p => p.x -= PIPE_SPEED * (1+score*0.01));
      pipes = pipes.filter(p => p.x > -PIPE_W-15);

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
          if(bird.y-bird.r+2<p.topH || bird.y+bird.r-2>p.topH+GAP) { die(); return; }
        }
      }

      // Particles
      particles = particles.filter(pt => {
        pt.x+=pt.vx; pt.y+=pt.vy; pt.vy+=0.06; pt.life-=pt.decay;
        return pt.life>0;
      });
    }

    function die() {
      gameState = 'dead';
      for(let i=0;i<24;i++) {
        const angle = Math.random()*Math.PI*2;
        const s = Math.random()*5+2.5;
        particles.push({
          x:bird.x, 
          y:bird.y, 
          vx:Math.cos(angle)*s, 
          vy:Math.sin(angle)*s, 
          life:1, 
          size:Math.random()*5+2.5,
          color: Math.random() < 0.5 ? '#22d3ee' : '#d946ef',
          decay: 0.04
        });
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
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size*p.life, 0, Math.PI*2);
        ctx.fill();
      });
      ctx.globalAlpha=1; ctx.shadowBlur=0;

      if(gameState !== 'dead') drawBird(bird);

      // Score displays
      ctx.fillStyle = 'white';
      ctx.font = 'bold 36px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 4;
      ctx.fillText(score, W/2, 65);
      ctx.font = '13px Orbitron, monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(`BEST: ${best}`, W/2, 86);
      ctx.textAlign = 'left';
      ctx.shadowBlur = 0;

      // Ready screen
      if(gameState === 'ready') {
        ctx.fillStyle = 'rgba(3,3,15,0.5)';
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TAP / SPACE', W/2, H/2-8);
        ctx.font = '12px Outfit, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('untuk mulai terbang!', W/2, H/2+14);
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
          <div class="game-over-title" style="color:#a3e635">GAME OVER</div>
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
