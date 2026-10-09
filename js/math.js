// Чистые математические функции колеса (без DOM) — их удобно тестировать.

export const FULL_CIRCLE = 2 * Math.PI;
// Указатель стоит сверху колеса: это угол -90° (-PI/2)
export const POINTER_ANGLE = -Math.PI / 2;

const MIN_TURNS = 5;   // минимум полных оборотов при вращении
const EXTRA_TURNS = 3; // плюс случайно до 3 оборотов

// Приводит любой угол к диапазону [0, 2PI)
export function normalizeAngle(angle) {
  const result = angle % FULL_CIRCLE;
  return result < 0 ? result + FULL_CIRCLE : result;
}

export function getTotalWeight(sectors) {
  return sectors.reduce((sum, sector) => sum + sector.weight, 0);
}

// Шанс выпадения сектора в процентах (с одним знаком после запятой)
export function getChancePercent(weight, totalWeight) {
  return Math.round((weight / totalWeight) * 1000) / 10;
}

// Для каждого сектора считает начальный и конечный угол.
// Размер сектора пропорционален его весу.
export function getSectorAngles(sectors) {
  const total = getTotalWeight(sectors);
  let start = 0;
  return sectors.map((sector) => {
    const size = (sector.weight / total) * FULL_CIRCLE;
    const range = { start, end: start + size };
    start += size;
    return range;
  });
}

// Номер сектора, который находится под указателем при данном повороте колеса
export function getWinnerIndex(sectors, rotation) {
  if (sectors.length === 0) return -1;

  // Угол под указателем относительно начала колеса
  const angle = normalizeAngle(POINTER_ANGLE - rotation);
  const index = getSectorAngles(sectors).findIndex(
    (range) => angle >= range.start && angle < range.end
  );
  // Из-за погрешности дробных чисел угол может чуть-чуть не попасть в последний сектор
  return index === -1 ? sectors.length - 1 : index;
}

// Случайный угол, на который повернётся колесо (от 5 до 8 оборотов)
export function getRandomSpinAngle(random = Math.random) {
  return (MIN_TURNS + random() * EXTRA_TURNS) * FULL_CIRCLE;
}

// Плавное замедление в конце анимации: t от 0 до 1
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
