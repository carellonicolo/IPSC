export const SCORE_VALUES = {
  MAJOR: { A: 5, C: 4, D: 2 },
  MINOR: { A: 5, C: 3, D: 1 }
};

export const PENALTY_VALUES = {
  MISS: -10,
  NO_SHOOT: -10,
  PROCEDURAL: -10
};

/**
 * Calculates the IPSC Hit Factor based on hits and time.
 * @param {Object} hits Object containing hit counts: { A, C, D, M, NS, PROC }
 * @param {number} time The time it took to complete the stage
 * @param {boolean} isMajor True if Major Power Factor, false if Minor
 * @returns {Object} { stageScore, hitFactor, totalPoints, totalPenalties }
 */
export function calculateHitFactor(hits, time, isMajor) {
  const pf = isMajor ? SCORE_VALUES.MAJOR : SCORE_VALUES.MINOR;
  
  // Calculate points from hits
  const pointsA = pf.A * (hits.A || 0);
  const pointsC = pf.C * (hits.C || 0);
  const pointsD = pf.D * (hits.D || 0);
  
  const totalPoints = pointsA + pointsC + pointsD;
  
  // Calculate penalties
  const penaltyM = Math.abs(PENALTY_VALUES.MISS) * (hits.M || 0);
  const penaltyNS = Math.abs(PENALTY_VALUES.NO_SHOOT) * (hits.NS || 0);
  const penaltyProc = Math.abs(PENALTY_VALUES.PROCEDURAL) * (hits.PROC || 0);
  
  const totalPenalties = penaltyM + penaltyNS + penaltyProc;
  
  // Stage score can't go below 0 according to IPSC rules
  let stageScore = totalPoints - totalPenalties;
  if (stageScore < 0) {
    stageScore = 0;
  }
  
  // Calculate Hit Factor: Points / Time
  const numericTime = parseFloat(time);
  let hitFactor = 0;
  
  if (numericTime > 0) {
    hitFactor = stageScore / numericTime;
  }
  
  return {
    stageScore,
    hitFactor: Number(hitFactor.toFixed(4)),
    totalPoints,
    totalPenalties
  };
}
