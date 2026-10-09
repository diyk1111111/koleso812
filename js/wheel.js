// Рисование колеса на canvas

import { getSectorAngles } from "./math.js";

const EDGE_PADDING = 5;    // отступ колеса от края canvas
const TEXT_PADDING = 15;   // отступ текста от края колеса
const CENTER_RADIUS = 25;  // радиус белого круга в центре
const MAX_FONT = 18;
const MIN_FONT = 10;
const BRIGHTNESS_LIMIT = 150; // выше — фон светлый, текст чёрный

// Чёрный или белый текст в зависимости от яркости фона
export function getTextColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > BRIGHTNESS_LIMIT ? "#000" : "#fff";
}

export function drawWheel(canvas, sectors, rotation) {
  const ctx = canvas.getContext("2d");
  const center = canvas.width / 2;
  const radius = center - EDGE_PADDING;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  getSectorAngles(sectors).forEach((range, i) => {
    const start = rotation + range.start;
    const end = rotation + range.end;
    drawSector(ctx, sectors[i].color, start, end, center, radius);
    drawLabel(ctx, sectors[i], start, end, center, radius);
  });

  ctx.beginPath();
  ctx.arc(center, center, CENTER_RADIUS, 0, 2 * Math.PI);
  ctx.fillStyle = "#fff";
  ctx.fill();
}

function drawSector(ctx, color, start, end, center, radius) {
  ctx.beginPath();
  ctx.moveTo(center, center);
  ctx.arc(center, center, radius, start, end);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawLabel(ctx, sector, start, end, center, radius) {
  // Чем уже сектор, тем мельче шрифт
  const arcLength = (end - start) * radius * 0.7;
  const fontSize = Math.min(MAX_FONT, Math.max(MIN_FONT, arcLength * 0.45));
  const maxWidth = radius - TEXT_PADDING - CENTER_RADIUS - 10;

  ctx.save();
  ctx.translate(center, center);
  ctx.rotate((start + end) / 2);
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = getTextColor(sector.color);
  ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
  // Последний параметр сжимает длинный текст, чтобы он влез в сектор
  ctx.fillText(sector.label, radius - TEXT_PADDING, 0, maxWidth);
  ctx.restore();
}
