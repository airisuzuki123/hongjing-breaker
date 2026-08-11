(() => {
  'use strict';
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  // 逻辑坐标始终为 960×540；高 DPI 屏幕只放大 backing store，避免画面发虚。
  function resizeCanvas(){
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const pixelW = Math.max(1, Math.round(rect.width * dpr));
    const pixelH = Math.max(1, Math.round(rect.height * dpr));
    if(canvas.width !== pixelW || canvas.height !== pixelH){ canvas.width = pixelW; canvas.height = pixelH; }
    ctx.setTransform(pixelW / W, 0, 0, pixelH / H, 0, 0);
  }
  const ui = {
    score: document.getElementById('score'), lives: document.getElementById('lives'), stageText: document.getElementById('stageText'), stageMeter: document.getElementById('stageMeter'), status: document.getElementById('status'),
    start: document.getElementById('startOverlay'), pause: document.getElementById('pauseOverlay'), end: document.getElementById('endOverlay'), life: document.getElementById('lifeOverlay'),
    endEyebrow: document.getElementById('endEyebrow'), endTitle: document.getElementById('endTitle'), endMessage: document.getElementById('endMessage'), finalScore: document.getElementById('finalScore')
  };
  let focusBeforeDialog = null;
  function openDialog(el, focusSelector){
    focusBeforeDialog = document.activeElement;
    el.classList.remove('hidden');
    el.setAttribute('aria-hidden','false');
    requestAnimationFrame(() => el.querySelector(focusSelector)?.focus({preventScroll:true}));
  }
  function closeDialog(el, restore=true){
    el.classList.add('hidden');
    el.setAttribute('aria-hidden','true');
    if(restore && focusBeforeDialog && focusBeforeDialog.isConnected && typeof focusBeforeDialog.focus==='function') focusBeforeDialog.focus({preventScroll:true});
    if(restore) focusBeforeDialog=null;
  }
  const state = { mode: 'MENU', score: 0, lives: 3, stage: 0, targets: 0, muted: false, running: false, last: 0, lifeTimer: 0, shake: 0, particles: [], keys: {}, bricks: [], paddle: {x: W/2-64,y:H-42,w:128,h:14}, ball: {x:W/2,y:H-65,r:9,vx:230,vy:-310,stuck:false}, sound:null };
  const COLORS = ['#7865dc','#557ad7','#4fabc6','#5cbdad','#d77ab3'];
  function setStatus(msg){ ui.status.textContent = msg; }
  function audioBeep(freq=440,dur=.06){ if(state.muted) return; try{ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; state.sound ||= new AC(); const o=state.sound.createOscillator(), g=state.sound.createGain(); o.type='sine'; o.frequency.value=freq; g.gain.setValueAtTime(.045,state.sound.currentTime); g.gain.exponentialRampToValueAtTime(.001,state.sound.currentTime+dur); o.connect(g).connect(state.sound.destination); o.start(); o.stop(state.sound.currentTime+dur);}catch(e){} }
  function resetBricks(){ state.bricks=[]; const cols=9, rows=5, gap=8, bw=(W-100-gap*(cols-1))/cols, bh=24, left=50, top=74; let idx=0; for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){ const target=((r*cols+c)%7===0)||(r===2&&c===4); state.bricks.push({x:left+c*(bw+gap),y:top+r*(bh+gap),w:bw,h:bh,alive:true,target,hit:0,id:idx++}); } }
  function resetGame(){ state.mode='PLAYING'; state.score=0; state.lives=3; state.stage=0; state.targets=0; state.particles=[]; state.lifeTimer=0; state.shake=0; state.paddle.x=W/2-state.paddle.w/2; state.ball={x:W/2,y:H-65,r:9,vx:230,vy:-310,stuck:false}; resetBricks(); closeDialog(ui.start,false); closeDialog(ui.pause,false); closeDialog(ui.end,false); ui.life.classList.add('hidden'); ui.life.setAttribute('aria-hidden','true'); updateHud(); setStatus('能量球已出发，击碎全部虹晶砖块！'); canvas.focus({preventScroll:true}); audioBeep(520,.12); }
  function updateHud(){ ui.score.textContent=state.score; ui.lives.textContent=state.lives; const names=['完整','披风裂纹','肩甲崩解','核心显现']; ui.stageText.textContent=names[state.stage]; ui.stageMeter.style.width=(state.stage/3*100)+'%'; }
  function setMode(m){ state.mode=m; if(m!=='PAUSED') closeDialog(ui.pause,false); }
  function togglePause(){ if(state.mode==='PLAYING'){setMode('PAUSED');openDialog(ui.pause,'#resumeBtn');setStatus('已暂停。按 Space / P 或点击继续。');} else if(state.mode==='PAUSED'){setMode('PLAYING');closeDialog(ui.pause,true);setStatus('继续共鸣！'); state.last=performance.now();} }
  function launch(){ if(state.mode==='MENU'){resetGame();return;} if(state.mode==='PAUSED'){togglePause();} }
  function spawnParticles(x,y,color,count=8){ for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=30+Math.random()*150; state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-40,life:.45+Math.random()*.5,color});} }
  function loseLife(){ state.lives--; updateHud(); state.shake=.28; audioBeep(150,.18); if(state.lives<=0){state.mode='GAME_OVER';showEnd(false);return;} state.mode='LIFE_LOST'; state.lifeTimer=1.1; ui.life.classList.remove('hidden'); ui.life.setAttribute('aria-hidden','false'); ui.life.querySelector('#lifeMessage').textContent=`还剩 ${state.lives} 点生命，稳住节奏。`; setStatus('球体失活，挡板正在重置……'); state.ball={x:W/2,y:H-65,r:9,vx:(Math.random()>.5?1:-1)*220,vy:-315,stuck:false}; }
  function showEnd(win){ openDialog(ui.end,'#restartBtn'); ui.finalScore.textContent=state.score; ui.endEyebrow.textContent=win?'虹晶回响完成':'能量耗尽'; ui.endTitle.textContent=win?'共鸣成功':'挑战结束'; ui.endMessage.textContent=win?'全部砖块清除，战斗服核心已完全显现。':'生命归零，重新调整你的反弹角度。'; setStatus(win?'胜利！所有虹晶砖块都已击落。':'游戏结束。按 R 或点击再次挑战。'); audioBeep(win?880:120,.2); }
  function onBrickHit(b){ b.alive=false; state.score += b.target?150:50; spawnParticles(b.x+b.w/2,b.y+b.h/2,b.target?'#ff86c4':COLORS[b.id%COLORS.length],b.target?15:8); audioBeep(b.target?760:420,.055); if(b.target){ state.targets++; const next=Math.min(3,state.targets); if(next>state.stage){state.stage=next; updateHud(); setStatus(`护甲阶段 ${next}/3：${['','披风出现裂纹','肩甲正在崩解','核心护甲显现'][next]}！`); } } updateHud(); if(state.bricks.every(x=>!x.alive)){ state.mode='WON'; showEnd(true); } }
  function movePaddle(dt){ const speed=620; if(state.keys.ArrowLeft||state.keys.a) state.paddle.x-=speed*dt; if(state.keys.ArrowRight||state.keys.d) state.paddle.x+=speed*dt; state.paddle.x=Math.max(18,Math.min(W-state.paddle.w-18,state.paddle.x)); }
  function update(dt){ if(state.mode==='LIFE_LOST'){ state.lifeTimer-=dt; if(state.lifeTimer<=0){state.mode='PLAYING';ui.life.classList.add('hidden');ui.life.setAttribute('aria-hidden','true');setStatus('继续！找到节奏，保持球体在场内。');} return; } if(state.mode!=='PLAYING') return; movePaddle(dt); const b=state.ball; b.x+=b.vx*dt; b.y+=b.vy*dt; if(b.x-b.r<14){b.x=14+b.r;b.vx=Math.abs(b.vx);audioBeep(230,.025);} if(b.x+b.r>W-14){b.x=W-14-b.r;b.vx=-Math.abs(b.vx);audioBeep(230,.025);} if(b.y-b.r<16){b.y=16+b.r;b.vy=Math.abs(b.vy);audioBeep(250,.025);} const p=state.paddle; if(b.vy>0&&b.y+b.r>=p.y&&b.y-b.r<=p.y+p.h&&b.x>=p.x&&b.x<=p.x+p.w){const hit=(b.x-(p.x+p.w/2))/(p.w/2); b.vx=hit*390; b.vy=-Math.max(260,Math.abs(b.vy)*1.015); b.y=p.y-b.r-1;audioBeep(560,.045);} for(const brick of state.bricks){if(!brick.alive)continue; if(b.x+b.r>brick.x&&b.x-b.r<brick.x+brick.w&&b.y+b.r>brick.y&&b.y-b.r<brick.y+brick.h){const prevX=b.x-b.vx*dt, prevY=b.y-b.vy*dt; if(prevY+b.r<=brick.y||prevY-b.r>=brick.y+brick.h)b.vy*=-1;else b.vx*=-1;onBrickHit(brick);break;}} if(b.y-b.r>H){loseLife();} for(let i=state.particles.length-1;i>=0;i--){const q=state.particles[i];q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=200*dt;q.life-=dt;if(q.life<=0)state.particles.splice(i,1);} if(state.shake>0)state.shake-=dt; }
  function drawBackground(){ const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#141533');g.addColorStop(1,'#081d32');ctx.fillStyle=g;ctx.fillRect(0,0,W,H); ctx.globalAlpha=.25; for(let i=0;i<35;i++){const x=(i*137)%W,y=(i*71)%H,r=1+(i%3);ctx.fillStyle=i%2?'#8beaff':'#ffb2dc';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1; drawCharacter(); }
  function drawCharacter(){ const cx=W*.79, cy=H*.43, phase=state.stage; ctx.save(); ctx.translate(cx,cy); ctx.globalAlpha=.28; ctx.fillStyle='#8174ff';ctx.beginPath();ctx.ellipse(0,100,120,18,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1; // hair
    ctx.fillStyle='#2d245a';ctx.beginPath();ctx.ellipse(0,-70,58,65,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffdfc4';ctx.beginPath();ctx.arc(0,-70,38,0,Math.PI*2);ctx.fill(); // hair strands
    ctx.strokeStyle='#51418c';ctx.lineWidth=12;ctx.lineCap='round';for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(s*34,-94);ctx.quadraticCurveTo(s*72,-30,s*52,38);ctx.stroke();}
    // non-explicit armored outfit
    ctx.fillStyle=phase>=3?'#334a88':'#5840a8';ctx.beginPath();ctx.moveTo(-48,-28);ctx.lineTo(48,-28);ctx.lineTo(75,90);ctx.lineTo(-75,90);ctx.closePath();ctx.fill(); ctx.fillStyle='#8beaff';ctx.beginPath();ctx.moveTo(-17,-20);ctx.lineTo(0,-2);ctx.lineTo(17,-20);ctx.lineTo(0,65);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#ff9aca';ctx.lineWidth=phase>0?3:0; if(phase>0){ctx.beginPath();ctx.moveTo(-37,-12);ctx.lineTo(-12,30);ctx.lineTo(-30,73);ctx.moveTo(38,-10);ctx.lineTo(14,25);ctx.lineTo(31,70);ctx.stroke();} if(phase>1){ctx.strokeStyle='#ffe79b';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-58,-18);ctx.lineTo(-84,30);ctx.moveTo(58,-18);ctx.lineTo(84,30);ctx.stroke();} if(phase>2){ctx.strokeStyle='#fff4ba';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,25,30,0,Math.PI*2);ctx.stroke();} // eyes
    ctx.fillStyle='#30205a';ctx.beginPath();ctx.ellipse(-13,-72,4,8,0,0,Math.PI*2);ctx.ellipse(13,-72,4,8,0,0,Math.PI*2);ctx.fill();ctx.restore(); }
  function draw(){ ctx.save(); if(state.shake>0)ctx.translate((Math.random()-.5)*state.shake*18,(Math.random()-.5)*state.shake*18); drawBackground(); // arena frame
    ctx.strokeStyle='#8d7cff55';ctx.lineWidth=2;ctx.strokeRect(14,16,W-28,H-32); for(const brick of state.bricks){if(!brick.alive)continue; const grd=ctx.createLinearGradient(brick.x,brick.y,brick.x,brick.y+brick.h);grd.addColorStop(0,brick.target?'#ff8dc2':COLORS[brick.id%COLORS.length]);grd.addColorStop(1,brick.target?'#a83f84':'#252a69');ctx.fillStyle=grd;ctx.beginPath();ctx.roundRect(brick.x,brick.y,brick.w,brick.h,6);ctx.fill();ctx.strokeStyle=brick.target?'#ffe3a2':'#a7b9ff55';ctx.stroke();if(brick.target){ctx.fillStyle='#fff4b0';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('目标',brick.x+brick.w/2,brick.y+16);}} const p=state.paddle;const pg=ctx.createLinearGradient(p.x,p.y,p.x+p.w,p.y);pg.addColorStop(0,'#6be6ff');pg.addColorStop(.5,'#fff0a6');pg.addColorStop(1,'#ff83bd');ctx.fillStyle=pg;ctx.beginPath();ctx.roundRect(p.x,p.y,p.w,p.h,8);ctx.fill();ctx.fillStyle='#fff';ctx.globalAlpha=.5;ctx.fillRect(p.x+12,p.y+4,p.w-24,2);ctx.globalAlpha=1; const b=state.ball;ctx.shadowBlur=18;ctx.shadowColor='#ffe9a1';ctx.fillStyle='#fff2ac';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0; for(const q of state.particles){ctx.globalAlpha=Math.max(0,q.life);ctx.fillStyle=q.color;ctx.beginPath();ctx.arc(q.x,q.y,3,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;ctx.restore(); }
  function loop(t){ const dt=Math.min(.033,(t-state.last)/1000||0);state.last=t;update(dt);draw();requestAnimationFrame(loop); }
  function pointerMove(e){ const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W;state.paddle.x=x-state.paddle.w/2;state.paddle.x=Math.max(18,Math.min(W-state.paddle.w-18,state.paddle.x)); }
  window.addEventListener('keydown',e=>{const k=e.key; if(['ArrowLeft','ArrowRight',' ','a','d','A','D','p','P','Escape','r','R','Enter'].includes(k))e.preventDefault(); if(k==='Enter'&&state.mode==='MENU')launch(); else if(k===' '){if(state.mode==='MENU')launch();else togglePause();} else if(['p','P','Escape'].includes(k))togglePause(); else if(['r','R'].includes(k))resetGame(); else state.keys[k]=true;}); window.addEventListener('keyup',e=>{state.keys[e.key]=false;}); canvas.addEventListener('pointermove',pointerMove); canvas.addEventListener('pointerdown',e=>{pointerMove(e);if(state.mode==='MENU')launch();}); canvas.addEventListener('pointerup',()=>{});
  document.getElementById('startBtn').addEventListener('click',()=>{state.muted=!document.getElementById('startSound').checked;resetGame();}); document.getElementById('resumeBtn').addEventListener('click',togglePause); document.getElementById('restartPauseBtn').addEventListener('click',resetGame); document.getElementById('restartBtn').addEventListener('click',resetGame); document.getElementById('pauseBtn').addEventListener('click',togglePause); document.getElementById('muteBtn').addEventListener('click',()=>{state.muted=!state.muted;document.getElementById('muteBtn').textContent=state.muted?'×♫':'♫';document.getElementById('muteBtn').setAttribute('aria-label',state.muted?'关闭静音':'开启静音');setStatus(state.muted?'音效已静音。':'音效已开启。');});
  resizeCanvas(); window.addEventListener('resize',resizeCanvas); requestAnimationFrame(()=>document.getElementById('startBtn').focus({preventScroll:true}));
  updateHud(); draw(); requestAnimationFrame(loop);
})();
