const EXPLORER_RECEIPT_BASE = "https://explore.tempo.xyz/receipt/";
const ALLOWED_TYPES = new Set(["swap", "send", "receive", "approve"]);
const memoryStore = new Map();
const STORAGE_PREFIX = "tempo-activity-v1";

function storageKey(account) {
  return String(account || "").toLowerCase();
}

function browserKey(account) {
  return `${STORAGE_PREFIX}:${storageKey(account)}`;
}

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function getExplorerReceiptUrl(hash) {
  return `${EXPLORER_RECEIPT_BASE}${hash}`;
}

export function readActivity(account) {
  if (!account) return [];
  const key = storageKey(account);

  if (canUseSessionStorage()) {
    try {
      const raw = window.sessionStorage.getItem(browserKey(account));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return memoryStore.get(key) || [];
}

export function writeActivity(account, items) {
  if (!account) return;
  const key = storageKey(account);
  const safeItems = Array.isArray(items) ? items : [];

  if (canUseSessionStorage()) {
    try {
      window.sessionStorage.setItem(browserKey(account), JSON.stringify(safeItems));
      return;
    } catch {
      // Fall through to in-memory storage.
    }
  }

  memoryStore.set(key, safeItems);
}

export function clearActivity(account) {
  if (!account) return;
  const key = storageKey(account);

  if (canUseSessionStorage()) {
    try {
      window.sessionStorage.removeItem(browserKey(account));
    } catch {
      // Ignore storage removal failures.
    }
  }

  memoryStore.delete(key);
}

export function addActivity(account, entry) {
  if (!account || !entry || !ALLOWED_TYPES.has(entry.type)) return;

  const current = readActivity(account);
  const dedupeKey = `${entry.hash}-${entry.type}`;
  const deduped = current.filter((item) => `${item.hash}-${item.type}` !== dedupeKey);
  const next = [
    {
      ...entry,
      explorerUrl: entry.explorerUrl || getExplorerReceiptUrl(entry.hash),
      createdAt: entry.createdAt || Date.now(),
    },
    ...deduped,
  ];

  writeActivity(account, next.slice(0, 300));
}
