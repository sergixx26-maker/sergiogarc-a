const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const playBtn = document.getElementById('playBtn');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const message = document.getElementById('message');
const progressText = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');
const bestEl = document.getElementById('best');
const attemptsEl = document.getElementById('attempts');

const W = canvas.width, H = canvas.height;
const FLOOR = 355;
const player = { x: 130, y: FLOOR - 30, size: 30, vy: 0, grounded: true, rotation: 0 };
let obstacles = [], particles = [], running = false, dead = false, won = false;
let distance = 0, attempts = 0, best = 0, lastTime = 0, speed = 5.1, spawnTimer = 0;
const finishDistance = 5600;
try { best = Number(localStorage.getItem('neonDashBest') || 0); } catch(e) {}
bestEl.textContent = best + '%';

function resetRun() {
  player.x = 130; player.y = FLOOR - player.size; player.vy = 0; player.grounded = true; player.rotation = 0;
  obstacles = []; particles = []; distance = 0; speed = 5.1; spawnTimer = 65; dead = false; won = false;
  progressText.textContent = '0%'; progressFill.style.width = '0%'; message.textContent = '¡Concéntrate y salta!';
}
function startGame() {
  resetRun(); attempts++; attemptsEl.textContent = attempts; running = true; overlay.classList.add('hidden');
}
function jump() {
  if (!running) return;
  if (player.grounded) { player.vy = -12.8; player.grounded = false; burst(player.x + 15, player.y + 28, '#4cf7ff', 7); }
}
function burst(x,y,color,n=12) {
  for(let i=0;i<n;i++) particles.push({x,y,vx:(Math.random()-.5)*5,vy:(Math.random()-.7)*5,life:24,max:24,color,size:Math.random()*4+2});
}
function spawnObstacle() {
  const type = Math.random() < .78 ? 'spike' : 'double';
  obstacles.push({x:W+30, y:FLOOR, w:type==='double'?58:30, h:type==='double'?42:35, type, passed:false});
}
function rectHit(a,b) {
  const pad=5;
  return a.x+pad < b.x+b.w-3 && a.x+a.size-pad > b.x+3 && a.y+pad < b.y && a.y+a.size-pad > b.y-b.h+3;
}
function endGame(victory=false) {
  running=false; dead=!victory; won=victory;
  if(victory){ message.textContent='¡Nivel completado!'; overlayTitle.textContent='¡NIVEL SUPERADO!'; overlayText.textContent='¡Has cruzado el portal neón! ¿Te atreves a otra ronda?'; playBtn.textContent='↻ JUGAR OTRA VEZ'; burst(player.x+15,player.y+15,'#ff4fd8',35); }
  else { message.textContent='¡Ups! Prueba otra vez.'; overlayTitle.textContent='¡CASI LO LOGRAS!'; overlayText.textContent='Los pinchos no perdonan. ¡Vuelve a intentarlo!'; playBtn.textContent='↻ REINTENTAR'; }
  overlay.classList.remove('hidden');
}
function update(dt) {
  if(!running) return;
  const factor=dt/16.67;
  distance += speed*factor; speed = Math.min(7.5, 5.1 + distance/1800);
  const pct=Math.min(100,Math.floor(distance/finishDistance*100));
  progressText.textContent=pct+'%'; progressFill.style.width=pct+'%';
  const currentBest=Math.max(best,pct); if(currentBest!==best){best=currentBest;bestEl.textContent=best+'%';try{localStorage.setItem('neonDashBest',best)}catch(e){}}
  player.vy += .68*factor; player.y += player.vy*factor;
  if(player.y+player.size >= FLOOR){player.y=FLOOR-player.size;player.vy=0;player.grounded=true;player.rotation=Math.round(player.rotation/(Math.PI/2))*(Math.PI/2);}
  else player.rotation += .12*factor;
  spawnTimer-=factor;
  if(spawnTimer<=0){spawnObstacle();spawnTimer=(Math.random()*35+48)*(5.1/speed);}
  obstacles.forEach(o=>{o.x-=speed*factor;if(rectHit(player,o)){burst(player.x+15,player.y+15,'#ff4fd8',18);endGame(false);}});
  obstacles=obstacles.filter(o=>o.x+o.w>-20);
  if(distance>=finishDistance){distance=finishDistance;endGame(true);}
  particles.forEach(p=>{p.x+=p.vx*factor;p.y+=p.vy*factor;p.vy+=.12*factor;p.life-=factor;});
  particles=particles.filter(p=>p.life>0);
}
function drawBackground(time) {
  const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#111a42');grad.addColorStop(1,'#14102d');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  // Neon grid scrolling in perspective-like bands
  ctx.strokeStyle='rgba(76,247,255,.12)';ctx.lineWidth=1;
  const shift=(distance*.45)%40;
  for(let x=-shift;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=20;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  // Floating pixel stars
  for(let i=0;i<45;i++){const x=(i*137-distance*.25)%(W+20);const xx=(x+W+20)%(W+20);const y=(i*67)%270;ctx.fillStyle=i%3===0?'#ff4fd8':'#4cf7ff';ctx.globalAlpha=.25+.35*Math.abs(Math.sin(time/500+i));ctx.fillRect(xx,y, i%4===0?4:2,i%4===0?4:2);}
  ctx.globalAlpha=1;
  // floor
  ctx.fillStyle='#161d43';ctx.fillRect(0,FLOOR,W,H-FLOOR);
  ctx.fillStyle='#4cf7ff';ctx.fillRect(0,FLOOR,W,3);
  ctx.fillStyle='rgba(76,247,255,.09)';ctx.fillRect(0,FLOOR+3,W,12);
  for(let x=-(distance%48);x<W;x+=48){ctx.fillStyle='rgba(255,79,216,.4)';ctx.fillRect(x,FLOOR+20,24,2);}
}
function drawSpike(o) {
  ctx.save();ctx.shadowBlur=16;ctx.shadowColor='#ff4fd8';ctx.fillStyle='#ff4fd8';
  const count=o.type==='double'?2:1, each=o.w/count;
  for(let i=0;i<count;i++){const x=o.x+i*each;ctx.beginPath();ctx.moveTo(x,FLOOR);ctx.lineTo(x+each/2,FLOOR-o.h);ctx.lineTo(x+each,FLOOR);ctx.closePath();ctx.fill();}
  ctx.shadowBlur=0;ctx.strokeStyle='#ffd4f7';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(o.x+o.w/2,FLOOR-o.h+7);ctx.lineTo(o.x+o.w/2,FLOOR-5);ctx.stroke();ctx.restore();
}
function drawPlayer(time) {
  const cx=player.x+player.size/2,cy=player.y+player.size/2;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(player.rotation);
  ctx.shadowColor='#4cf7ff';ctx.shadowBlur=20;
  const g=ctx.createLinearGradient(-15,-15,15,15);g.addColorStop(0,'#e6ffff');g.addColorStop(.45,'#4cf7ff');g.addColorStop(1,'#7c5cff');
  ctx.fillStyle=g;ctx.fillRect(-15,-15,30,30);ctx.shadowBlur=0;
  ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.strokeRect(-12,-12,24,24);
  ctx.fillStyle='#0a1230';ctx.fillRect(-7,-4,5,5);ctx.fillRect(3,-4,5,5);ctx.fillRect(-5,5,10,3);
  ctx.restore();
}
function drawPortal() {
  if(distance<finishDistance-300)return;
  const x=W-(finishDistance-distance)/300*W;
  ctx.save();ctx.shadowColor='#ff4fd8';ctx.shadowBlur=25;ctx.strokeStyle='#ff4fd8';ctx.lineWidth=8;ctx.strokeRect(x-25,FLOOR-105,50,105);ctx.strokeStyle='#4cf7ff';ctx.lineWidth=3;ctx.strokeRect(x-16,FLOOR-96,32,96);ctx.restore();
}
function render(time=0) {
  drawBackground(time);drawPortal();obstacles.forEach(drawSpike);
  particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);});ctx.globalAlpha=1;
  drawPlayer(time);
  if(!running&&!won&&!dead){ctx.fillStyle='rgba(76,247,255,.6)';ctx.fillRect(0,FLOOR-2,W,2);}
}
function loop(time) {const dt=lastTime?Math.min(34,time-lastTime):16.67;lastTime=time;update(dt);render(time);requestAnimationFrame(loop);}
playBtn.addEventListener('click',startGame);
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','KeyW'].includes(e.code)){e.preventDefault();if(!running)startGame();else jump();}if(e.code==='Enter'&&!running)startGame();});
canvas.addEventListener('pointerdown',()=>{if(!running)startGame();else jump();});
overlay.addEventListener('pointerdown',e=>{if(e.target===overlay && !running) startGame();});
resetRun();loop();
