const CACHE_PREFIX = "mmel.cash-counter.open-location.";
const openStatuses = new Set(["open", "open_with_warning", "open_with_incident"]);

const storageKey = warehouse => `${CACHE_PREFIX}${encodeURIComponent(String(warehouse || ""))}`;

export const isCashCounterOpen = status => openStatuses.has(String(status || "").toLowerCase());

// This is only a UI-performance cache. Every transaction API remains protected
// by the server-side Cash Counter gate.
export function hasOpenCashCounterFlag(warehouse) {
  if (!warehouse || typeof window === "undefined") return false;
  try { return window.sessionStorage.getItem(storageKey(warehouse)) === "open"; }
  catch { return false; }
}

export function markCashCounterOpen(warehouse) {
  if (!warehouse || typeof window === "undefined") return;
  try { window.sessionStorage.setItem(storageKey(warehouse), "open"); }
  catch { /* private browsing or blocked storage: fall back to the normal check */ }
}

export function clearCashCounterFlag(warehouse) {
  if (!warehouse || typeof window === "undefined") return;
  try { window.sessionStorage.removeItem(storageKey(warehouse)); }
  catch { /* no action needed */ }
}

export function syncCashCounterFlag(warehouse, status, enabled = true) {
  if (enabled !== false && isCashCounterOpen(status)) markCashCounterOpen(warehouse);
  else clearCashCounterFlag(warehouse);
}
