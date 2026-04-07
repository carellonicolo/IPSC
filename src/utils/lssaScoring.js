/**
 * LSSA / FIIDS Scoring Systems
 *
 * PALADIN (Regolamento LSSA 3.2):
 *   Score = Tempo + Penalità (in secondi)
 *   Vince il tempo più basso.
 *
 * DEFENSIVE COUNT (Regolamento FIIDS 16.3):
 *   Score = Tempo + (Points Down × 0.5) + Penalità (in secondi)
 *   Vince il tempo più basso.
 */

// ─── PALADIN (LSSA) ─────────────────────────────────────────────
// Penalità espresse in secondi aggiunti al tempo
export const PALADIN_PENALTIES = {
  FTN:  5,   // Failure To Neutralize – mancata neutralizzazione (Reg. 3.4.1)
  PROC: 5,   // Procedura (Reg. 3.4.2)
  HNT:  10,  // Hit Not Threat – ingaggio bersaglio penalty (Reg. 3.4.3)
  FTE:  15,  // Failure To Engage – mancato ingaggio (Reg. 3.4.4)
  FTDR: 20,  // Failure To Do Right – errata esecuzione (Reg. 3.4.5)
};

/**
 * Calcola il punteggio PALADIN (LSSA).
 * @param {number} time   Tempo di esecuzione in secondi
 * @param {Object} penalties  { FTN, PROC, HNT, FTE, FTDR } conteggio penalità
 * @returns {Object} { totalTime, penaltyTime, rawTime }
 */
export function calculatePaladin(time, penalties) {
  const rawTime = parseFloat(time) || 0;

  const penaltyTime =
    (penalties.FTN  || 0) * PALADIN_PENALTIES.FTN  +
    (penalties.PROC || 0) * PALADIN_PENALTIES.PROC +
    (penalties.HNT  || 0) * PALADIN_PENALTIES.HNT  +
    (penalties.FTE  || 0) * PALADIN_PENALTIES.FTE  +
    (penalties.FTDR || 0) * PALADIN_PENALTIES.FTDR;

  return {
    rawTime,
    penaltyTime,
    totalTime: rawTime + penaltyTime,
  };
}


// ─── DEFENSIVE COUNT (FIIDS) ────────────────────────────────────
// Points Down per zona del bersaglio FIIDS
export const DEFENSIVE_POINTS_DOWN = {
  ZERO:  0,  // Zona -0 (centro)
  DOWN2: 2,  // Zona -2
  DOWN3: 3,  // Zona -3 (bordo)
  MISS:  5,  // Colpo mancante
};

// Penalità FIIDS in secondi (Reg. 3.x)
export const DEFENSIVE_PENALTIES = {
  PENALTY: 5,  // Bersaglio penalty colpito (Reg. 3.3)
  FTE:     5,  // Bersaglio non ingaggiato (Reg. 3.3)
  PROC:    3,  // Errore di procedura (Reg. 3.4)
  ANTISP:  8,  // Condotta antisportiva (Reg. 3.2)
};

/**
 * Calcola il punteggio Defensive Count (FIIDS).
 * @param {number} time  Tempo di esecuzione in secondi
 * @param {Object} hits  { ZERO, DOWN2, DOWN3, MISS } conteggio colpi per zona
 * @param {Object} penalties  { PENALTY, FTE, PROC, ANTISP } conteggio penalità
 * @returns {Object} { totalTime, rawTime, totalPointsDown, pointsDownTime, penaltyTime }
 */
export function calculateDefensiveCount(time, hits, penalties) {
  const rawTime = parseFloat(time) || 0;

  const totalPointsDown =
    (hits.ZERO  || 0) * DEFENSIVE_POINTS_DOWN.ZERO  +
    (hits.DOWN2 || 0) * DEFENSIVE_POINTS_DOWN.DOWN2 +
    (hits.DOWN3 || 0) * DEFENSIVE_POINTS_DOWN.DOWN3 +
    (hits.MISS  || 0) * DEFENSIVE_POINTS_DOWN.MISS;

  const pointsDownTime = totalPointsDown * 0.5;

  const penaltyTime =
    (penalties.PENALTY || 0) * DEFENSIVE_PENALTIES.PENALTY +
    (penalties.FTE     || 0) * DEFENSIVE_PENALTIES.FTE     +
    (penalties.PROC    || 0) * DEFENSIVE_PENALTIES.PROC    +
    (penalties.ANTISP  || 0) * DEFENSIVE_PENALTIES.ANTISP;

  return {
    rawTime,
    totalPointsDown,
    pointsDownTime,
    penaltyTime,
    totalTime: rawTime + pointsDownTime + penaltyTime,
  };
}
