const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');
const restartBtn = document.getElementById('restart');

const W = canvas.width, H = canvas.height, TILE = 40;
const keys = new Set();
let score = 0, won = false, puddles = [], crystals = [], trees = [], particles = [];
const player = { x: 80, y: 80, size: 24, speed: 3.1, face: 1 };

function rand(min, max) { return Math.random() * (max - min) + min; }
function overlaps(a, b, pad = 0) {
  return a.x < b.x + b.size - pad && a.x + a.size > b.x + pad &&
         a.y < b.y + b.size - pad && a.y + a.size > b.y + pad;
}
function resetGame() {
  score = 0; won = false;
  player.x = 80; player.y = 80;
  puddles = []; crystals = []; trees = []; particles = [];
  for (let i = 0; i < 7; i++) {
    puddles.push({ x: rand(110, W - 80), y: rand(80, H - 70), size: rand(25, 42) });
  }
  for (let i = 0; i < 10; i++) {
    crystals.push({ x: rand(55, W - 55), y: rand(55, H - 55), size: 18, phase: rand(0, 6.28), taken: false });
  }
  for (let i = 0; i < 24; i++) {
    trees.push({ x: rand(15, W - 35), y: rand(20, H - 40), size: rand(18, 28) });
  }
  scoreEl.textContent = score;
  statusEl.textContent = '¡Listo para explorar!';
}
function drawBackground() {
  ctx.fillStyle = '#214b4b'; ctx.fillRect(0, 0, W, H);
  // Pixelated grass tiles
  for (let y = 0; y < H; y += TILE) {
    for (let x = 0; x < W; x += TILE) {
      ctx.fillStyle = ((x / TILE + y / TILE) % 2 === 0) ? '#285650' : '#2b5b52';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = 'rgba(176,232,153,.08)';
      ctx.fillRect(x + 5, y + 8, 4, 4);
      ctx.fillRect(x + 27, y + 24, 3, 3);
    }
  }
  // Winding sandy path
  ctx.fillStyle = '#6d7251';
  ctx.fillRect(0, 205, W, 55);
  ctx.fillRect(290, 0, 58, H);
  ctx.fillStyle = '#7c805b';
  for (let i = 0; i < 30; i++) {
    ctx.fillRect((i * 83) % W, 215 + (i % 3) * 13, 8, 5);
  }
}
function drawTree(t) {
  ctx.fillStyle = '#182f38';
  ctx.fillRect(t.x + t.size * .32, t.y + t.size * .48, t.size * .36, t.size * .55);
  ctx.fillStyle = '#173d3c';
  ctx.fillRect(t.x, t.y + t.size * .18, t.size, t.size * .65);
  ctx.fillStyle = '#36745a';
  ctx.fillRect(t.x + 3, t.y, t.size - 6, t.size * .55);
  ctx.fillStyle = '#62a66c';
  ctx.fillRect(t.x + 6, t.y + 4, 5, 5);
}
function drawPuddle(p) {
  ctx.fillStyle = '#182b42';
  ctx.fillRect(p.x, p.y, p.size, p.size * .62);
  ctx.fillStyle = '#294f69';
  ctx.fillRect(p.x + 5, p.y + 4, p.size * .55, 5);
  ctx.fillStyle = 'rgba(8,14,31,.25)';
  ctx.fillRect(p.x + 3, p.y + p.size * .62, p.size - 4, 5);
}
function drawCrystal(c, time) {
  if (c.taken) return;
  const bob = Math.sin(time / 240 + c.phase) * 3;
  const x = c.x, y = c.y + bob;
  ctx.save();
  ctx.shadowColor = '#7df7ff'; ctx.shadowBlur = 17;
  ctx.fillStyle = '#7df7ff';
  ctx.beginPath();
  ctx.moveTo(x, y - 13); ctx.lineTo(x + 10, y); ctx.lineTo(x, y + 13); ctx.lineTo(x - 10, y); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e9ffff';
  ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 3, y); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawPlayer() {
  const x = Math.round(player.x), y = Math.round(player.y);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x + 2, y + 21, 23, 7);
  // little pixel adventurer
  ctx.fillStyle = '#382c61'; ctx.fillRect(x + 3, y + 12, 20, 13);
  ctx.fillStyle = '#f1bd8d'; ctx.fillRect(x + 5, y + 2, 16, 14);
  ctx.fillStyle = '#5d3c32'; ctx.fillRect(x + 4, y, 18, 6);
  ctx.fillStyle = '#31294b'; ctx.fillRect(x + 3, y + 22, 7, 7); ctx.fillRect(x + 16, y + 22, 7, 7);
  ctx.fillStyle = '#17223b';
  const eyeX = player.face > 0 ? x + 16 : x + 7;
  ctx.fillRect(eyeX, y + 8, 3, 3);
  ctx.fillStyle = '#72f1c8'; ctx.fillRect(x + 6, y + 15, 14, 4);
}
function addSparkles(x, y) {
  for (let i = 0; i < 10; i++) particles.push({ x, y, vx: rand(-2, 2), vy: rand(-2.5, .5), life: 30, max: 30, size: rand(2, 5) });
}
function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = '#ffe77b';
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
  ctx.globalAlpha = 1;
}
function update() {
  if (won) return;
  let dx = 0, dy = 0;
  if (keys.has('ArrowLeft') || keys.has('a')) dx--;
  if (keys.has('ArrowRight') || keys.has('d')) dx++;
  if (keys.has('ArrowUp') || keys.has('w')) dy--;
  if (keys.has('ArrowDown') || keys.has('s')) dy++;
  if (dx && dy) { dx *= .707; dy *= .707; }
  player.x = Math.max(0, Math.min(W - player.size, player.x + dx * player.speed));
  player.y = Math.max(0, Math.min(H - player.size, player.y + dy * player.speed));
  if (dx) player.face = dx > 0 ? 1 : -1;

  // Dark puddles slow you down a little
  const inPuddle = puddles.some(p => player.x < p.x + p.size && player.x + player.size > p.x && player.y < p.y + p.size * .62 && player.y + player.size > p.y);
  if (inPuddle && (dx || dy)) {
    player.x -= dx * player.speed * .25;
    player.y -= dy * player.speed * .25;
    statusEl.textContent = '¡Chapoteo! El barro te frena.';
  } else if (score < crystals.length) statusEl.textContent = 'Busca los destellos por todo el bosque.';

  crystals.forEach(c => {
    if (!c.taken && overlaps({ x: player.x, y: player.y, size: player.size }, { x: c.x - 8, y: c.y - 8, size: 16 })) {
      c.taken = true; score++; scoreEl.textContent = score; addSparkles(c.x, c.y);
      statusEl.textContent = score === crystals.length ? '¡Lo lograste! ¡Bosque iluminado! ✨' : '¡Destello conseguido! ✨';
      if (score === crystals.length) won = true;
    }
  });
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
  particles = particles.filter(p => p.life > 0);
}
function render(time = 0) {
  drawBackground();
  puddles.forEach(drawPuddle);
  trees.forEach(drawTree);
  crystals.forEach(c => drawCrystal(c, time));
  drawPlayer();
  drawParticles();
  if (won) {
    ctx.fillStyle = 'rgba(9, 15, 35, .72)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe77b'; ctx.font = '900 38px Nunito, sans-serif';
    ctx.fillText('¡MISIÓN CUMPLIDA!', W / 2, H / 2 - 10);
    ctx.fillStyle = '#ffffff'; ctx.font = '700 19px Nunito, sans-serif';
    ctx.fillText('Recogiste todos los destellos ✦', W / 2, H / 2 + 28);
  }
}
function loop(time) { update(); render(time); requestAnimationFrame(loop); }
window.addEventListener('keydown', e => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  keys.add(k);
});
window.addEventListener('keyup', e => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  keys.delete(k);
});
window.addEventListener('blur', () => keys.clear());
restartBtn.addEventListener('click', resetGame);
resetGame();
loop();
