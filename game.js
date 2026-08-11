(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = 960;
  const H = 540;

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

  const ui = {
    score: document.getElementById('score'),
    lives: document.getElementById('lives'),
    stageText: document.getElementById('stageText'),
    stageMeter: document.getElementById('stageMeter'),
    status: document.getElementById('status'),
    sceneBtn: document.getElementById('sceneBtn'),
    muteBtn: document.getElementById('muteBtn'),
    start: document.getElementById('startOverlay'),
    pause: document.getElementById('pauseOverlay'),
    end: document.getElementById('endOverlay'),
    life: document.getElementById('lifeOverlay'),
    endEyebrow: document.getElementById('endEyebrow'),
    endTitle: document.getElementById('endTitle'),
    endMessage: document.getElementById('endMessage'),
    finalScore: document.getElementById('finalScore')
  };

  let focusBeforeDialog = null;
  function openDialog(element, focusSelector) {
    focusBeforeDialog = document.activeElement;
    element.classList.remove('hidden');
    element.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => element.querySelector(focusSelector)?.focus({ preventScroll: true }));
  }

  function closeDialog(element, restore = true) {
    element.classList.add('hidden');
    element.setAttribute('aria-hidden', 'true');
    if (restore && focusBeforeDialog?.isConnected && typeof focusBeforeDialog.focus === 'function') {
      focusBeforeDialog.focus({ preventScroll: true });
    }
    if (restore) focusBeforeDialog = null;
  }

  const BACKGROUNDS = [
    {
      src: 'assets/scene-gala-2022.jpg',
      name: '鎏金舞会',
      zones: [
        { x: 32, y: 180, w: 235, h: 168 },
        { x: 215, y: 358, w: 240, h: 135 },
        { x: 750, y: 345, w: 180, h: 145 }
      ]
    },
    {
      src: 'assets/scene-moonlit-2025.jpg',
      name: '月夜花园',
      zones: [
        { x: 220, y: 195, w: 205, h: 150 },
        { x: 515, y: 190, w: 180, h: 165 },
        { x: 570, y: 372, w: 220, h: 113 }
      ]
    }
  ];

  const sceneImages = BACKGROUNDS.map((scene) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = scene.src;
    image.addEventListener('load', draw);
    return image;
  });

  const mosaicCanvas = document.createElement('canvas');
  const mosaicCtx = mosaicCanvas.getContext('2d');
  const state = {
    mode: 'MENU',
    score: 0,
    lives: 3,
    stage: 0,
    rainbowHits: 0,
    sceneIndex: 0,
    muted: false,
    last: 0,
    lifeTimer: 0,
    shake: 0,
    sealFlash: 0,
    bannerTimer: 0,
    bannerText: '',
    particles: [],
    keys: {},
    bricks: [],
    paddle: { x: W / 2 - 64, y: H - 42, w: 128, h: 14 },
    ball: { x: W / 2, y: H - 65, r: 9, vx: 230, vy: -310 },
    sound: null
  };

  function setStatus(message) {
    ui.status.textContent = message;
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
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.045, state.sound.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, state.sound.currentTime + duration);
      oscillator.connect(gain).connect(state.sound.destination);
      oscillator.start();
      oscillator.stop(state.sound.currentTime + duration);
    } catch (_) {}
  }

  function resetBricks() {
    state.bricks = [];
    const cols = 8;
    const rows = 6;
    const gap = 7;
    const totalWidth = 590;
    const brickW = (totalWidth - gap * (cols - 1)) / cols;
    const brickH = 22;
    const left = 44;
    const top = 68;
    const rainbowPositions = new Set(['1,1', '2,5', '4,3']);
    let id = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        state.bricks.push({
          x: left + col * (brickW + gap),
          y: top + row * (brickH + gap),
          w: brickW,
          h: brickH,
          alive: true,
          rainbow: rainbowPositions.has(`${row},${col}`),
          id: id++
        });
      }
    }
  }

  function resetGame() {
    state.mode = 'PLAYING';
    state.score = 0;
    state.lives = 3;
    state.stage = 0;
    state.rainbowHits = 0;
    state.particles = [];
    state.lifeTimer = 0;
    state.shake = 0;
    state.sealFlash = 0;
    state.bannerTimer = 0;
    state.bannerText = '';
    state.paddle.x = W / 2 - state.paddle.w / 2;
    state.ball = { x: W / 2, y: H - 65, r: 9, vx: 230, vy: -310 };
    resetBricks();
    closeDialog(ui.start, false);
    closeDialog(ui.pause, false);
    closeDialog(ui.end, false);
    ui.life.classList.add('hidden');
    ui.life.setAttribute('aria-hidden', 'true');
    updateHud();
    setStatus('能量球已出发，击破全部砖块。');
    canvas.focus({ preventScroll: true });
    audioBeep(520, 0.12);
  }

  function updateHud() {
    const stageNames = ['封印完整', '第一重解锁', '第二重解锁', '全部解锁'];
    ui.score.textContent = state.score;
    ui.lives.textContent = state.lives;
    ui.stageText.textContent = stageNames[state.stage];
    ui.stageMeter.style.width = `${(state.stage / 3) * 100}%`;
  }

  function updateSceneButton() {
    const scene = BACKGROUNDS[state.sceneIndex];
    ui.sceneBtn.textContent = `▣ ${state.sceneIndex + 1}/${BACKGROUNDS.length}`;
    ui.sceneBtn.setAttribute('aria-label', `切换背景：当前为${scene.name}`);
  }

  function cycleScene() {
    state.sceneIndex = (state.sceneIndex + 1) % BACKGROUNDS.length;
    updateSceneButton();
    setStatus(`背景已切换：${BACKGROUNDS[state.sceneIndex].name}。封印阶段保持不变。`);
    draw();
  }

  function setMode(mode) {
    state.mode = mode;
    if (mode !== 'PAUSED') closeDialog(ui.pause, false);
  }

  function togglePause() {
    if (state.mode === 'PLAYING') {
      setMode('PAUSED');
      openDialog(ui.pause, '#resumeBtn');
      setStatus('已暂停。按 Space / P 或点击继续。');
    } else if (state.mode === 'PAUSED') {
      setMode('PLAYING');
      closeDialog(ui.pause, true);
      setStatus('继续游戏。');
      state.last = performance.now();
    }
  }

  function launch() {
    if (state.mode === 'MENU') resetGame();
    else if (state.mode === 'PAUSED') togglePause();
  }

  function spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 150;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        life: 0.45 + Math.random() * 0.5,
        color
      });
    }
  }

  function loseLife() {
    state.lives -= 1;
    updateHud();
    state.shake = 0.28;
    audioBeep(150, 0.18);
    if (state.lives <= 0) {
      state.mode = 'GAME_OVER';
      showEnd(false);
      return;
    }
    state.mode = 'LIFE_LOST';
    state.lifeTimer = 1.1;
    ui.life.classList.remove('hidden');
    ui.life.setAttribute('aria-hidden', 'false');
    document.getElementById('lifeMessage').textContent = `还剩 ${state.lives} 点生命，稳住节奏。`;
    setStatus('球体失活，挡板正在重置。');
    state.ball = { x: W / 2, y: H - 65, r: 9, vx: (Math.random() > 0.5 ? 1 : -1) * 220, vy: -315 };
  }

  function showEnd(won) {
    openDialog(ui.end, '#restartBtn');
    ui.finalScore.textContent = state.score;
    ui.endEyebrow.textContent = won ? '挑战完成' : '能量耗尽';
    ui.endTitle.textContent = won ? '清场成功' : '挑战结束';
    ui.endMessage.textContent = won ? '全部砖块已清除，三重画面封印全部解除。' : '生命归零，重新调整反弹角度。';
    setStatus(won ? '胜利！所有砖块都已击落。' : '游戏结束。按 R 或点击再次挑战。');
    audioBeep(won ? 880 : 120, 0.2);
  }

  function onBrickHit(brick) {
    brick.alive = false;
    state.score += brick.rainbow ? 150 : 50;
    spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.rainbow ? '#fff3a6' : '#75c6ff', brick.rainbow ? 18 : 8);
    audioBeep(brick.rainbow ? 760 : 420, 0.055);
    if (brick.rainbow && state.stage < 3) {
      state.rainbowHits += 1;
      state.stage = Math.min(3, state.rainbowHits);
      state.sealFlash = 1;
      state.bannerTimer = 1.25;
      state.bannerText = `遮罩消散 ${state.stage}/3`;
      spawnParticles(W * 0.72, H * 0.45, '#ffe88e', 28);
      setStatus(`虹彩砖击破：遮罩消散 ${state.stage}/3。`);
    }
    updateHud();
    if (state.bricks.every((item) => !item.alive)) {
      state.mode = 'WON';
      showEnd(true);
    }
  }

  function movePaddle(dt) {
    const speed = 620;
    if (state.keys.ArrowLeft || state.keys.a) state.paddle.x -= speed * dt;
    if (state.keys.ArrowRight || state.keys.d) state.paddle.x += speed * dt;
    state.paddle.x = Math.max(18, Math.min(W - state.paddle.w - 18, state.paddle.x));
  }

  function update(dt) {
    if (state.sealFlash > 0) state.sealFlash = Math.max(0, state.sealFlash - dt * 1.5);
    if (state.bannerTimer > 0) state.bannerTimer = Math.max(0, state.bannerTimer - dt);
    if (state.mode === 'LIFE_LOST') {
      state.lifeTimer -= dt;
      if (state.lifeTimer <= 0) {
        state.mode = 'PLAYING';
        ui.life.classList.add('hidden');
        ui.life.setAttribute('aria-hidden', 'true');
        setStatus('继续！保持球体在场内。');
      }
      return;
    }
    if (state.mode !== 'PLAYING') return;
    movePaddle(dt);
    const ball = state.ball;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    if (ball.x - ball.r < 14) {
      ball.x = 14 + ball.r;
      ball.vx = Math.abs(ball.vx);
      audioBeep(230, 0.025);
    }
    if (ball.x + ball.r > W - 14) {
      ball.x = W - 14 - ball.r;
      ball.vx = -Math.abs(ball.vx);
      audioBeep(230, 0.025);
    }
    if (ball.y - ball.r < 16) {
      ball.y = 16 + ball.r;
      ball.vy = Math.abs(ball.vy);
      audioBeep(250, 0.025);
    }
    const paddle = state.paddle;
    if (ball.vy > 0 && ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h && ball.x >= paddle.x && ball.x <= paddle.x + paddle.w) {
      const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
      ball.vx = hit * 390;
      ball.vy = -Math.max(260, Math.abs(ball.vy) * 1.015);
      ball.y = paddle.y - ball.r - 1;
      audioBeep(560, 0.045);
    }
    for (const brick of state.bricks) {
      if (!brick.alive) continue;
      if (ball.x + ball.r > brick.x && ball.x - ball.r < brick.x + brick.w && ball.y + ball.r > brick.y && ball.y - ball.r < brick.y + brick.h) {
        const previousY = ball.y - ball.vy * dt;
        if (previousY + ball.r <= brick.y || previousY - ball.r >= brick.y + brick.h) ball.vy *= -1;
        else ball.vx *= -1;
        onBrickHit(brick);
        break;
      }
    }
    if (ball.y - ball.r > H) loseLife();
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const particle = state.particles[i];
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 200 * dt;
      particle.life -= dt;
      if (particle.life <= 0) state.particles.splice(i, 1);
    }
    if (state.shake > 0) state.shake -= dt;
  }

  function drawMosaic(image, zone) {
    const blockSize = 15;
    const sampleW = Math.max(2, Math.ceil(zone.w / blockSize));
    const sampleH = Math.max(2, Math.ceil(zone.h / blockSize));
    mosaicCanvas.width = sampleW;
    mosaicCanvas.height = sampleH;
    const sx = zone.x / W * image.naturalWidth;
    const sy = zone.y / H * image.naturalHeight;
    const sw = zone.w / W * image.naturalWidth;
    const sh = zone.h / H * image.naturalHeight;
    mosaicCtx.imageSmoothingEnabled = false;
    mosaicCtx.clearRect(0, 0, sampleW, sampleH);
    mosaicCtx.drawImage(image, sx, sy, sw, sh, 0, 0, sampleW, sampleH);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(zone.x, zone.y, zone.w, zone.h, 12);
    ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(mosaicCanvas, 0, 0, sampleW, sampleH, zone.x, zone.y, zone.w, zone.h);
    ctx.restore();
    ctx.strokeStyle = '#d9d2ff88';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(zone.x, zone.y, zone.w, zone.h, 12);
    ctx.stroke();
  }

  function drawBackground() {
    const scene = BACKGROUNDS[state.sceneIndex];
    const image = sceneImages[state.sceneIndex];
    if (image.complete && image.naturalWidth > 0) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(image, 0, 0, W, H);
      for (let index = state.stage; index < scene.zones.length; index += 1) drawMosaic(image, scene.zones[index]);
    } else {
      const fallback = ctx.createLinearGradient(0, 0, 0, H);
      fallback.addColorStop(0, '#171a36');
      fallback.addColorStop(1, '#071827');
      ctx.fillStyle = fallback;
      ctx.fillRect(0, 0, W, H);
    }
    const shade = ctx.createLinearGradient(0, 0, W, 0);
    shade.addColorStop(0, 'rgba(3,6,22,.9)');
    shade.addColorStop(0.58, 'rgba(5,10,27,.6)');
    shade.addColorStop(1, 'rgba(4,8,20,.14)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.68);
    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(1, 'rgba(1,3,14,.38)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
    if (state.sealFlash > 0) {
      ctx.fillStyle = `rgba(255,242,170,${state.sealFlash * 0.14})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawBrick(brick) {
    const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x + brick.w, brick.y + brick.h);
    if (brick.rainbow) {
      gradient.addColorStop(0, '#ff65bd');
      gradient.addColorStop(0.25, '#ffd66b');
      gradient.addColorStop(0.5, '#72f2c7');
      gradient.addColorStop(0.75, '#68c9ff');
      gradient.addColorStop(1, '#a27cff');
    } else {
      gradient.addColorStop(0, '#77b8e9');
      gradient.addColorStop(1, '#294f7a');
    }
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 6);
    ctx.fill();
    ctx.strokeStyle = brick.rainbow ? '#fff3ae' : '#bde4ff66';
    ctx.lineWidth = brick.rainbow ? 1.8 : 1;
    ctx.stroke();
    if (brick.rainbow) {
      ctx.fillStyle = '#fffbe0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 14px sans-serif';
      ctx.fillText('✦', brick.x + brick.w / 2, brick.y + brick.h / 2 + 1);
    }
  }

  function drawBanner() {
    if (state.bannerTimer <= 0) return;
    const alpha = Math.min(1, state.bannerTimer * 3, (1.25 - state.bannerTimer) * 5);
    ctx.save();
    ctx.globalAlpha = alpha;
    const width = 224;
    const height = 38;
    const x = (W - width) / 2;
    const y = H * 0.72;
    ctx.fillStyle = '#111631de';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 12);
    ctx.fill();
    ctx.strokeStyle = '#ffe99c';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#fff8d1';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 17px "Microsoft YaHei", sans-serif';
    ctx.fillText(state.bannerText, W / 2, y + height / 2);
    ctx.restore();
  }

  function draw() {
    ctx.save();
    if (state.shake > 0) ctx.translate((Math.random() - 0.5) * state.shake * 18, (Math.random() - 0.5) * state.shake * 18);
    drawBackground();
    ctx.strokeStyle = '#9bbdff66';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 16, W - 28, H - 32);
    for (const brick of state.bricks) if (brick.alive) drawBrick(brick);
    const paddle = state.paddle;
    ctx.fillStyle = '#061329';
    ctx.beginPath();
    ctx.roundRect(paddle.x - 4, paddle.y - 4, paddle.w + 8, paddle.h + 8, 11);
    ctx.fill();
    ctx.strokeStyle = '#e9fbff';
    ctx.lineWidth = 2;
    ctx.stroke();
    const paddleGradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.w, paddle.y);
    paddleGradient.addColorStop(0, '#6be6ff');
    paddleGradient.addColorStop(0.5, '#fff0a6');
    paddleGradient.addColorStop(1, '#ff83bd');
    ctx.fillStyle = paddleGradient;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff88';
    ctx.fillRect(paddle.x + 12, paddle.y + 4, paddle.w - 24, 2);
    const ball = state.ball;
    ctx.strokeStyle = '#fff8cf99';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ball.x - ball.vx * 0.035, ball.y - ball.vy * 0.035);
    ctx.lineTo(ball.x, ball.y);
    ctx.stroke();
    ctx.fillStyle = '#061329';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#dffcff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#ffe9a1';
    ctx.fillStyle = '#fff2ac';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    for (const particle of state.particles) {
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawBanner();
    ctx.restore();
  }

  function loop(timestamp) {
    const dt = Math.min(0.033, (timestamp - state.last) / 1000 || 0);
    state.last = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function pointerMove(event) {
    if (state.mode !== 'PLAYING') return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * W;
    state.paddle.x = Math.max(18, Math.min(W - state.paddle.w - 18, x - state.paddle.w / 2));
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key;
    if (['ArrowLeft', 'ArrowRight', ' ', 'a', 'd', 'A', 'D', 'b', 'B', 'p', 'P', 'Escape', 'r', 'R', 'Enter'].includes(key)) event.preventDefault();
    if (key === 'Enter' && state.mode === 'MENU') launch();
    else if (key === ' ') {
      if (state.mode === 'MENU') launch();
      else togglePause();
    } else if (['p', 'P', 'Escape'].includes(key)) togglePause();
    else if (['r', 'R'].includes(key)) resetGame();
    else if (['b', 'B'].includes(key)) cycleScene();
    else state.keys[key.length === 1 ? key.toLowerCase() : key] = true;
  });
  window.addEventListener('keyup', (event) => { state.keys[event.key.length === 1 ? event.key.toLowerCase() : event.key] = false; });
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerdown', (event) => {
    if (state.mode === 'PLAYING') {
      canvas.setPointerCapture?.(event.pointerId);
      pointerMove(event);
    }
  });
  canvas.addEventListener('pointerup', (event) => canvas.releasePointerCapture?.(event.pointerId));

  document.getElementById('startBtn').addEventListener('click', () => {
    state.muted = !document.getElementById('startSound').checked;
    updateMuteButton();
    resetGame();
  });
  document.getElementById('resumeBtn').addEventListener('click', togglePause);
  document.getElementById('restartPauseBtn').addEventListener('click', resetGame);
  document.getElementById('restartBtn').addEventListener('click', resetGame);
  document.getElementById('pauseBtn').addEventListener('click', togglePause);
  ui.sceneBtn.addEventListener('click', cycleScene);
  ui.muteBtn.addEventListener('click', () => {
    state.muted = !state.muted;
    updateMuteButton();
    setStatus(state.muted ? '音效已静音。' : '音效已开启。');
  });

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  requestAnimationFrame(() => document.getElementById('startBtn').focus({ preventScroll: true }));
  const previewParams = new URLSearchParams(location.search);
  if (previewParams.has('scene')) {
    const sceneNumber = Number(previewParams.get('scene'));
    state.sceneIndex = Math.max(0, Math.min(BACKGROUNDS.length - 1, sceneNumber >= 1 ? sceneNumber - 1 : 0));
  }
  if (previewParams.has('autoplay')) resetGame();
  if (previewParams.has('stage')) {
    state.stage = Math.max(0, Math.min(3, Number(previewParams.get('stage')) || 0));
    state.rainbowHits = state.stage;
  }
  updateSceneButton();
  updateMuteButton();
  updateHud();
  draw();
  requestAnimationFrame(loop);
})();
