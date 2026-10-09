// Отрисовка списков, статистики и модального окна (работа с DOM)

import { getChancePercent, getTotalWeight } from "./math.js";
import { MAX_WEIGHT, MIN_WEIGHT } from "./state.js";

function createElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text; // textContent защищает от вставки HTML
  return el;
}

// ===== Список секторов =====
export function renderSectorList(listEl, sectors, handlers) {
  const total = getTotalWeight(sectors);
  listEl.replaceChildren(
    ...sectors.map((sector) => createSectorItem(sector, getChancePercent(sector.weight, total), handlers))
  );
}

function createSectorItem(sector, chance, { onRemove, onColorInput, onWeightChange }) {
  const li = createElement("li");

  const color = createElement("input", "color");
  color.type = "color";
  color.value = sector.color;
  color.title = "Цвет сектора";
  color.addEventListener("input", () => onColorInput(sector.id, color.value));

  const weight = createElement("input", "weight");
  weight.type = "number";
  weight.min = MIN_WEIGHT;
  weight.max = MAX_WEIGHT;
  weight.value = sector.weight;
  weight.title = "Вес: чем больше, тем выше шанс";
  weight.addEventListener("change", () => onWeightChange(sector.id, weight.value));

  const removeBtn = createElement("button", "remove", "✕");
  removeBtn.type = "button";
  removeBtn.title = "Удалить";
  removeBtn.addEventListener("click", () => onRemove(sector.id));

  li.append(color, createElement("span", "name", sector.label), weight, createElement("span", "chance", `${chance}%`), removeBtn);
  return li;
}

// ===== История =====
export function renderHistory(listEl, history) {
  listEl.replaceChildren(...history.map((label) => createElement("li", "", label)));
}

// ===== Статистика =====
export function renderStats(tbody, stats) {
  const entries = Object.entries(stats).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    const row = createElement("tr");
    const cell = createElement("td", "empty", "Пока нет данных");
    cell.colSpan = 3;
    row.append(cell);
    tbody.replaceChildren(row);
    return;
  }

  const maxCount = entries[0][1];
  tbody.replaceChildren(...entries.map(([label, count]) => createStatsRow(label, count, maxCount)));
}

function createStatsRow(label, count, maxCount) {
  const row = createElement("tr");
  const bar = createElement("div", "bar");
  bar.style.width = `${(count / maxCount) * 100}%`;

  const barCell = createElement("td", "bar-cell");
  barCell.append(bar);
  row.append(createElement("td", "", label), createElement("td", "count", String(count)), barCell);
  return row;
}

// ===== Модальное окно =====
export function showModal(modalEl, textEl, message) {
  textEl.textContent = message;
  modalEl.hidden = false;
}

export function hideModal(modalEl) {
  modalEl.hidden = true;
}
