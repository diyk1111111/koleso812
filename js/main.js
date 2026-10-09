// Точка входа: связывает состояние, отрисовку и события

import { launchConfetti } from "./confetti.js";
import {
  easeOutCubic, getChancePercent, getRandomSpinAngle,
  getTotalWeight, getWinnerIndex, normalizeAngle,
} from "./math.js";
import {
  addSector, clearResults, recordWin, removeSector, setRemoveWinner, updateSector,
} from "./state.js";
import { loadState, saveState } from "./storage.js";
import { hideModal, renderHistory, renderSectorList, renderStats, showModal } from "./ui.js";
import { drawWheel } from "./wheel.js";

const SPIN_DURATION = 5000; // длительность вращения, мс

const byId = (id) => document.getElementById(id);
const els = {
  wheel: byId("wheel"),
  spinBtn: byId("spinBtn"),
  removeWinner: byId("removeWinner"),
  panel: byId("panel"),
  addForm: byId("addForm"),
  sectorInput: byId("sectorInput"),
  error: byId("error"),
  sectorList: byId("sectorList"),
  statsBody: byId("statsBody"),
  clearBtn: byId("clearBtn"),
  historyList: byId("historyList"),
  modal: byId("modal"),
  modalText: byId("modalText"),
  modalOk: byId("modalOk"),
  confetti: byId("confetti"),
};

let state = loadState();
let rotation = 0;         // текущий угол поворота колеса (радианы)
let isSpinning = false;
let lastWinnerId = null;  // нужен для режима «удалять выпавший»

// ===== Состояние и отрисовка =====
function setState(nextState) {
  state = nextState;
  saveState(state);
  render();
}

function render() {
  drawWheel(els.wheel, state.sectors, rotation);
  renderSectorList(els.sectorList, state.sectors, sectorHandlers);
  renderHistory(els.historyList, state.history);
  renderStats(els.statsBody, state.stats);
  els.removeWinner.checked = state.removeWinner;
}

function showError(message) {
  els.error.textContent = message;
}

// Применяет результат вида { state, error } из state.js
function applyResult({ state: nextState, error }) {
  showError(error);
  if (!error) setState(nextState);
}

const sectorHandlers = {
  onRemove: (id) => applyResult(removeSector(state, id)),
  onWeightChange: (id, weight) => setState(updateSector(state, id, { weight })),
  // При выборе цвета перерисовываем только колесо, чтобы палитра не закрывалась
  onColorInput: (id, color) => {
    state = updateSector(state, id, { color });
    saveState(state);
    drawWheel(els.wheel, state.sectors, rotation);
  },
};

function setControlsDisabled(disabled) {
  els.spinBtn.disabled = disabled;
  els.removeWinner.disabled = disabled;
  els.panel.querySelectorAll("button, input").forEach((el) => {
    el.disabled = disabled;
  });
}

// ===== Вращение =====
function spin() {
  if (isSpinning) return;
  isSpinning = true;
  setControlsDisabled(true);
  showError("");

  const startRotation = rotation;
  const totalAngle = getRandomSpinAngle();
  const startTime = performance.now();

  function animate(now) {
    const progress = Math.min((now - startTime) / SPIN_DURATION, 1);
    rotation = startRotation + totalAngle * easeOutCubic(progress);
    drawWheel(els.wheel, state.sectors, rotation);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      finishSpin();
    }
  }

  requestAnimationFrame(animate);
}

function finishSpin() {
  rotation = normalizeAngle(rotation); // чтобы число не росло бесконечно
  const winner = state.sectors[getWinnerIndex(state.sectors, rotation)];
  const chance = getChancePercent(winner.weight, getTotalWeight(state.sectors));

  lastWinnerId = winner.id;
  isSpinning = false;
  setState(recordWin(state, winner.label));
  setControlsDisabled(false);

  showModal(els.modal, els.modalText, `Выпало: ${winner.label} (шанс был ${chance}%)`);
  els.modalOk.focus();
  launchConfetti(els.confetti);
}

function closeModal() {
  if (els.modal.hidden) return;
  hideModal(els.modal);

  if (state.removeWinner && lastWinnerId) {
    applyResult(removeSector(state, lastWinnerId));
  }
  lastWinnerId = null;
  els.spinBtn.focus();
}

// ===== События =====
els.spinBtn.addEventListener("click", spin);

els.addForm.addEventListener("submit", (event) => {
  event.preventDefault(); // не перезагружать страницу
  if (isSpinning) return;

  const result = addSector(state, els.sectorInput.value);
  applyResult(result);
  if (!result.error) els.sectorInput.value = "";
  els.sectorInput.focus();
});

els.removeWinner.addEventListener("change", () => {
  setState(setRemoveWinner(state, els.removeWinner.checked));
});

els.clearBtn.addEventListener("click", () => {
  if (confirm("Очистить статистику и историю?")) setState(clearResults(state));
});

els.modalOk.addEventListener("click", closeModal);
els.modal.addEventListener("click", (event) => {
  if (event.target === els.modal) closeModal(); // клик по затемнённому фону
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

render();
