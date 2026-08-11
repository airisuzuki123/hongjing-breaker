(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = 960;
  const H = 540;
  const GRID_COLS = 8;
  const GRID_ROWS = 6;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const pixelW = Math.max(1, Math.round(rect.width * dpr));
    const pixelH = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== pixelW || canvas.height !== pixelH) {
      canvas.width = pixelW;
      canvas.height = pixelH;
    }
    ctx.setTransform(pixelW / W, 0, 0, pixelH / H, 0, 0);
  }

  function cellsFor(type) {
    const cells = [];
    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let col = 0; col < GRID_COLS; col += 1) {
        let include = true;
        if (type === 'symmetry') include = !(row === 2 && (col === 3 || col === 4));
        if (type === 'center-hole') include = !(row >= 2 && row <= 3 && col >= 3 && col <= 4);
        if (type === 'stairs') {
          const radius = Math.min(row, GRID_ROWS - 1 - row);
          const edgeRadius = radius === 0 ? 1 : radius;
          include = col >= 3 - edgeRadius && col <= 4 + edgeRadius;
        }
        if (type === 'ring') include = row === 0 || row === GRID_ROWS - 1 || col === 0 || col === GRID_COLS - 1 || ((row === 2 || row === 3) && col >= 2 && col <= 5);
        if (type === 'mixed') include = (row === 0 && (col < 3 || col > 4)) || (row === 1) || (row >= 3 && col >= 2 && col <= 5) || (row === 2 && col >= 2 && col <= 5);
        if (include) cells.push([col, row]);
      }
    }
    return cells;
  }

  const LEVELS = [
    {
      id: 1, name: '星火礼堂', difficulty: '入门', background: 'assets/level-03.jpg', layoutName: '基础矩形', brickLayout: { type: 'rectangle', cells: cellsFor('rectangle') },
      rainbowBricks: [[1, 1], [5, 2], [3, 4]], powerupBricks: [[4, 1]],
      mosaicModules: [{ x: 580, y: 145, w: 220, h: 150 }, { x: 365, y: 285, w: 220, h: 125 }, { x: 30, y: 360, w: 180, h: 125 }, { x: 690, y: 365, w: 200, h: 120 }], permanentMasks: []
    },
    {
      id: 2, name: '秋庭秘仪', difficulty: '入门+', background: 'assets/level-05.jpg', layoutName: '左右对称', brickLayout: { type: 'symmetry', cells: cellsFor('symmetry') },
      rainbowBricks: [[1, 1], [6, 1], [3, 4]], powerupBricks: [[2, 2], [5, 3]],
      mosaicModules: [{ x: 60, y: 170, w: 190, h: 145 }, { x: 365, y: 160, w: 210, h: 155 }, { x: 650, y: 205, w: 235, h: 145 }, { x: 410, y: 350, w: 230, h: 120 }], permanentMasks: []
    },
    {
      id: 3, name: '新春灯影', difficulty: '标准', background: 'assets/level-04.jpg', layoutName: '中心空洞', brickLayout: { type: 'center-hole', cells: cellsFor('center-hole') },
      rainbowBricks: [[2, 1], [5, 3], [3, 5]], powerupBricks: [[6, 2]],
      mosaicModules: [{ x: 130, y: 145, w: 210, h: 150 }, { x: 390, y: 195, w: 190, h: 135 }, { x: 645, y: 300, w: 230, h: 150 }, { x: 45, y: 350, w: 180, h: 120 }], permanentMasks: []
    },
    {
      id: 4, name: '月夜花园', difficulty: '标准+', background: 'assets/scene-moonlit-2025.jpg', layoutName: '阶梯回廊', brickLayout: { type: 'stairs', cells: cellsFor('stairs') },
      rainbowBricks: [[3, 0], [1, 2], [4, 4]], powerupBricks: [[2, 3]],
      mosaicModules: [{ x: 220, y: 195, w: 205, h: 150 }, { x: 515, y: 190, w: 180, h: 165 }, { x: 570, y: 372, w: 220, h: 113 }, { x: 70, y: 360, w: 150, h: 105 }], permanentMasks: []
    },
    {
      id: 5, name: '鎏金舞会', difficulty: '进阶', background: 'assets/scene-gala-2022.jpg', layoutName: '环形双层', brickLayout: { type: 'ring', cells: cellsFor('ring') },
      rainbowBricks: [[0, 0], [7, 5], [3, 2]], powerupBricks: [[4, 2], [2, 5]],
      mosaicModules: [{ x: 32, y: 180, w: 235, h: 168 }, { x: 215, y: 358, w: 240, h: 135 }, { x: 750, y: 345, w: 180, h: 145 }, { x: 530, y: 385, w: 150, h: 95 }], permanentMasks: []
    },
    {
      id: 6, name: '夜宴终章', difficulty: '进阶+', background: 'assets/level-06.jpg', layoutName: '混合多区', brickLayout: { type: 'mixed', cells: cellsFor('mixed') },
      rainbowBricks: [[1, 0], [6, 1], [4, 4]], powerupBricks: [[3, 4]],
      mosaicModules: [{ x: 80, y: 160, w: 180, h: 150 }, { x: 410, y: 155, w: 220, h: 145 }, { x: 685, y: 250, w: 200, h: 140 }, { x: 260, y: 350, w: 220, h: 120 }], permanentMasks: []
    }
  ];

  const ui = {
    score: document.getElementById('score'), lives: document.getElementById('lives'), ballCount: document.getElementById('ballCount'), stageText: document.getElementById('stageText'), stageMeter: document.getElementById('stageMeter'), powerupStatus: document.getElementById('powerupStatus'), status: document.getElementById('status'),
    levelBtn: document.getElementById('levelBtn'), pauseBtn: document.getElementById('pauseBtn'), muteBtn: document.getElementById('muteBtn'),
    start: document.getElementById('startOverlay'), level: document.getElementById('levelOverlay'), pause: document.getElementById('pauseOverlay'), end: document.getElementById('endOverlay'), life: document.getElementById('lifeOverlay'),
    levelGrid: document.getElementById('levelGrid'), endEyebrow: document.getElementById('endEyebrow'), endTitle: document.getElementById('endTitle'), endMessage: document.getElementById('endMessage'), finalScore: document.getElementById('finalScore'), nextLevelBtn: document.getElementById('nextLevelBtn')
  };

  const mosaicCanvas = document.createElement('canvas');
  const mosaicCtx = mosaicCanvas.getContext('2d');
  const levelImages = LEVELS.map((level) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = level.background;
    image.addEventListener('load', draw);
    return image;
  });
  const state = {
    mode: 'MENU', level: 1, score: 0, lives: 3, stage: 0, rainbowHits: 0, muted: false, last: 0, lifeTimer: 0, shake: 0, sealFlash: 0, bannerTimer: 0, bannerText: '', multiBall: false, powerupUsed: false, powerupDropped: false, powerup: null, particles: [], impactRings: [], keys: {}, bricks: [], balls: [{ x: W / 2, y: H - 65, r: 9, vx: 230, vy: -310 }], paddle: { x: W / 2 - 64, y: H - 42, w: 128, h: 14 }, sound: null
  };
  let focusBeforeDialog = null;

  function currentLevel() { return LEVELS[state.level - 1]; }
  function setStatus(message) { ui.status.textContent = message; }
  function getUnlockedLevel() { try { return Math.max(1, Math.min(6, Number(localStorage.getItem('slime-unlocked-level')) || 1)); } catch (_) { return 1; } }
  function setUnlockedLevel(level) { try { localStorage.setItem('slime-unlocked-level', String(Math.max(getUnlockedLevel(), Math.min(6, level)))); } catch (_) {} }

  function openDialog(element, focusSelector) {
    focusBeforeDialog = document.activeElement;
    element.classList.remove('hidden');
    element.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => element.querySelector(focusSelector)?.focus({ preventScroll: true }));
  }
  function closeDialog(element, restore = true) {
    element.classList.add('hidden');
    element.setAttribute('aria-hidden', 'true');
    if (restore && focusBeforeDialog?.isConnected && typeof focusBeforeDialog.focus === 'function') focusBeforeDialog.focus({ preventScroll: true });
    if (restore) focusBeforeDialog = null;
  }

  function buildLevelCards() {
    const unlocked = getUnlockedLevel();
    ui.levelGrid.replaceChildren();
    for (const level of LEVELS) {
      const card = document.createElement('button');
      const locked = level.id > unlocked;
      card.type = 'button';
      card.className = `level-card${level.id === state.level ? ' is-current' : ''}`;
      card.dataset.level = String(level.id);
      card.disabled = locked;
      card.style.backgroundImage = `linear-gradient(135deg, rgba(11,12,34,.88), rgba(18,18,43,.6)), url("${level.background}")`;
      card.style.backgroundPosition = 'center';
      card.style.backgroundSize = 'cover';
      card.setAttribute('aria-label', locked ? `第${level.id}关 ${level.name}，已锁定` : `第${level.id}关 ${level.name}，难度${level.difficulty}`);
      card.innerHTML = `<strong>第${level.id}关 · ${level.name}</strong><small>${level.difficulty}</small><span class="level-lock">${locked ? '🔒 未解锁' : '✓ 可挑战'}</span>`;
      card.addEventListener('click', () => startLevel(level.id));
      ui.levelGrid.appendChild(card);
    }
  }

  function showLevelSelect() {
    closeDialog(ui.start, false);
    closeDialog(ui.pause, false);
    closeDialog(ui.end, false);
    state.mode = 'LEVEL_SELECT';
    buildLevelCards();
    openDialog(ui.level, `.level-card:not(:disabled)`);
    setStatus('选择一关开始挑战。');
  }

  function showStart() {
    closeDialog(ui.level, false);
    closeDialog(ui.pause, false);
    state.mode = 'MENU';
    openDialog(ui.start, '#startBtn');
    setStatus('点击“进入选关”或按 Enter 开始。');
  }

  function updateMuteButton() {
    ui.muteBtn.textContent = state.muted ? '×♫' : '♫';
    ui.muteBtn.setAttribute('aria-label', state.muted ? '关闭静音' : '开启静音');
  }
  function audioBeep(frequency = 440, duration = 0.06) {
    if (state.muted) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      state.sound ||= new AudioContextClass();
      const oscillator = state.sound.createOscillator();
      const gain = state.sound.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.045, state.sound.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, state.sound.currentTime + duration);
      oscillator.connect(gain).connect(state.sound.destination); oscillator.start(); oscillator.stop(state.sound.currentTime + duration);
    } catch (_) {}
  }

  function resetBricks() {
    const level = currentLevel();
    const rainbow = new Set(level.rainbowBricks.map(([col, row]) => `${col},${row}`));
    const powerups = new Set(level.powerupBricks.map(([col, row]) => `${col},${row}`));
    const totalWidth = 760; const gap = 7; const brickW = (totalWidth - gap * (GRID_COLS - 1)) / GRID_COLS; const brickH = 22; const left = (W - totalWidth) / 2; const top = 68;
    state.bricks = level.brickLayout.cells.map(([col, row], id) => ({ x: left + col * (brickW + gap), y: top + row * (brickH + gap), w: brickW, h: brickH, col, row, id, alive: true, rainbow: rainbow.has(`${col},${row}`), powerup: powerups.has(`${col},${row}`) }));
  }

  function resetGame() {
    state.mode = 'PLAYING'; state.score = 0; state.lives = 3; state.stage = 0; state.rainbowHits = 0; state.particles = []; state.impactRings = []; state.lifeTimer = 0; state.shake = 0; state.sealFlash = 0; state.bannerTimer = 0; state.bannerText = ''; state.multiBall = false; state.powerupUsed = false; state.powerupDropped = false; state.powerup = null;
    state.paddle.x = W / 2 - state.paddle.w / 2; state.balls = [{ x: W / 2, y: H - 65, r: 9, vx: 230, vy: -310 }]; resetBricks();
    closeDialog(ui.start, false); closeDialog(ui.level, false); closeDialog(ui.pause, false); closeDialog(ui.end, false); ui.life.classList.add('hidden'); ui.life.setAttribute('aria-hidden', 'true');
    updateHud(); setStatus(`第${state.level}关开始，击破三枚虹彩砖。`); canvas.focus({ preventScroll: true }); audioBeep(520, 0.12);
  }
  function startLevel(levelId) { if (levelId < 1 || levelId > 6 || levelId > getUnlockedLevel()) return; state.level = levelId; resetGame(); }

  function updateHud() {
    ui.score.textContent = state.score; ui.lives.textContent = state.lives; ui.ballCount.textContent = state.balls.length; ui.stageText.textContent = `${state.stage}/4`; ui.stageMeter.style.width = `${(state.stage / 4) * 100}%`; ui.powerupStatus.textContent = state.multiBall ? '双球×2' : '标准'; ui.levelBtn.setAttribute('aria-label', `返回关卡选择：第${state.level}关`);
  }
  function setMode(mode) { state.mode = mode; if (mode !== 'PAUSED') closeDialog(ui.pause, false); }
  function togglePause() {
    if (state.mode === 'PLAYING') { setMode('PAUSED'); openDialog(ui.pause, '#resumeBtn'); setStatus('已暂停。按 Space / P 或点击继续。'); }
    else if (state.mode === 'PAUSED') { setMode('PLAYING'); closeDialog(ui.pause, true); setStatus('继续游戏。'); state.last = performance.now(); }
  }

  function spawnParticles(x, y, color, count = 8) { for (let i = 0; i < count; i += 1) { const angle = Math.random() * Math.PI * 2; const speed = 30 + Math.random() * 150; state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 40, life: 0.45 + Math.random() * 0.5, color, size: 1.5 + Math.random() * 2.2 }); } }
  function spawnImpactRing(x, y, color) { state.impactRings.push({ x, y, radius: 5, maxRadius: 28, life: 0.28, color }); }
  function activateMultiBall() {
    if (state.powerupUsed || state.multiBall) return;
    state.powerupUsed = true; state.powerup = null; state.multiBall = true;
    const source = state.balls[0] || { x: W / 2, y: H - 65, r: 9, vx: 230, vy: -310 };
    state.balls = [source, { ...source, vx: source.vx === 0 ? 220 : -source.vx, x: source.x + 6, y: source.y - 3 }];
    updateHud(); state.bannerTimer = 1.2; state.bannerText = 'MULTI_BALL ×2'; setStatus('火力增益：MULTI_BALL，球体已翻倍。'); audioBeep(930, 0.18); spawnParticles(state.paddle.x + state.paddle.w / 2, state.paddle.y, '#ffbb68', 28);
  }
  function loseLife() {
    state.lives -= 1; state.multiBall = false; state.powerup = null; state.balls = []; updateHud(); state.shake = 0.28; audioBeep(150, 0.18);
    if (state.lives <= 0) { state.mode = 'GAME_OVER'; showEnd(false); return; }
    state.mode = 'LIFE_LOST'; state.lifeTimer = 1.1; ui.life.classList.remove('hidden'); ui.life.setAttribute('aria-hidden', 'false'); document.getElementById('lifeMessage').textContent = `还剩 ${state.lives} 点生命，挡板正在复位。`; setStatus('全部球体落底，生命 -1。');
    state.balls = [{ x: W / 2, y: H - 65, r: 9, vx: (Math.random() > 0.5 ? 1 : -1) * 220, vy: -315 }]; updateHud();
  }
  function showEnd(won) {
    if (won && state.level < 6) setUnlockedLevel(state.level + 1);
    buildLevelCards(); openDialog(ui.end, '#restartBtn'); ui.finalScore.textContent = state.score; ui.endEyebrow.textContent = won ? '挑战完成' : '能量耗尽'; ui.endTitle.textContent = won ? '全部解锁' : '挑战结束'; ui.endMessage.textContent = won ? `第${state.level}关全部砖块清空，封印 4/4。` : '全部球体落底，重新调整反弹角度。'; ui.nextLevelBtn.classList.toggle('hidden', !won || state.level >= 6); if (won) ui.nextLevelBtn.textContent = `进入第${state.level + 1}关`; setStatus(won ? '胜利！下一关已解锁。' : '游戏结束。按 R 重玩本关。'); audioBeep(won ? 880 : 120, 0.2);
  }
  function onBrickHit(brick) {
    brick.alive = false; state.score += brick.rainbow ? 150 : brick.powerup ? 100 : 50; const hitColor = brick.rainbow ? '#fff3a6' : brick.powerup ? '#ff8b47' : '#75c6ff'; spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, hitColor, brick.rainbow || brick.powerup ? 18 : 8); spawnImpactRing(brick.x + brick.w / 2, brick.y + brick.h / 2, hitColor); audioBeep(brick.rainbow ? 760 : brick.powerup ? 610 : 420, 0.055);
    if (brick.powerup && !state.powerupDropped && !state.powerupUsed) { state.powerupDropped = true; state.powerup = { x: brick.x + brick.w / 2, y: brick.y + brick.h, w: 20, h: 20, vy: 145 }; setStatus('火力砖击破：接住下落增益物，触发 MULTI_BALL。'); }
    if (brick.rainbow && state.stage < 3) { state.rainbowHits += 1; state.stage = Math.min(3, state.rainbowHits); state.sealFlash = 1; state.bannerTimer = 1.1; state.bannerText = `遮罩消散 ${state.stage}/3`; setStatus(`虹彩砖击破：遮罩消散 ${state.stage}/3。`); spawnParticles(W * 0.72, H * 0.45, '#ffe88e', 24); }
    if (state.bricks.every((item) => !item.alive)) { state.stage = 4; state.sealFlash = 1; state.bannerTimer = 1.35; state.bannerText = '封印完全解除 4/4'; spawnParticles(W * .72, H * .45, '#fff0a0', 42); state.mode = 'WON'; }
    updateHud(); if (state.mode === 'WON') showEnd(true);
  }
  function movePaddle(dt) { const speed = 620; if (state.keys.ArrowLeft || state.keys.a) state.paddle.x -= speed * dt; if (state.keys.ArrowRight || state.keys.d) state.paddle.x += speed * dt; state.paddle.x = Math.max(18, Math.min(W - state.paddle.w - 18, state.paddle.x)); }

  function updatePowerup(dt) {
    if (!state.powerup) return;
    const item = state.powerup; item.y += item.vy * dt;
    const paddle = state.paddle;
    if (item.y + item.h / 2 >= paddle.y && item.y - item.h / 2 <= paddle.y + paddle.h && item.x >= paddle.x && item.x <= paddle.x + paddle.w) { activateMultiBall(); return; }
    if (item.y - item.h / 2 > H) state.powerup = null;
  }
  function updateBall(ball, dt) {
    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    if (ball.x - ball.r < 14) { ball.x = 14 + ball.r; ball.vx = Math.abs(ball.vx); audioBeep(230, 0.025); }
    if (ball.x + ball.r > W - 14) { ball.x = W - 14 - ball.r; ball.vx = -Math.abs(ball.vx); audioBeep(230, 0.025); }
    if (ball.y - ball.r < 16) { ball.y = 16 + ball.r; ball.vy = Math.abs(ball.vy); audioBeep(250, 0.025); }
    const paddle = state.paddle;
    if (ball.vy > 0 && ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h && ball.x >= paddle.x && ball.x <= paddle.x + paddle.w) { const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2); ball.vx = hit * 390; ball.vy = -Math.max(260, Math.abs(ball.vy) * 1.015); ball.y = paddle.y - ball.r - 1; spawnImpactRing(ball.x, paddle.y, state.multiBall ? '#ffbb68' : '#8feaff'); audioBeep(560, 0.045); }
    for (const brick of state.bricks) {
      if (!brick.alive) continue;
      if (ball.x + ball.r > brick.x && ball.x - ball.r < brick.x + brick.w && ball.y + ball.r > brick.y && ball.y - ball.r < brick.y + brick.h) { const previousY = ball.y - ball.vy * dt; if (previousY + ball.r <= brick.y || previousY - ball.r >= brick.y + brick.h) ball.vy *= -1; else ball.vx *= -1; onBrickHit(brick); break; }
    }
    return ball.y - ball.r <= H;
  }
  function update(dt) {
    if (state.mode === 'LIFE_LOST') { state.lifeTimer -= dt; if (state.lifeTimer <= 0) { state.mode = 'PLAYING'; ui.life.classList.add('hidden'); ui.life.setAttribute('aria-hidden', 'true'); setStatus('继续！保持球体在场内。'); } return; }
    if (state.mode !== 'PLAYING') return;
    if (state.sealFlash > 0) state.sealFlash = Math.max(0, state.sealFlash - dt * 1.5); if (state.bannerTimer > 0) state.bannerTimer = Math.max(0, state.bannerTimer - dt);
    movePaddle(dt); updatePowerup(dt);
    for (let i = state.balls.length - 1; i >= 0; i -= 1) { if (!updateBall(state.balls[i], dt)) { state.balls.splice(i, 1); if (state.balls.length > 0) setStatus(`一枚球落底，剩余 ${state.balls.length} 枚。`); } }
    if (state.balls.length === 0 && state.mode === 'PLAYING') loseLife();
    updateHud();
    for (let i = state.particles.length - 1; i >= 0; i -= 1) { const p = state.particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt; p.vx *= 0.985; p.life -= dt; if (p.life <= 0) state.particles.splice(i, 1); }
    for (let i = state.impactRings.length - 1; i >= 0; i -= 1) { const ring = state.impactRings[i]; ring.life -= dt; ring.radius += (ring.maxRadius - ring.radius) * Math.min(1, dt * 12); if (ring.life <= 0) state.impactRings.splice(i, 1); }
    if (state.shake > 0) state.shake -= dt;
  }

  function drawMosaic(image, zone) {
    const blockSize = 15; const sampleW = Math.max(2, Math.ceil(zone.w / blockSize)); const sampleH = Math.max(2, Math.ceil(zone.h / blockSize)); mosaicCanvas.width = sampleW; mosaicCanvas.height = sampleH; mosaicCtx.imageSmoothingEnabled = false; mosaicCtx.clearRect(0, 0, sampleW, sampleH); mosaicCtx.drawImage(image, zone.x / W * image.naturalWidth, zone.y / H * image.naturalHeight, zone.w / W * image.naturalWidth, zone.h / H * image.naturalHeight, 0, 0, sampleW, sampleH);
    ctx.save(); ctx.beginPath(); ctx.roundRect(zone.x, zone.y, zone.w, zone.h, 12); ctx.clip(); ctx.imageSmoothingEnabled = false; ctx.drawImage(mosaicCanvas, 0, 0, sampleW, sampleH, zone.x, zone.y, zone.w, zone.h); ctx.restore(); ctx.strokeStyle = '#d9d2ff88'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(zone.x, zone.y, zone.w, zone.h, 12); ctx.stroke();
  }
  function drawBackground() {
    const level = currentLevel(); const image = levelImages[state.level - 1];
    if (image.complete && image.naturalWidth > 0) { ctx.imageSmoothingEnabled = true; ctx.drawImage(image, 0, 0, W, H); for (let i = state.stage; i < level.mosaicModules.length; i += 1) drawMosaic(image, level.mosaicModules[i]); for (const mask of level.permanentMasks) drawMosaic(image, mask); }
    else { const fallback = ctx.createLinearGradient(0, 0, 0, H); fallback.addColorStop(0, '#171a36'); fallback.addColorStop(1, '#071827'); ctx.fillStyle = fallback; ctx.fillRect(0, 0, W, H); }
    const shade = ctx.createLinearGradient(0, 0, W, 0); shade.addColorStop(0, 'rgba(3,6,22,.9)'); shade.addColorStop(0.6, 'rgba(5,10,27,.6)'); shade.addColorStop(1, 'rgba(4,8,20,.16)'); ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);
  }
  function drawBrick(brick) {
    const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x + brick.w, brick.y + brick.h);
    if (brick.rainbow) { gradient.addColorStop(0, '#ff65bd'); gradient.addColorStop(.25, '#ffd66b'); gradient.addColorStop(.5, '#72f2c7'); gradient.addColorStop(.75, '#68c9ff'); gradient.addColorStop(1, '#a27cff'); }
    else if (brick.powerup) { gradient.addColorStop(0, '#ffbc62'); gradient.addColorStop(1, '#c63e3d'); }
    else { gradient.addColorStop(0, '#77b8e9'); gradient.addColorStop(1, '#294f7a'); }
    ctx.save();
    ctx.shadowColor = '#050717aa';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 6);
    ctx.fill();
    ctx.restore();

    const sheen = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.h);
    sheen.addColorStop(0, '#ffffff42');
    sheen.addColorStop(.32, '#ffffff0c');
    sheen.addColorStop(1, '#07132942');
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(brick.x + 1, brick.y + 1, brick.w - 2, brick.h - 2, 5);
    ctx.clip();
    ctx.fillStyle = sheen;
    ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
    ctx.restore();

    ctx.strokeStyle = brick.rainbow ? '#fff3ae' : brick.powerup ? '#ffd29a' : '#bde4ff66';
    ctx.lineWidth = brick.rainbow || brick.powerup ? 1.8 : 1;
    ctx.beginPath();
    ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 6);
    ctx.stroke();
    ctx.strokeStyle = brick.rainbow ? '#fffbe8d9' : brick.powerup ? '#fff0c080' : '#e7f8ff80';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(brick.x + 5, brick.y + 2);
    ctx.lineTo(brick.x + brick.w - 5, brick.y + 2);
    ctx.stroke();
    ctx.strokeStyle = '#08112588';
    ctx.beginPath();
    ctx.moveTo(brick.x + 5, brick.y + brick.h - 2);
    ctx.lineTo(brick.x + brick.w - 5, brick.y + brick.h - 2);
    ctx.stroke();
    if (brick.rainbow || brick.powerup) { ctx.fillStyle = '#fffbe0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 14px sans-serif'; ctx.fillText(brick.rainbow ? '✦' : 'ϟ', brick.x + brick.w / 2, brick.y + brick.h / 2 + 1); }
  }
  function drawPowerup() { if (!state.powerup) return; const p = state.powerup; ctx.fillStyle = '#351a18'; ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff8a4b'; ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff1b0'; ctx.font = '700 16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ϟ', p.x, p.y + 1); }
  function drawBall(ball, index) {
    ctx.save();
    ctx.strokeStyle = '#fff8cf99';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ball.x - ball.vx * 0.035, ball.y - ball.vy * 0.035);
    ctx.lineTo(ball.x, ball.y);
    ctx.stroke();

    ctx.fillStyle = '#07152b';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 0;
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#ffe9a1';
    const body = ctx.createRadialGradient(ball.x - ball.r * 0.34, ball.y - ball.r * 0.4, 1, ball.x, ball.y, ball.r);
    body.addColorStop(0, '#fff9d8');
    body.addColorStop(0.38, '#fff0b0');
    body.addColorStop(0.78, '#e6b36e');
    body.addColorStop(1, '#a66b63');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff9d866';
    ctx.beginPath();
    ctx.arc(ball.x - ball.r * 0.32, ball.y - ball.r * 0.36, Math.max(1.2, ball.r * 0.16), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function drawBanner() { if (state.bannerTimer <= 0) return; const alpha = Math.min(1, state.bannerTimer * 3, (1.2 - state.bannerTimer) * 5); ctx.save(); ctx.globalAlpha = alpha; const width = 224; const height = 38; const x = (W - width) / 2; const y = H * .72; ctx.fillStyle = '#111631de'; ctx.beginPath(); ctx.roundRect(x, y, width, height, 12); ctx.fill(); ctx.strokeStyle = '#ffe99c'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#fff8d1'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 17px "Microsoft YaHei", sans-serif'; ctx.fillText(state.bannerText, W / 2, y + height / 2); ctx.restore(); }
  function draw() {
    ctx.save(); if (state.shake > 0) ctx.translate((Math.random() - .5) * state.shake * 18, (Math.random() - .5) * state.shake * 18); drawBackground(); ctx.strokeStyle = '#9bbdff66'; ctx.lineWidth = 2; ctx.strokeRect(14, 16, W - 28, H - 32); for (const brick of state.bricks) if (brick.alive) drawBrick(brick); drawPowerup();
    const paddle = state.paddle; ctx.fillStyle = '#061329'; ctx.beginPath(); ctx.roundRect(paddle.x - 4, paddle.y - 4, paddle.w + 8, paddle.h + 8, 11); ctx.fill(); ctx.strokeStyle = '#e9fbff'; ctx.lineWidth = 2; ctx.stroke(); const pg = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.w, paddle.y); pg.addColorStop(0, '#6be6ff'); pg.addColorStop(.5, '#fff0a6'); pg.addColorStop(1, '#ff83bd'); ctx.fillStyle = pg; ctx.beginPath(); ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 8); ctx.fill(); ctx.fillStyle = '#ffffff88'; ctx.fillRect(paddle.x + 12, paddle.y + 4, paddle.w - 24, 2);
    for (let i = 0; i < state.balls.length; i += 1) drawBall(state.balls[i], i);
    for (const ring of state.impactRings) { ctx.globalAlpha = Math.max(0, ring.life / 0.28); ctx.strokeStyle = ring.color; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = ring.color; ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }
    for (const p of state.particles) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; drawBanner(); ctx.restore();
  }
  function loop(timestamp) { const dt = Math.min(.033, (timestamp - state.last) / 1000 || 0); state.last = timestamp; update(dt); draw(); requestAnimationFrame(loop); }
  function pointerMove(event) { if (state.mode !== 'PLAYING') return; const rect = canvas.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width * W; state.paddle.x = Math.max(18, Math.min(W - state.paddle.w - 18, x - state.paddle.w / 2)); }

  window.addEventListener('keydown', (event) => {
    const key = event.key;
    if (['ArrowLeft', 'ArrowRight', ' ', 'a', 'd', 'A', 'D', 'b', 'B', 'p', 'P', 'Escape', 'r', 'R', 'Enter'].includes(key)) event.preventDefault();
    if (key === 'Enter' && state.mode === 'MENU') showLevelSelect();
    else if (key === 'Enter' && state.mode === 'LEVEL_SELECT') document.activeElement?.click?.();
    else if (key === 'Escape' && state.mode === 'LEVEL_SELECT') showStart();
    else if (key === 'Escape') togglePause();
    else if (key === ' ') { if (state.mode === 'MENU') showLevelSelect(); else togglePause(); }
    else if (['p', 'P'].includes(key)) togglePause();
    else if (['r', 'R'].includes(key) && state.mode !== 'MENU' && state.mode !== 'LEVEL_SELECT') resetGame();
    else if (['b', 'B'].includes(key) && state.mode !== 'MENU' && state.mode !== 'LEVEL_SELECT') showLevelSelect();
    else if (key.length === 1) state.keys[key.toLowerCase()] = true;
    else state.keys[key] = true;
  });
  window.addEventListener('keyup', (event) => { state.keys[event.key.length === 1 ? event.key.toLowerCase() : event.key] = false; });
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerdown', (event) => { if (state.mode === 'PLAYING') { canvas.setPointerCapture?.(event.pointerId); pointerMove(event); } });
  canvas.addEventListener('pointerup', (event) => canvas.releasePointerCapture?.(event.pointerId));

  document.getElementById('startBtn').addEventListener('click', () => { state.muted = !document.getElementById('startSound').checked; updateMuteButton(); showLevelSelect(); });
  document.getElementById('backToStartBtn').addEventListener('click', showStart);
  document.getElementById('resumeBtn').addEventListener('click', togglePause);
  document.getElementById('restartPauseBtn').addEventListener('click', resetGame);
  document.getElementById('restartBtn').addEventListener('click', resetGame);
  document.getElementById('nextLevelBtn').addEventListener('click', () => startLevel(state.level + 1));
  document.getElementById('levelFromEndBtn').addEventListener('click', showLevelSelect);
  ui.levelBtn.addEventListener('click', showLevelSelect);
  ui.pauseBtn.addEventListener('click', togglePause);
  ui.muteBtn.addEventListener('click', () => { state.muted = !state.muted; updateMuteButton(); setStatus(state.muted ? '音效已静音。' : '音效已开启。'); });

  resizeCanvas(); window.addEventListener('resize', resizeCanvas); requestAnimationFrame(() => document.getElementById('startBtn').focus({ preventScroll: true }));
  const params = new URLSearchParams(location.search); const sceneCompat = Number(params.get('scene')); const requestedLevel = Number(params.get('level')) || (sceneCompat >= 1 && sceneCompat <= 6 ? sceneCompat : 1); state.level = Math.max(1, Math.min(6, requestedLevel));
  if (params.has('autoplay')) resetGame();
  else if (params.has('select')) showLevelSelect();
  if (params.has('stage')) { state.stage = Math.max(0, Math.min(4, Number(params.get('stage')) || 0)); state.rainbowHits = Math.min(3, state.stage); }
  buildLevelCards(); updateMuteButton(); updateHud(); draw(); requestAnimationFrame(loop);
})();
