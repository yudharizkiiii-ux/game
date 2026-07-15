// ===== DINO RUN =====
window.DinoGame = {
  launch() {
    const area = document.getElementById('game-area');
    area.innerHTML = '';
    document.getElementById('game-instructions').innerHTML =
      'Space / ↑ untuk melompat &nbsp;|&nbsp; ↓ untuk merunduk &nbsp;|&nbsp; Hindari rintangan!';

    const W = 600, H = 280;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    canvas.style.cssText = 'border-radius:12px;box-shadow:0 0 40px rgba(217,119,6,0.4);cursor:pointer';
    area.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const GROUND_Y = H - 50;
    const GRAVITY = 0.75;
    const JUMP_FORCE = -13.5;

    let dino = {x:80, y:GROUND_Y, w:42, h:46, vy:0, jumping:false, ducking:false, legFrame:0, frame:0, dead:false};
    let obstacles = [];
    let clouds = [];
    let mountains = [];
    let stars = [];
    let particles = [];
    
    let score = 0, speed = 5.5, frame = 0;
    let gameState = 'ready';
    let animId;
    let best = parseInt(localStorage.getItem('dino_best')||'0');
    let scoreTimer = 0;

    // Initial clouds, mountains, and stars
    for(let i=0;i<4;i++) clouds.push({x:100+i*200, y:30+Math.random()*40, w:50+Math.random()*30, speed:0.4+Math.random()*0.3});
    for(let i=0;i<5;i++) mountains.push({x:i*160, h:30+Math.random()*50, w:100+Math.random()*60, speed: 0.15});
    for(let i=0;i<40;i++) stars.push({x:Math.random()*W, y:Math.random()*H*0.45, r:Math.random()*1+0.5, blinkSpeed: 0.02+Math.random()*0.03, phase: Math.random()*Math.PI});

    function jump() {
      if(gameState==='dead') return;
      if(gameState==='ready') gameState='playing';
      if(!dino.jumping) { dino.vy=JUMP_FORCE; dino.jumping=true; }
    }

    function duck(active) { 
      if(gameState==='playing') { 
        dino.ducking=active; 
        dino.h=active?26:46; 
        dino.y=active?GROUND_Y+20:GROUND_Y; 
      } 
    }

    function spawnObstacle() {
      const type = (Math.random() < 0.35 && score > 80) ? 'bird' : 'cactus';
      if(type==='cactus') {
        const h = 25+Math.random()*25, count = Math.floor(Math.random()*2)+1;
        obstacles.push({type:'cactus', x:W+20, y:GROUND_Y, w:18*count, h, count});
      } else {
        const birdY = GROUND_Y - 24 - Math.random()*50;
        obstacles.push({type:'bird', x:W+20, y:birdY, w:38, h:24, wingUp:true, wingTimer:0});
      }
    }

    function addParticle(x, y, color='#d97706', count=6) {
      for(let i=0;i<count;i++) {
        const a=Math.random()*Math.PI*2, s=Math.random()*3.5+1;
        particles.push({
          x,
          y,
          vx:Math.cos(a)*s,
          vy:Math.sin(a)*s - 1.5,
          life:1,
          color,
          size:Math.random()*3.5+1.5,
          decay: 0.03+Math.random()*0.02
        });
      }
    }

    function drawDino(d) {
      const legCycle = Math.floor(d.legFrame / 4.5) % 2;
      const baseX = d.x - d.w/2;
      const baseY = d.y - d.h;
      
      const themeColor = d.dead ? '#f43f5e' : '#10b981';
      ctx.save();
      ctx.shadowColor = themeColor;
      ctx.shadowBlur = d.dead ? 18 : 12;
      ctx.fillStyle = themeColor;

      // Running dust effect
      if (gameState === 'playing' && !d.jumping && Math.random() < 0.25) {
        particles.push({
          x: d.x - 12,
          y: GROUND_Y + 5,
          vx: -speed * 0.4 - Math.random() * 1.5,
          vy: -Math.random() * 1,
          life: 0.7,
          color: '#6b7280',
          size: Math.random() * 3 + 1,
          decay: 0.05
        });
      }

      if(d.ducking) {
        // Ducking pose
        ctx.beginPath();
        ctx.roundRect(baseX - 4, baseY+16, d.w+14, 20, 6);
        ctx.fill();
        
        // Ducking head & mouth
        ctx.fillRect(baseX + d.w - 4, baseY+6, 20, 16);
        ctx.fillRect(baseX + d.w + 12, baseY+10, 8, 4);

        // Cyber Eye
        ctx.fillStyle = d.dead ? '#ffffff' : '#06b6d4';
        ctx.fillRect(baseX+d.w+4, baseY+10, 4, 4);

        // Ducking legs
        ctx.fillStyle = themeColor;
        ctx.fillRect(baseX + 6, baseY + d.h - 10, 8, 10);
        ctx.fillRect(baseX + d.w - 6, baseY + d.h - 10, 8, 10);
        
        ctx.restore();
        return;
      }

      // regular Dino
      // Tail
      ctx.beginPath();
      ctx.moveTo(baseX, baseY+22);
      ctx.quadraticCurveTo(baseX-14, baseY+26, baseX-6, baseY+38);
      ctx.lineTo(baseX+8, baseY+32);
      ctx.closePath();
      ctx.fill();

      // Body (round cyber armor plates)
      ctx.beginPath();
      ctx.roundRect(baseX+4, baseY+10, d.w-12, d.h-26, 8);
      ctx.fill();

      // Neck + Head
      ctx.fillRect(baseX+d.w-14, baseY-6, 16, 22);
      ctx.beginPath();
      ctx.roundRect(baseX+d.w-10, baseY-12, 20, 14, 3);
      ctx.fill();

      // Jaw/Snout
      ctx.fillRect(baseX+d.w-6, baseY-4, 16, 8);

      // Cyber glowing eye
      ctx.fillStyle = d.dead ? '#ffffff' : '#06b6d4';
      ctx.shadowColor = d.dead ? '#ffffff' : '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(baseX+d.w+4, baseY-6, 3, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowColor = themeColor;

      // Small arm
      ctx.fillStyle = themeColor;
      ctx.fillRect(baseX+d.w-12, baseY+14, 10, 5);

      // Legs with actual joints
      ctx.fillStyle = themeColor;
      if(d.jumping) {
        ctx.fillRect(baseX+8, baseY+d.h-14, 7, 10);
        ctx.fillRect(baseX+18, baseY+d.h-14, 7, 10);
      } else {
        if(legCycle===0) {
          ctx.fillRect(baseX+6, baseY+d.h-16, 6, 16); // Leg 1 down
          ctx.fillRect(baseX+18, baseY+d.h-12, 6, 12); // Leg 2 up
        } else {
          ctx.fillRect(baseX+6, baseY+d.h-12, 6, 12); // Leg 1 up
          ctx.fillRect(baseX+18, baseY+d.h-16, 6, 16); // Leg 2 down
        }
      }
      ctx.restore();
    }

    function drawCactus(o) {
      ctx.save();
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#fbbf24';

      const count = o.count||1;
      for(let i=0;i<count;i++) {
        const cx = o.x + i*16;
        const cy = o.y - o.h;
        // Saguaro cactus central trunk
        ctx.beginPath();
        ctx.roundRect(cx + 6, cy, 6, o.h, 3);
        ctx.fill();

        // Left branch
        ctx.beginPath();
        ctx.moveTo(cx+6, cy + o.h*0.4);
        ctx.lineTo(cx+1, cy + o.h*0.4);
        ctx.lineTo(cx+1, cy + o.h*0.1);
        ctx.lineTo(cx+4, cy + o.h*0.1);
        ctx.lineTo(cx+4, cy + o.h*0.3);
        ctx.lineTo(cx+6, cy + o.h*0.3);
        ctx.fill();

        // Right branch
        ctx.beginPath();
        ctx.moveTo(cx+12, cy + o.h*0.5);
        ctx.lineTo(cx+17, cy + o.h*0.5);
        ctx.lineTo(cx+17, cy + o.h*0.2);
        ctx.lineTo(cx+14, cy + o.h*0.2);
        ctx.lineTo(cx+14, cy + o.h*0.4);
        ctx.lineTo(cx+12, cy + o.h*0.4);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawBird(o) {
      // Rotating wing/propeller state
      ctx.save();
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ec4899';

      // Core drone shape
      ctx.beginPath();
      ctx.arc(o.x+19, o.y+12, 10, 0, Math.PI*2);
      ctx.fill();

      // Wing flaps using simple sinusoidal scaling
      const wingHeight = o.wingUp ? -12 : 12;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(o.x+19, o.y+12);
      ctx.lineTo(o.x+5, o.y+12 + wingHeight);
      ctx.moveTo(o.x+19, o.y+12);
      ctx.lineTo(o.x+33, o.y+12 + wingHeight);
      ctx.stroke();

      // Laser glowing sensor
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(o.x+24, o.y+12, 3, 0, Math.PI*2);
      ctx.fill();

      ctx.restore();
    }

    function getNightFactor() { return Math.min(1, score/200); }

    function drawScene() {
      const night = getNightFactor();
      
      // Sky gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#040212');
      bgGrad.addColorStop(1, '#0e0c26');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0,0,W,H);

      // Stars blinking
      stars.forEach(s => {
        const alpha = (0.3 + 0.7 * Math.sin(frame * s.blinkSpeed + s.phase)) * night;
        ctx.fillStyle = `rgba(6, 182, 212, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fill();
      });

      // Neon Moon
      if(night > 0.1) {
        ctx.save();
        ctx.globalAlpha = night;
        ctx.fillStyle = '#fef9c3';
        ctx.shadowColor = '#fef9c3';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(W-80, 42, 18, 0, Math.PI*2);
        ctx.fill();
        
        // Crescent shadow overlay
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0a0820'; // matches sky color
        ctx.beginPath();
        ctx.arc(W-73, 38, 16, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      }

      // Parallax Mountains (Move slowly)
      mountains.forEach(m => {
        ctx.fillStyle = night > 0.6 ? '#1b193d' : '#2e2b5c';
        ctx.beginPath();
        ctx.moveTo(m.x, GROUND_Y);
        ctx.lineTo(m.x + m.w/2, GROUND_Y - m.h);
        ctx.lineTo(m.x + m.w, GROUND_Y);
        ctx.closePath();
        ctx.fill();
        
        m.x -= m.speed;
        if(m.x + m.w < 0) { 
          m.x = W; 
          m.h = 30 + Math.random()*50; 
          m.w = 90 + Math.random()*50; 
        }
      });

      // Clouds (Move semi-slowly)
      clouds.forEach(c => {
        ctx.fillStyle = night > 0.5 ? 'rgba(129, 140, 248, 0.2)' : 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.w, 14, 7);
        ctx.fill();
        
        c.x -= c.speed;
        if(c.x + c.w < 0) { c.x = W + c.w; c.y = 20 + Math.random()*40; }
      });

      // Ground (Neon cyber grid line ground)
      ctx.fillStyle = night>0.5?'#1f2937':'#4b5563';
      ctx.fillRect(0, GROUND_Y, W, H-GROUND_Y);

      // Neon grid horizontal lines
      ctx.strokeStyle = night>0.5?'rgba(16,185,129,0.3)':'rgba(16,185,129,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(W, GROUND_Y);
      ctx.stroke();

      // Ground scrolling grid marks
      ctx.strokeStyle = night>0.5?'rgba(16,185,129,0.1)':'rgba(16,185,129,0.2)';
      ctx.lineWidth = 1;
      for(let i=0;i<15;i++) {
        const gx = (i*50 - (frame*speed)%50 + W)%W;
        ctx.beginPath();
        ctx.moveTo(gx, GROUND_Y);
        ctx.lineTo(gx - 20, H);
        ctx.stroke();
      }
    }

    function update() {
      frame++;
      dino.frame++;
      if(!dino.jumping && gameState==='playing') dino.legFrame++;

      if(gameState !== 'playing') return;

      // Dino physics
      dino.vy += GRAVITY;
      dino.y += dino.vy;
      if(dino.y >= (dino.ducking?GROUND_Y+20:GROUND_Y)) {
        dino.y = dino.ducking?GROUND_Y+20:GROUND_Y;
        dino.vy = 0; dino.jumping = false;
      }

      // Score & speed progression
      scoreTimer++;
      if(scoreTimer >= 8) { score++; scoreTimer=0; speed=5.5+score*0.005; }
      window.updateScore(score);
      if(score>best) { best=score; localStorage.setItem('dino_best',best); }

      // Spawn obstacles
      if(obstacles.length===0 || obstacles[obstacles.length-1].x < W - 220 - Math.random()*250) {
        spawnObstacle();
      }
      
      obstacles.forEach(o => {
        o.x -= speed;
        if(o.type==='bird') { 
          o.wingTimer++; 
          if(o.wingTimer > 8){ o.wingUp = !o.wingUp; o.wingTimer=0; } 
        }
      });
      obstacles = obstacles.filter(o => o.x > -60);

      // Collision detection
      for(const o of obstacles) {
        let margin = 5;
        const dinoLeft = dino.x-dino.w/2+margin, dinoRight=dino.x+dino.w/2-margin;
        const dinoTop=dino.y-dino.h+margin, dinoBot=dino.y-margin;
        const obsLeft=o.x+margin, obsRight=o.x+o.w-margin;
        const obsTop=o.y-o.h+margin, obsBot=o.y-margin;
        if(dinoRight>obsLeft && dinoLeft<obsRight && dinoBot>obsTop && dinoTop<obsBot) {
          die(); return;
        }
      }

      // Update Particles
      particles = particles.filter(p => {
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.life-=p.decay;
        return p.life>0;
      });
    }

    function die() {
      gameState = 'dead';
      dino.dead = true;
      addParticle(dino.x, dino.y-dino.h/2, '#f43f5e', 20);
      window.gameOver?.(score);
      setTimeout(()=>{
        const overlay=document.createElement('div');
        overlay.className='game-over-overlay';
        overlay.innerHTML=`
          <div class="game-over-content">
            <div class="game-over-title" style="color:#d97706">GAME OVER</div>
            <div class="game-over-score">Skor: ${score.toLocaleString()}</div>
            <div class="game-over-best">Best: ${best.toLocaleString()}</div>
            <div class="game-over-actions">
              <button class="btn-primary" onclick="document.getElementById('game-restart-btn').click()">🔄 Lari Lagi</button>
              <button class="btn-secondary" onclick="document.getElementById('game-close-btn').click()">✕ Keluar</button>
            </div>
          </div>
        `;
        area.style.position='relative'; area.appendChild(overlay);
      },600);
    }

    function draw() {
      drawScene();

      // Obstacles
      obstacles.forEach(o => {
        if(o.type==='cactus') drawCactus(o);
        else drawBird(o);
      });

      // Particles
      particles.forEach(p => {
        ctx.globalAlpha=p.life;
        ctx.fillStyle=p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath(); 
        ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); 
        ctx.fill();
      });
      ctx.globalAlpha=1;
      ctx.shadowBlur=0;

      // Dino
      drawDino(dino);

      // HUD UI overlay
      ctx.fillStyle='rgba(3, 7, 18, 0.7)';
      ctx.fillRect(0,0,W,36);
      ctx.strokeStyle='rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0,36); ctx.lineTo(W,36); ctx.stroke();

      ctx.fillStyle='white';
      ctx.font='bold 14px Orbitron,monospace';
      ctx.fillText(`${String(score).padStart(5,'0')}`, W/2-22, 23);
      ctx.fillStyle='rgba(255,255,255,0.5)';
      ctx.font='11px Orbitron,monospace';
      ctx.fillText(`HI ${String(best).padStart(5,'0')}`, W-95, 23);

      // Night / Time Senja Indicator
      const night = getNightFactor();
      if(night > 0.1) {
        ctx.fillStyle=`rgba(167,139,250,${night})`;
        ctx.font='10px Orbitron,monospace';
        ctx.fillText(night>0.7?'NIGHT MODE':'DUSK...', 15, 23);
      }

      // Press space screen
      if(gameState==='ready') {
        ctx.fillStyle='rgba(3,7,18,0.55)';
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle='white';
        ctx.font='bold 18px Orbitron,monospace';
        ctx.textAlign='center';
        ctx.fillText('PRESS SPACE', W/2, H/2-8);
        ctx.font='12px Outfit,sans-serif';
        ctx.fillStyle='rgba(255,255,255,0.6)';
        ctx.fillText('untuk mulai berlari!', W/2, H/2+14);
        ctx.textAlign='left';
      }

      animId=requestAnimationFrame(loop);
    }

    function loop() { update(); draw(); }

    const keyHandler = e => {
      if(e.key===' '||e.key==='ArrowUp') { jump(); e.preventDefault(); }
      if(e.key==='ArrowDown') { duck(true); e.preventDefault(); }
    };
    const keyUpHandler = e => { if(e.key==='ArrowDown') duck(false); };
    canvas.addEventListener('click', jump);
    canvas.addEventListener('touchstart', e=>{e.preventDefault();jump();},{passive:false});
    document.addEventListener('keydown', keyHandler);
    document.addEventListener('keyup', keyUpHandler);

    loop();

    return {
      destroy() {
        cancelAnimationFrame(animId);
        document.removeEventListener('keydown', keyHandler);
        document.removeEventListener('keyup', keyUpHandler);
      }
    };
  }
};
