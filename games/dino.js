// ===== DINO RUN (ORIGINAL) =====
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
    const GRAVITY = 0.7;
    const JUMP_FORCE = -14;

    let dino = {x:80, y:GROUND_Y, w:40, h:48, vy:0, jumping:false, ducking:false, legFrame:0, frame:0, dead:false};
    let obstacles = [];
    let clouds = [];
    let mountains = [];
    let score = 0, speed = 5, frame = 0;
    let gameState = 'ready';
    let animId;
    let particles = [];
    let best = parseInt(localStorage.getItem('dino_best')||'0');
    let scoreTimer = 0;
    let stars = [];

    // Initial clouds & mountains
    for(let i=0;i<4;i++) clouds.push({x:100+i*160, y:30+Math.random()*50, w:60+Math.random()*40, speed:1+Math.random()});
    for(let i=0;i<6;i++) mountains.push({x:i*120, h:40+Math.random()*60, w:80+Math.random()*60});
    // Stars (night)
    for(let i=0;i<30;i++) stars.push({x:Math.random()*W, y:Math.random()*H*0.5});

    function jump() {
      if(gameState==='dead') return;
      if(gameState==='ready') gameState='playing';
      if(!dino.jumping) { dino.vy=JUMP_FORCE; dino.jumping=true; }
    }

    function duck(active) { if(!dino.jumping) { dino.ducking=active; dino.h=active?28:48; dino.y=active?GROUND_Y+20:GROUND_Y; } }

    function spawnObstacle() {
      const type = Math.random()<0.35&&score>10?'bird':'cactus';
      if(type==='cactus') {
        const h = 30+Math.random()*30, count = Math.floor(Math.random()*2)+1;
        obstacles.push({type:'cactus',x:W+10,y:GROUND_Y+2,w:20*count,h,count});
      } else {
        const birdY = GROUND_Y - 30 - Math.random()*60;
        obstacles.push({type:'bird',x:W+10,y:birdY,w:44,h:28,wingUp:true,wingTimer:0});
      }
    }

    function addParticle(x,y,color='#d97706',count=6) {
      for(let i=0;i<count;i++) {
        const a=Math.random()*Math.PI*2,s=Math.random()*3+1;
        particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,life:1,color,size:Math.random()*4+2});
      }
    }

    function drawDino(d) {
      const legCycle = Math.floor(d.legFrame/3)%2;
      const baseX = d.x - d.w/2;
      const baseY = d.y - d.h;
      
      // 4D Cyber Dino Neon Color Theme
      const color = d.dead ? '#ef4444' : '#10b981';
      const shadowColor = d.dead ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)';

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = color;

      if(d.ducking) {
        // Ducking pose
        ctx.beginPath();
        ctx.roundRect(baseX, baseY+20, d.w+12, 24, 6);
        ctx.fill();
        
        // Head
        ctx.fillRect(baseX+d.w-4, baseY+12, 22, 20);
        ctx.restore();
        return;
      }

      // Tail
      ctx.fillRect(baseX-4, baseY+32, 10, 8);

      // Body (sleek polygons instead of blocks for cyber aesthetic)
      ctx.beginPath();
      ctx.roundRect(baseX+8, baseY+14, d.w-12, d.h-30, 6);
      ctx.fill();

      // Neck+Head
      ctx.fillRect(baseX+d.w-14, baseY, 22, 24);
      ctx.fillRect(baseX+d.w-8, baseY-4, 18, 14);

      // Neon Eye
      ctx.fillStyle = d.dead ? '#ef4444' : '#06b6d4';
      ctx.fillRect(baseX+d.w+2, baseY-2, 6, 6);

      // Arm
      ctx.fillStyle = color;
      ctx.fillRect(baseX+d.w-16, baseY+18, 12, 6);

      // Legs
      if(d.jumping) {
        ctx.fillRect(baseX+10, baseY+d.h-16, 8, 12);
        ctx.fillRect(baseX+22, baseY+d.h-12, 8, 8);
      } else {
        if(legCycle===0) {
          ctx.fillRect(baseX+10, baseY+d.h-18, 8, 18);
          ctx.fillRect(baseX+22, baseY+d.h-14, 8, 6);
        } else {
          ctx.fillRect(baseX+10, baseY+d.h-14, 8, 6);
          ctx.fillRect(baseX+22, baseY+d.h-18, 8, 18);
        }
      }
      ctx.restore();
    }

    function drawCactus(o) {
      // Glow effect for cyber-obstacles
      ctx.save();
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#f59e0b';

      const count = o.count||1;
      for(let i=0;i<count;i++) {
        const cx = o.x + i*20;
        // Draw cyber spike shapes
        ctx.beginPath();
        ctx.moveTo(cx, o.y);
        ctx.lineTo(cx + 8, o.y - o.h);
        ctx.lineTo(cx + 16, o.y);
        ctx.closePath();
        ctx.fill();

        // Branching spike spikes
        ctx.fillRect(cx-4, o.y-o.h+12, 6, 4);
        ctx.fillRect(cx+14, o.y-o.h+18, 6, 4);
      }
      ctx.restore();
    }

    function drawBird(o) {
      // Draw flying hacker drone
      ctx.save();
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ec4899';

      // Core drone circle
      ctx.beginPath();
      ctx.arc(o.x+22, o.y+14, 12, 0, Math.PI*2);
      ctx.fill();

      // Wing/Propeller blades
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if(o.wingUp) {
        ctx.moveTo(o.x+10, o.y+4);
        ctx.lineTo(o.x+34, o.y+4);
      } else {
        ctx.moveTo(o.x+10, o.y+24);
        ctx.lineTo(o.x+34, o.y+24);
      }
      ctx.stroke();

      // Laser lens eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(o.x+30, o.y+14, 4, 0, Math.PI*2);
      ctx.fill();

      ctx.restore();
    }

    function getNightFactor() { return Math.min(1, score/250); }

    function drawScene() {
      const night = getNightFactor();
      // Cyber sky gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#040212');
      bgGrad.addColorStop(1, '#0e0c26');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0,0,W,H);

      // Stars (appear at night)
      if(night > 0.3) {
        ctx.globalAlpha = (night-0.3)*1.5;
        stars.forEach(s => {
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(s.x,s.y,2,2);
        });
        ctx.globalAlpha=1;
      }

      // Moon
      if(night > 0.2) {
        ctx.globalAlpha = (night-0.2)*1.5;
        ctx.fillStyle='#fef9c3';
        ctx.shadowColor='#fef9c3'; ctx.shadowBlur=20;
        ctx.beginPath(); ctx.arc(W-80,40,20,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=`rgb(${r},${g},${b})`;
        ctx.beginPath(); ctx.arc(W-72,36,16,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0; ctx.globalAlpha=1;
      }

      // Mountains
      mountains.forEach(m => {
        ctx.fillStyle = night>0.5 ? '#1e1b4b' : '#312e81';
        ctx.beginPath();
        ctx.moveTo(m.x, GROUND_Y);
        ctx.lineTo(m.x+m.w/2, GROUND_Y-m.h);
        ctx.lineTo(m.x+m.w, GROUND_Y);
        ctx.closePath();
        ctx.fill();
        m.x -= 0.3;
        if(m.x+m.w < 0) { m.x=W; m.h=40+Math.random()*60; m.w=80+Math.random()*60; }
      });

      // Clouds
      clouds.forEach(c => {
        ctx.fillStyle = night>0.4 ? 'rgba(100,100,150,0.4)' : 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(c.x,c.y,c.w/3,0,Math.PI*2);
        ctx.arc(c.x+c.w/4,c.y-6,c.w/4,0,Math.PI*2);
        ctx.arc(c.x+c.w/2,c.y,c.w/3.5,0,Math.PI*2);
        ctx.fill();
        c.x -= c.speed;
        if(c.x+c.w<0) { c.x=W+c.w; c.y=20+Math.random()*60; }
      });

      // Ground
      const groundColor = night>0.5?'#374151':'#6b7280';
      ctx.fillStyle = groundColor;
      ctx.fillRect(0, GROUND_Y, W, H-GROUND_Y);

      // Ground texture
      ctx.fillStyle = night>0.5?'#4b5563':'#9ca3af';
      ctx.fillRect(0, GROUND_Y, W, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      for(let i=0;i<20;i++) {
        const gx = (i*60 - (frame*speed*0.5)%60+W)%W;
        ctx.fillRect(gx, GROUND_Y+6, 30, 3);
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

      // Score & speed
      scoreTimer++;
      if(scoreTimer >= 8) { score++; scoreTimer=0; speed=5+score*0.006; }
      window.updateScore(score);
      if(score>best) { best=score; localStorage.setItem('dino_best',best); }

      // Obstacles
      if(obstacles.length===0 || obstacles[obstacles.length-1].x < W - 200 - Math.random()*300) {
        spawnObstacle();
      }
      obstacles.forEach(o => {
        o.x -= speed;
        if(o.type==='bird') { o.wingTimer++; if(o.wingTimer>10){o.wingUp=!o.wingUp;o.wingTimer=0;} }
      });
      obstacles = obstacles.filter(o => o.x > -60);

      // Collision detection
      for(const o of obstacles) {
        let margin = 6;
        const dinoLeft = dino.x-dino.w/2+margin, dinoRight=dino.x+dino.w/2-margin;
        const dinoTop=dino.y-dino.h+margin, dinoBot=dino.y-margin;
        const obsLeft=o.x-margin, obsRight=o.x+o.w-margin;
        const obsTop=o.y-o.h-margin, obsBot=o.y+o.h-margin;
        if(dinoRight>obsLeft && dinoLeft<obsRight && dinoBot>obsTop && dinoTop<obsBot) {
          die(); return;
        }
      }

      // Particles
      particles = particles.filter(p => {
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life-=0.04;
        return p.life>0;
      });
    }

    function die() {
      gameState = 'dead';
      dino.dead = true;
      addParticle(dino.x, dino.y-dino.h/2, '#ef4444', 15);
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
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha=1;

      // Dino
      drawDino(dino);

      // HUD
      ctx.fillStyle='rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,W,36);
      ctx.fillStyle='white';
      ctx.font='bold 14px Orbitron,monospace';
      ctx.fillText(`${String(score).padStart(5,'0')}`, W/2-28, 24);
      ctx.fillStyle='rgba(255,255,255,0.5)';
      ctx.font='11px Orbitron,monospace';
      ctx.fillText(`HI ${String(best).padStart(5,'0')}`, W-105, 24);

      // Night indicator
      const night = getNightFactor();
      if(night > 0.1) {
        ctx.fillStyle=`rgba(124,58,237,${night*0.3})`;
        ctx.fillRect(0,0,W,36);
        ctx.fillStyle=`rgba(167,139,250,${night})`;
        ctx.font='11px Outfit,sans-serif';
        ctx.fillText(night>0.7?'🌙 Malam Gelap!':'🌆 Senja...', 10, 24);
      }

      // Ready screen
      if(gameState==='ready') {
        ctx.fillStyle='rgba(0,0,0,0.5)';
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle='white';
        ctx.font='bold 20px Orbitron,monospace';
        ctx.textAlign='center';
        ctx.fillText('PRESS SPACE', W/2, H/2-10);
        ctx.font='13px Outfit,sans-serif';
        ctx.fillStyle='rgba(255,255,255,0.6)';
        ctx.fillText('untuk mulai berlari!', W/2, H/2+16);
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
