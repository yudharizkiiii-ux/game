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
    let powerups = [];
    let shields = 0;
    let keys = {};

    // Stars background
    for(let i=0;i<80;i++) {
      stars.push({x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.5+0.5, speed:Math.random()*1+0.2, opacity:Math.random()*0.7+0.3});
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
            alive: true
          });
        }
      }
    }

    function addParticle(x, y, color, count=8) {
      for(let i=0;i<count;i++) {
        const angle = Math.random()*Math.PI*2;
        const speed = Math.random()*4+1;
        particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1,color,size:Math.random()*3+1});
      }
    }

    function drawPlayer(x, y) {
      // Ship body
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(x, y-20);
      ctx.lineTo(x-16, y+18);
      ctx.lineTo(x-8, y+10);
      ctx.lineTo(x, y+14);
      ctx.lineTo(x+8, y+10);
      ctx.lineTo(x+16, y+18);
      ctx.closePath();
      ctx.fill();

      // Cockpit
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.ellipse(x, y-4, 5, 8, 0, 0, Math.PI*2);
      ctx.fill();

      // Engine glow
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(x-6, y+16, 3, 5, 0, 0, Math.PI*2);
      ctx.ellipse(x+6, y+16, 3, 5, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Shield
      if(shields > 0) {
        ctx.strokeStyle = `rgba(124,58,237,${0.4+0.3*Math.sin(Date.now()/200)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI*2);
        ctx.stroke();
      }
    }

    function drawEnemy(e) {
      ctx.shadowColor = e.type==='tank'?'#ef4444':e.type==='shooter'?'#f59e0b':'#ec4899';
      ctx.shadowBlur = 10;
      if(e.type === 'fighter') {
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.moveTo(e.x, e.y+12);
        ctx.lineTo(e.x-14, e.y-12);
        ctx.lineTo(e.x-6, e.y-4);
        ctx.lineTo(e.x, e.y-8);
        ctx.lineTo(e.x+6, e.y-4);
        ctx.lineTo(e.x+14, e.y-12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,200,200,0.5)';
        ctx.beginPath();
        ctx.ellipse(e.x, e.y, 4, 5, 0, 0, Math.PI*2);
        ctx.fill();
      } else if(e.type === 'tank') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(e.x-16, e.y-14, 32, 28);
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(e.x-10, e.y-8, 20, 16);
        // HP bars
        for(let i=0;i<e.hp;i++) {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(e.x-12+i*10, e.y+16, 8, 3);
        }
      } else {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(e.x, e.y, 15, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(e.x, e.y, 6, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    function update() {
      // Player movement
      if(keys['ArrowLeft']||keys['a']||keys['A']) player.x = Math.max(player.w/2, player.x-player.speed);
      if(keys['ArrowRight']||keys['d']||keys['D']) player.x = Math.min(W-player.w/2, player.x+player.speed);

      // Shoot
      if((keys[' ']||keys['z']) && player.shootCooldown <= 0) {
        bullets.push({x:player.x, y:player.y-20, vy:-10, w:4, h:12});
        player.shootCooldown = 12;
      }
      if(player.shootCooldown > 0) player.shootCooldown--;

      // Bullets
      bullets = bullets.filter(b => {
        b.y += b.vy;
        if(b.y < -20) return false;
        // Hit enemy
        for(let i=enemies.length-1;i>=0;i--) {
          const e = enemies[i];
          if(Math.abs(b.x-e.x)<16 && Math.abs(b.y-e.y)<14) {
            e.hp--;
            if(e.hp <= 0) {
              addParticle(e.x, e.y, e.type==='tank'?'#ef4444':e.type==='shooter'?'#f59e0b':'#ec4899', 12);
              enemies.splice(i,1);
              score += e.type==='tank'?30:e.type==='shooter'?20:10;
              window.updateScore(score);
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
            enemyBullets.push({x:e.x, y:e.y+15, vx:(player.x-e.x)*0.02, vy:4+level*0.3});
          } else {
            enemyBullets.push({x:e.x, y:e.y+12, vx:0, vy:3+level*0.2});
          }
          e.shootTimer = 80 + Math.random()*80;
        }
      });
      if(touchedEdge) enemies.forEach(e=>{e.moveDir*=-1; e.y+=10;});

      // Enemy bullets
      enemyBullets = enemyBullets.filter(b => {
        b.x += b.vx; b.y += b.vy;
        if(b.y > H+20) return false;
        // Hit player
        if(Math.abs(b.x-player.x)<18 && Math.abs(b.y-player.y)<20) {
          if(shields > 0) { shields--; addParticle(player.x, player.y, '#7c3aed', 6); return false; }
          lives--;
          addParticle(player.x, player.y, '#ef4444', 15);
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
        p.x+=p.vx; p.y+=p.vy; p.vx*=0.92; p.vy*=0.92; p.life-=0.04;
        return p.life>0;
      });

      // Stars
      stars.forEach(s => { s.y+=s.speed; if(s.y>H) s.y=0; });
    }

    function draw() {
      // Space background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0,0,W,H);

      // Nebula
      const nebula = ctx.createRadialGradient(W/2,H/3,0,W/2,H/3,200);
      nebula.addColorStop(0,'rgba(124,58,237,0.05)');
      nebula.addColorStop(1,'transparent');
      ctx.fillStyle = nebula;
      ctx.fillRect(0,0,W,H);

      // Stars
      stars.forEach(s => {
        ctx.globalAlpha = s.opacity;
        ctx.fillStyle = 'white';
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
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size*p.life, 0, Math.PI*2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Player bullets (neon cyber-lasers with tail gradients)
      bullets.forEach(b => {
        ctx.shadowColor = '#06b6d4';
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

      // Enemy bullets (hot glowing plasmatic spheres)
      enemyBullets.forEach(b => {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
        const enemyGrad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 6);
        enemyGrad.addColorStop(0, '#ffffff');
        enemyGrad.addColorStop(0.4, '#ef4444');
        enemyGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = enemyGrad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 6, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Enemies
      enemies.forEach(e => drawEnemy(e));

      // Player
      drawPlayer(player.x, player.y);

      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, 40);
      ctx.fillStyle = '#f0f0ff';
      ctx.font = 'bold 13px Orbitron, monospace';
      ctx.fillText(`SCORE: ${score.toLocaleString()}`, 10, 25);
      ctx.fillText(`LVL: ${level}`, W/2-30, 25);

      // Lives
      for(let i=0;i<lives;i++) {
        ctx.fillStyle = '#06b6d4';
        ctx.font = '16px sans-serif';
        ctx.fillText('♥', W-28-i*22, 26);
      }

      // Wave indicator
      ctx.fillStyle = 'rgba(124,58,237,0.3)';
      ctx.fillRect(10, H-24, (enemies.length||0)*4, 4);

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
      if([' ','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
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
