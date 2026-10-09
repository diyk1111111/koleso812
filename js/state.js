// Состояние приложения и функции для его изменения.
// Все функции чистые: не меняют старый объект, а возвращают новый.

export const MIN_SECTORS = 2;
export const MAX_SECTORS = 12;
export const MAX_LABEL_LENGTH = 20;
export const MIN_WEIGHT = 1;
export const MAX_WEIGHT = 100;
export const MAX_HISTORY = 10;
export const PALETTE = ["#f44336", "#ff9800", "#ffeb3b", "#4caf50", "#00bcd4", "#3f51b5", "#9c27b0", "#e91e63"];

const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const DEFAULT_LABELS = ["Приз 1", "Приз 2", "Приз 3", "Приз 4", "Приз 5", "Приз 6"];

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function createSector(label, index, id = makeId()) {
  return { id, label, weight: MIN_WEIGHT, color: PALETTE[index % PALETTE.length] };
}

export function createDefaultState() {
  return {
    sectors: DEFAULT_LABELS.map((label, i) => createSector(label, i, `s${i}`)),
    history: [],
    stats: {},
    removeWinner: false,
  };
}

// Вес — целое число от MIN_WEIGHT до MAX_WEIGHT
export function clampWeight(value) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return MIN_WEIGHT;
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, number));
}

// Возвращает { state, error }: при ошибке state остаётся прежним
export function addSector(state, rawLabel) {
  const label = String(rawLabel).trim();

  if (label === "") return { state, error: "Введите название сектора" };
  if (label.length > MAX_LABEL_LENGTH) return { state, error: `Не длиннее ${MAX_LABEL_LENGTH} символов` };
  if (state.sectors.length >= MAX_SECTORS) return { state, error: `Максимум ${MAX_SECTORS} секторов` };
  if (state.sectors.some((s) => s.label === label)) return { state, error: "Такой сектор уже есть" };

  const sector = createSector(label, state.sectors.length);
  return { state: { ...state, sectors: [...state.sectors, sector] }, error: "" };
}

export function removeSector(state, id) {
  if (state.sectors.length <= MIN_SECTORS) {
    return { state, error: `Должно быть минимум ${MIN_SECTORS} сектора` };
  }
  return { state: { ...state, sectors: state.sectors.filter((s) => s.id !== id) }, error: "" };
}

// Меняет вес и/или цвет сектора; неправильные значения игнорируются
export function updateSector(state, id, changes) {
  const clean = {};
  if ("weight" in changes) clean.weight = clampWeight(changes.weight);
  if ("color" in changes && COLOR_PATTERN.test(changes.color)) clean.color = changes.color;

  return {
    ...state,
    sectors: state.sectors.map((s) => (s.id === id ? { ...s, ...clean } : s)),
  };
}

// Записывает результат вращения в историю и статистику
export function recordWin(state, label) {
  const previous = Object.hasOwn(state.stats, label) ? state.stats[label] : 0;
  return {
    ...state,
    history: [label, ...state.history].slice(0, MAX_HISTORY),
    stats: { ...state.stats, [label]: previous + 1 },
  };
}

export function clearResults(state) {
  return { ...state, history: [], stats: {} };
}

export function setRemoveWinner(state, enabled) {
  return { ...state, removeWinner: Boolean(enabled) };
}

// ===== Проверка данных, загруженных из localStorage =====
// Пользователь мог вручную испортить сохранение, поэтому ничему не доверяем.

function sanitizeSector(raw, index) {
  if (!raw || typeof raw.label !== "string") return null;
  const label = raw.label.trim().slice(0, MAX_LABEL_LENGTH);
  if (label === "") return null;

  return {
    id: typeof raw.id === "string" && raw.id !== "" ? raw.id : makeId(),
    label,
    weight: clampWeight(raw.weight),
    color: COLOR_PATTERN.test(raw.color) ? raw.color : PALETTE[index % PALETTE.length],
  };
}

function sanitizeStats(raw) {
  if (!raw || typeof raw !== "object") return {};
  return Object.fromEntries(
    Object.entries(raw).filter(([, count]) => Number.isInteger(count) && count > 0)
  );
}

export function sanitizeState(raw) {
  const fallback = createDefaultState();
  if (!raw || typeof raw !== "object") return fallback;

  const sectors = Array.isArray(raw.sectors)
    ? raw.sectors.map(sanitizeSector).filter(Boolean).slice(0, MAX_SECTORS)
    : [];

  return {
    sectors: sectors.length >= MIN_SECTORS ? sectors : fallback.sectors,
    history: Array.isArray(raw.history)
      ? raw.history.filter((item) => typeof item === "string").slice(0, MAX_HISTORY)
      : [],
    stats: sanitizeStats(raw.stats),
    removeWinner: raw.removeWinner === true,
  };
}
