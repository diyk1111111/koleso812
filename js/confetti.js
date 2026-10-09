// Конфетти на отдельном canvas поверх страницы

const PARTICLE_COUNT = 150;
const DURATION = 3000; // мс
const GRAVITY = 0.05;
const COLORS = ["#f44336", "#ff9800", "#ffeb3b", "#4caf50", "#00bcd4", "#e91e63", "#ffffff"];

let frameId = null;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createParticle(width) {
  return {
    x: Math.random() * width,
    y: randomBetween(-200, 0),
    vx: randomBetween(-2, 2),
    vy: randomBetween(1, 3),
    size: randomBetween(4, 10),
    angle: Math.random() * Math.PI,
    spin: randomBetween(-0.15, 0.15),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

// Новое положение частицы через один кадр
function moveParticle(p) {
  return { ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + GRAVITY, angle: p.angle + p.spin };
}

function drawParticle(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.fillStyle = p.color;
  ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
  ctx.restore();
}

export function launchConfetti(canvas) {
  cancelAnimationFrame(frameId); // если прошлое конфетти ещё летит
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx = canvas.getContext("2d");
  const startTime = performance.now();
  let particles = Array.from({ length: PARTICLE_COUNT }, () => createParticle(canvas.width));

  function frame(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.map(moveParticle);
    particles.forEach((p) => drawParticle(ctx, p));

    if (now - startTime < DURATION) {
      frameId = requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  frameId = requestAnimationFrame(frame);
}
