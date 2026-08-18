/**
 * Persistenza del cronometro: impostazioni e storico delle stringhe di tiro.
 * Tutto in localStorage, coerentemente col resto dell'app (che funziona offline).
 */

const SETTINGS_KEY = 'timerSettings';
const STRINGS_KEY = 'timerStrings';
const MAX_STRINGS = 25;

export const DEFAULT_SETTINGS = {
  inputMode: 'mic',        // 'mic' | 'manual'
  delayMode: 'random',     // 'random' | 'fixed' | 'instant'
  delayMin: 1,             // s - IPSC: il segnale di via arriva 1-4 s dopo "Standby"
  delayMax: 4,             // s
  delayFixed: 3,           // s
  parEnabled: false,
  parTime: 5,              // s
  sensitivity: 5,          // 1-8
  deadTimeMs: 110,         // anti-eco
  beepVolume: 1,           // 0-1
  beepMs: 250,
  visualStart: true,
  vibrate: true,
  calibrationMs: 0,        // correzione manuale della latenza audio
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch { /* quota piena o storage negato: le impostazioni restano solo in memoria */ }
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function getStrings() {
  try {
    const raw = localStorage.getItem(STRINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(strings) {
  try {
    localStorage.setItem(STRINGS_KEY, JSON.stringify(strings.slice(0, MAX_STRINGS)));
  } catch { /* quota piena: lo storico non e' critico */ }
}

/** @param {{shots:number[], parTime:number|null, inputMode:string}} data */
export function saveString(data) {
  const strings = getStrings();
  const entry = {
    id: generateId(),
    savedAt: new Date().toISOString(),
    shots: data.shots,
    parTime: data.parTime ?? null,
    inputMode: data.inputMode,
  };
  strings.unshift(entry);
  persist(strings);
  return entry;
}

export function deleteString(id) {
  persist(getStrings().filter(s => s.id !== id));
}

export function clearStrings() {
  persist([]);
}

/** Aggiorna i colpi di una stringa gia' salvata (usato quando si elimina un eco). */
export function updateString(id, shots) {
  const strings = getStrings();
  const entry = strings.find(s => s.id === id);
  if (!entry) return;
  entry.shots = shots;
  persist(strings);
}
