import { CURRENT_PATCH } from '../constants';

const STORAGE_KEY = 'bbx-support-popup';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function shouldShowSupportPopup() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return true;
  try {
    const { lastSeen, seenPatch } = JSON.parse(raw);
    if (seenPatch !== CURRENT_PATCH) return true;
    if (Date.now() - lastSeen >= SEVEN_DAYS_MS) return true;
    return false;
  } catch {
    return true;
  }
}

export function dismissSupportPopup() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ lastSeen: Date.now(), seenPatch: CURRENT_PATCH }));
}
