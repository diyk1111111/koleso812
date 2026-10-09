// Сохранение состояния в localStorage, чтобы данные не пропадали после перезагрузки

import { createDefaultState, sanitizeState } from "./state.js";

const STORAGE_KEY = "wheel-of-fortune";

export function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? sanitizeState(JSON.parse(saved)) : createDefaultState();
  } catch (error) {
    // Битый JSON или localStorage запрещён (например, приватный режим)
    console.warn("Не удалось загрузить сохранение:", error);
    return createDefaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Не удалось сохранить данные:", error);
  }
}
