// ===== SPACE SHOOTER GAME =====
window.ShooterGame = {
  launch() {
    const area = document.getElementById('game-area');
    area.innerHTML = '';
    document.getElementById('game-instructions').innerHTML =
      '← → Gerak &nbsp;|&nbsp; Space Tembak &nbsp;|&nbsp; Hindari tembakan musuh!';

    const W = 480, H = 560;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    canvas.style.cssText = 'border-radius:12px;box-shadow:0 0 40px rgba(239,68,68,0.3)';
    area.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let score = 0, lives = 3, level = 1, wave = 0;
    let gameRunning = true;
    let animId;
    let stars = [];
    let player = {x:W/2, y:H-60, w:36, h:40, speed:5, shootCooldown:0};
    let bullets = [], enemyBullets = [];
    let enemies = [], particles = [];
    let shields = 0;
    let keys = {};
    let screenShake = 0;

    // Stars background
    for(let i=0;i<80;i++) {
      stars.push({x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.5+0.5, speed:Math.random()*1.2+0.3, opacity:Math.random()*0.7+0.3});
    }

    function spawnWave() {
      wave++;
      const rows = Math.min(3, wave), cols = Math.min(8, 4+wave);
      for(let r=0;r<rows;r++) {
        for(let c=0;c<cols;c++) {
          const types = ['fighter','tank','shooter'];
          const type = wave<3?'fighter':types[Math.floor(Math.random()*types.length)];
          enemies.push({
            x: 40 + c*(W-80)/(cols-1||1),
            y: 40 + r*55,
            w: 32, h: 28,
            type,
            hp: type==='tank'?3:1,
            shootTimer: Math.random()*120+60,
            moveDir: 1,
            alive: true,
            rotAngle: 0
          });
        }
      }
    }

    function addParticle(x, y, color, count=12) {
      for(let i=0;i<count;i++) {
        const angle = Math.random()*Math.PI*2;
        const speed = Math.random()*5+2;
        particles.push({
          x,
          y,
          vx:Math.cos(angle)*speed,
          vy:Math.sin(angle)*speed,
          life:1,
          color,
          size:Math.random()*4+1.5,
          decay: Math.random()*0.03+0.02
        });
      }
    }

    function drawPlayer(x, y) {
      // Thrust flame particles
      if (Math.random() < 0.7) {
        particles.push({
          x: x - 6 + (Math.random() - 0.5) * 3,
          y: y + 16,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 3 + 3,
          life: 0.8,
          color: Math.random() < 0.3 ? '#ef4444' : '#f59e0b',
          size: Math.random() * 4 + 2,
          decay: 0.05
        });
        particles.push({
          x: x + 6 + (Math.random() - 0.5) * 3,
          y: y + 16,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 3 + 3,
          life: 0.8,
          color: Math.random() < 0.3 ? '#ef4444' : '#f59e0b',
          size: Math.random() * 4 + 2,
          decay: 0.05
        });
      }

      // Ship body with metallic gradient
      const bodyGrad = ctx.createLinearGradient(x-16, y, x+16, y);
      bodyGrad.addColorStop(0, '#0891b2');
      bodyGrad.addColorStop(0.5, '#22d3ee');
      bodyGrad.addColorStop(1, '#0891b2');

      ctx.fillStyle = bodyGrad;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      
      ctx.beginPath();
      ctx.moveTo(x, y-22);
      ctx.lineTo(x-16, y+16);
      ctx.lineTo(x-8, y+9);
      ctx.lineTo(x, y+13);
      ctx.lineTo(x+8, y+9);
      ctx.lineTo(x+16, y+16);
      ctx.closePath();
      ctx.fill();

      // Wing tip details
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(x-16, y+10);
      ctx.lineTo(x-20, y+16);
      ctx.lineTo(x-12, y+16);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x+16, y+10);
      ctx.lineTo(x+20, y+16);
      ctx.lineTo(x+12, y+16);
      ctx.closePath();
      ctx.fill();

      // Cockpit dome (glassmorphic blue)
      const domeGrad = ctx.createRadialGradient(x, y-2, 1, x, y-2, 6);
      domeGrad.addColorStop(0, '#ffffff');
      domeGrad.addColorStop(0.7, '#38bdf8');
      domeGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = domeGrad;
      ctx.beginPath();
      ctx.ellipse(x, y-4, 5, 8, 0, 0, Math.PI*2);
      ctx.fill();
      
      ctx.shadowBlur = 0;

      // Force Shield
      if(shields > 0) {
        ctx.strokeStyle = `rgba(167, 139, 250, ${0.4 + 0.3 * Math.sin(Date.now() / 150)})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(x, y, 32, 0, Math.PI*2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    function drawEnemy(e) {
      e.rotAngle += 0.02;
      const typeColor = e.type==='tank'?'#f43f5e':e.type==='shooter'?'#f59e0b':'#d946ef';
      ctx.shadowColor = typeColor;
      ctx.shadowBlur = 10;

      if(e.type === 'fighter') {
        // Advanced Fighter drawing
        ctx.fillStyle = typeColor;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y+15);
        ctx.lineTo(e.x-16, e.y-10);
        ctx.lineTo(e.x-6, e.y-3);
        ctx.lineTo(e.x, e.y-8);
        ctx.lineTo(e.x+6, e.y-3);
        ctx.lineTo(e.x+16, e.y-10);
        ctx.closePath();
        ctx.fill();

        // Thruster sparks
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(e.x-5, e.y-14, 2, 4);
        ctx.fillRect(e.x+3, e.y-14, 2, 4);
      } else if(e.type === 'tank') {
        // Heavily armored tank ship
        const tankGrad = ctx.createLinearGradient(e.x-16, e.y, e.x+16, e.y);
        tankGrad.addColorStop(0, '#be123c');
        tankGrad.addColorStop(0.5, '#fb7185');
        tankGrad.addColorStop(1, '#be123c');
        
        ctx.fillStyle = tankGrad;
        ctx.beginPath();
        ctx.roundRect(e.x-16, e.y-14, 32, 26, 4);
        ctx.fill();

        // Cannon barrel
        ctx.fillStyle = '#9f1239';
        ctx.fillRect(e.x-4, e.y+10, 8, 8);

        // Core shield overlay
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 1;
        ctx.strokeRect(e.x-12, e.y-10, 24, 18);

        // HP bars
        for(let i=0;i<e.hp;i++) {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(e.x-13+i*10, e.y-22, 7, 3);
        }
      } else {
        // Orb Core energy shooter
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.rotAngle);

        // Outer Ring
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI*2);
        ctx.stroke();

        // Outer triangles
        ctx.fillStyle = '#d97706';
        for(let i=0; i<4; i++) {
          ctx.rotate(Math.PI/2);
          ctx.beginPath();
          ctx.moveTo(-4, -14);
          ctx.lineTo(4, -14);
          ctx.lineTo(0, -20);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();

        // Central core
        const coreGrad = ctx.createRadialGradient(e.x, e.y, 1, e.x, e.y, 8);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.6, '#fbbf24');
        coreGrad.addColorStop(1, '#b45309');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 8, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    function update() {
      if (!gameRunning) return;

      // Screen shake decay
      if(screenShake > 0) screenShake *= 0.9;

      // Player movement
      if(keys['ArrowLeft']||keys['a']||keys['A']) player.x = Math.max(player.w/2, player.x-player.speed);
      if(keys['ArrowRight']||keys['d']||keys['D']) player.x = Math.min(W-player.w/2, player.x+player.speed);

      // Shoot
      if((keys[' ']||keys['z']) && player.shootCooldown <= 0) {
        bullets.push({x:player.x, y:player.y-20, vy:-11, w:5, h:16});
        player.shootCooldown = 11;
      }
      if(player.shootCooldown > 0) player.shootCooldown--;

      // Bullets
      bullets = bullets.filter(b => {
        b.y += b.vy;
        if(b.y < -20) return false;
        // Hit enemy
        for(let i=enemies.length-1;i>=0;i--) {
          const e = enemies[i];
          if(Math.abs(b.x-e.x)<17 && Math.abs(b.y-e.y)<15) {
            e.hp--;
            const particleColor = e.type==='tank'?'#ef4444':e.type==='shooter'?'#f59e0b':'#ec4899';
            if(e.hp <= 0) {
              addParticle(e.x, e.y, particleColor, 20);
              enemies.splice(i,1);
              score += e.type==='tank'?30:e.type==='shooter'?20:10;
              window.updateScore(score);
            } else {
              addParticle(e.x, e.y, particleColor, 4);
            }
            return false;
          }
        }
        return true;
      });

      // Enemies
      let touchedEdge = false;
      enemies.forEach(e => {
        e.x += e.moveDir * (1+level*0.3);
        if(e.x > W-24 || e.x < 24) touchedEdge = true;

        // Enemy shoot
        e.shootTimer--;
        if(e.shootTimer <= 0) {
          if(e.type!=='fighter') {
            enemyBullets.push({x:e.x, y:e.y+15, vx:(player.x-e.x)*0.015, vy:4+level*0.3});
          } else {
            enemyBullets.push({x:e.x, y:e.y+12, vx:0, vy:3+level*0.2});
          }
          e.shootTimer = 80 + Math.random()*80;
        }
      });
      if(touchedEdge) enemies.forEach(e=>{e.moveDir*=-1; e.y+=12;});

      // Enemy bullets
      enemyBullets = enemyBullets.filter(b => {
        b.x += b.vx; b.y += b.vy;
        if(b.y > H+20) return false;
        // Hit player
        if(Math.abs(b.x-player.x)<18 && Math.abs(b.y-player.y)<20) {
          screenShake = 12;
          if(shields > 0) { shields--; addParticle(player.x, player.y, '#c084fc', 8); return false; }
          lives--;
          addParticle(player.x, player.y, '#f43f5e', 22);
          if(lives <= 0) { endGame(); return false; }
          return false;
        }
        return true;
      });

      // Enemies reached bottom
      if(enemies.some(e=>e.y>H-60)) { endGame(); return; }

      // Next wave
      if(enemies.length === 0) {
        level++;
        score += 100;
        window.updateScore(score);
        spawnWave();
        window.showToast?.(`🚀 Wave ${wave}! Level ${level}`, 'info');
      }

      // Particles
      particles = particles.filter(p => {
        p.x+=p.vx; p.y+=p.vy; p.vx*=0.94; p.vy*=0.94; p.life-=p.decay;
        return p.life>0;
      });

      // Stars
      stars.forEach(s => { s.y+=s.speed; if(s.y>H) s.y=0; });
    }

    function draw() {
      ctx.save();
      // Screen shake translation
      if (screenShake > 0.5) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
      }

      // Space background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0,0,W,H);

      // Deep Space Nebulae
      const nebula1 = ctx.createRadialGradient(W/4, H/3, 0, W/4, H/3, 220);
      nebula1.addColorStop(0, 'rgba(124, 58, 237, 0.08)');
      nebula1.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula1;
      ctx.fillRect(0,0,W,H);

      const nebula2 = ctx.createRadialGradient(3*W/4, 2*H/3, 0, 3*W/4, 2*H/3, 180);
      nebula2.addColorStop(0, 'rgba(6, 182, 212, 0.06)');
      nebula2.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0,0,W,H);

      // Stars
      stars.forEach(s => {
        ctx.globalAlpha = s.opacity;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Particles
      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Player bullets
      bullets.forEach(b => {
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 15;
        const bulletGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
        bulletGrad.addColorStop(0, '#ffffff');
        bulletGrad.addColorStop(0.3, '#06b6d4');
        bulletGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = bulletGrad;
        ctx.beginPath();
        ctx.roundRect(b.x - b.w/2, b.y, b.w, b.h, 3);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Enemy bullets
      enemyBullets.forEach(b => {
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12;
        const enemyGrad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 7);
        enemyGrad.addColorStop(0, '#ffffff');
        enemyGrad.addColorStop(0.4, '#f43f5e');
        enemyGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
        ctx.fillStyle = enemyGrad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 7, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Enemies
      enemies.forEach(e => drawEnemy(e));

      // Player
      drawPlayer(player.x, player.y);

      // HUD overlay
      ctx.fillStyle = 'rgba(3, 7, 18, 0.75)';
      ctx.fillRect(0, 0, W, 45);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 45);
      ctx.lineTo(W, 45);
      ctx.stroke();

      ctx.fillStyle = '#f0f0ff';
      ctx.font = 'bold 13px Orbitron, monospace';
      ctx.fillText(`SCORE: ${score.toLocaleString()}`, 15, 27);
      ctx.fillText(`LVL: ${level}`, W/2-25, 27);

      // Lives hearts
      for(let i=0;i<lives;i++) {
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.font = '16px sans-serif';
        ctx.fillText('♥', W-32-i*24, 28);
      }
      ctx.shadowBlur = 0;

      // Wave indicator bar
      ctx.fillStyle = 'rgba(124,58,237,0.15)';
      ctx.fillRect(15, H-20, W-30, 4);
      ctx.fillStyle = 'linear-gradient(135deg,#7c3aed,#06b6d4)';
      ctx.fillStyle = '#7c3aed';
      const indicatorWidth = (enemies.length / ((Math.min(3, wave) * Math.min(8, 4+wave)) || 1)) * (W-30);
      ctx.fillRect(15, H-20, Math.max(0, indicatorWidth), 4);

      ctx.restore();

      if(gameRunning) animId = requestAnimationFrame(loop);
    }

    function loop() { update(); draw(); }

    function endGame() {
      gameRunning = false;
      cancelAnimationFrame(animId);
      window.gameOver?.(score);

      draw(); // final frame
      const overlay = document.createElement('div');
      overlay.className = 'game-over-overlay';
      overlay.innerHTML = `
        <div class="game-over-content">
          <div class="game-over-title" style="color:#ef4444">GAME OVER</div>
          <div class="game-over-score">Skor: ${score.toLocaleString()}</div>
          <div class="game-over-best">Wave ${wave} | Level ${level}</div>
          <div class="game-over-actions">
            <button class="btn-primary" onclick="document.getElementById('game-restart-btn').click()">🔄 Main Lagi</button>
            <button class="btn-secondary" onclick="document.getElementById('game-close-btn').click()">✕ Keluar</button>
          </div>
        </div>
      `;
      area.style.position = 'relative';
      area.appendChild(overlay);
    }

    const keydown = e => {
      keys[e.key] = true;
      if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) e.preventDefault();
    };
    const keyup = e => { keys[e.key] = false; };
    document.addEventListener('keydown', keydown);
    document.addEventListener('keyup', keyup);

    spawnWave();
    loop();

    return {
      destroy() {
        gameRunning = false;
        cancelAnimationFrame(animId);
        document.removeEventListener('keydown', keydown);
        document.removeEventListener('keyup', keyup);
      }
    };
  }
};
