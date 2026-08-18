/**
 * Match Storage – CRUD per gare, tiratori e stage in localStorage.
 *
 * Struttura dati:
 *   Match { id, name, discipline, createdAt, shooters[] }
 *     └─ Shooter { id, name, stages[] }
 *          └─ Stage { id, stageNumber, savedAt, time, ...inputData, result }
 */

const STORAGE_KEY = 'matches';

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function _load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function _save(matches) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      alert('Memoria piena: impossibile salvare. Elimina qualche gara per liberare spazio.');
    }
    throw e;
  }
}

// ─── MATCHES ───────────────────────────────────────────

export function getMatches(discipline) {
  const all = _load();
  if (!discipline) return all;
  return all.filter(m => m.discipline === discipline);
}

export function getMatch(matchId) {
  return _load().find(m => m.id === matchId) || null;
}

export function createMatch(name, discipline) {
  const matches = _load();
  const match = {
    id: generateId(),
    name: name.trim(),
    discipline,
    createdAt: new Date().toISOString(),
    shooters: [],
  };
  matches.unshift(match);
  _save(matches);
  return match;
}

export function deleteMatch(matchId) {
  const matches = _load().filter(m => m.id !== matchId);
  _save(matches);
}

// ─── SHOOTERS ──────────────────────────────────────────

export function addShooter(matchId, shooterName) {
  const matches = _load();
  const match = matches.find(m => m.id === matchId);
  if (!match) return null;
  const shooter = {
    id: generateId(),
    name: shooterName.trim(),
    stages: [],
  };
  match.shooters.push(shooter);
  _save(matches);
  return shooter;
}

export function deleteShooter(matchId, shooterId) {
  const matches = _load();
  const match = matches.find(m => m.id === matchId);
  if (!match) return;
  match.shooters = match.shooters.filter(s => s.id !== shooterId);
  _save(matches);
}

// ─── STAGES ────────────────────────────────────────────

export function addStage(matchId, shooterId, stageData) {
  const matches = _load();
  const match = matches.find(m => m.id === matchId);
  if (!match) return null;
  const shooter = match.shooters.find(s => s.id === shooterId);
  if (!shooter) return null;

  const stage = {
    id: generateId(),
    stageNumber: stageData.stageNumber ?? (shooter.stages.length + 1),
    savedAt: new Date().toISOString(),
    ...stageData,
  };
  shooter.stages.push(stage);
  _save(matches);
  return stage;
}

export function deleteStage(matchId, shooterId, stageId) {
  const matches = _load();
  const match = matches.find(m => m.id === matchId);
  if (!match) return;
  const shooter = match.shooters.find(s => s.id === shooterId);
  if (!shooter) return;
  shooter.stages = shooter.stages.filter(s => s.id !== stageId);
  _save(matches);
}

export function getShooterStages(matchId, shooterId) {
  const match = getMatch(matchId);
  if (!match) return [];
  const shooter = match.shooters.find(s => s.id === shooterId);
  return shooter ? shooter.stages : [];
}

// ─── MODIFICHE ─────────────────────────────────────────

/** Aggiorna i dati di una gara (nome, data). */
export function updateMatch(matchId, patch) {
  const matches = _load();
  const match = matches.find(m => m.id === matchId);
  if (!match) return null;
  Object.assign(match, patch);
  _save(matches);
  return match;
}

/** Aggiorna i dati di un tiratore (nome). */
export function updateShooter(matchId, shooterId, patch) {
  const matches = _load();
  const match = matches.find(m => m.id === matchId);
  if (!match) return null;
  const shooter = match.shooters.find(s => s.id === shooterId);
  if (!shooter) return null;
  Object.assign(shooter, patch);
  _save(matches);
  return shooter;
}

/**
 * Aggiorna uno stage gia' salvato (punteggio, tempo, numero, dettaglio timer).
 * `id` e `savedAt` restano quelli originali: si modifica il risultato, non
 * si crea una registrazione nuova.
 */
export function updateStage(matchId, shooterId, stageId, patch) {
  const matches = _load();
  const match = matches.find(m => m.id === matchId);
  if (!match) return null;
  const shooter = match.shooters.find(s => s.id === shooterId);
  if (!shooter) return null;
  const index = shooter.stages.findIndex(s => s.id === stageId);
  if (index === -1) return null;

  const { id, savedAt, ...rest } = patch;
  void id; void savedAt;
  shooter.stages[index] = {
    ...shooter.stages[index],
    ...rest,
    editedAt: new Date().toISOString(),
  };
  _save(matches);
  return shooter.stages[index];
}
