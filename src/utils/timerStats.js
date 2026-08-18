/**
 * Statistiche di una stringa di tiro.
 *
 * `shots` e' l'elenco dei tempi (in secondi) di ogni colpo misurati dal beep
 * di partenza. Il tempo ufficiale della stringa e' quello dell'ULTIMO colpo:
 * premere STOP interrompe l'ascolto ma non allunga il tempo, esattamente come
 * sui timer da gara, dove il cronometro "si ferma" sull'ultimo sparo rilevato.
 */
export function computeStats(shots, parTime = null) {
  const count = shots.length;
  const splits = shots.map((t, i) => (i === 0 ? t : t - shots[i - 1]));

  if (count === 0) {
    return {
      count: 0, splits: [], firstShot: null, totalTime: 0,
      bestSplit: null, worstSplit: null, avgSplit: null,
      bestSplitIndex: -1, worstSplitIndex: -1,
      rateOfFire: null, shotsInPar: 0, parExceeded: false,
    };
  }

  const firstShot = shots[0];
  const totalTime = shots[count - 1];

  // Gli split veri sono quelli tra colpi consecutivi: il primo "split" e' in
  // realta' il tempo di reazione + estrazione, e va tenuto fuori dalle medie.
  const realSplits = splits.slice(1);
  let bestSplit = null, worstSplit = null, bestSplitIndex = -1, worstSplitIndex = -1;
  realSplits.forEach((s, i) => {
    if (bestSplit === null || s < bestSplit) { bestSplit = s; bestSplitIndex = i + 1; }
    if (worstSplit === null || s > worstSplit) { worstSplit = s; worstSplitIndex = i + 1; }
  });
  const avgSplit = realSplits.length
    ? realSplits.reduce((a, b) => a + b, 0) / realSplits.length
    : null;

  // Cadenza sui soli colpi successivi al primo (esclude estrazione e reazione).
  const rateOfFire = count > 1 && totalTime > firstShot
    ? (count - 1) / (totalTime - firstShot)
    : null;

  const shotsInPar = parTime ? shots.filter(t => t <= parTime + 1e-9).length : count;

  return {
    count, splits, firstShot, totalTime,
    bestSplit, worstSplit, avgSplit, bestSplitIndex, worstSplitIndex,
    rateOfFire,
    shotsInPar,
    parExceeded: !!parTime && totalTime > parTime + 1e-9,
  };
}

/** Formatta un tempo in secondi con 2 decimali (risoluzione dei timer da gara). */
export function fmt(seconds, decimals = 2) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return '—';
  return seconds.toFixed(decimals);
}
