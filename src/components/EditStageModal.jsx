import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import HitCounter from './HitCounter';
import { calculateHitFactor } from '../utils/scoring';
import {
  calculatePaladin, calculateDefensiveCount,
  PALADIN_PENALTIES, DEFENSIVE_PENALTIES, DEFENSIVE_POINTS_DOWN,
} from '../utils/lssaScoring';
import { computeStats, fmt } from '../utils/timerStats';
import { Timer, Trash2, Zap, Flame } from 'lucide-react';

const EMPTY_HITS = { A: 0, C: 0, D: 0, M: 0, NS: 0, PROC: 0 };
const EMPTY_PALADIN = { FTN: 0, PROC: 0, HNT: 0, FTE: 0, FTDR: 0 };
const EMPTY_DEFENSIVE_HITS = { ZERO: 0, DOWN2: 0, DOWN3: 0, MISS: 0 };
const EMPTY_DEFENSIVE_PEN = { PENALTY: 0, FTE: 0, PROC: 0, ANTISP: 0 };

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <h4 style={{
        fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px',
        color: 'var(--text-secondary)', marginBottom: '8px',
      }}>
        {title}
      </h4>
      {children}
    </div>
  );
}

/**
 * Modifica di uno stage gia' salvato in una gara.
 *
 * Il form rispecchia il calcolatore della disciplina dello stage, cosi' un
 * punteggio sbagliato si corregge senza cancellare e rifare la registrazione.
 * Il risultato viene ricalcolato al salvataggio con le stesse funzioni usate
 * dai calcolatori.
 *
 * Va montata solo quando c'e' uno stage da modificare, con `key={stage.id}`:
 * il form si inizializza al mount, senza effetti di sincronizzazione.
 */
export default function EditStageModal({ onClose, stage, discipline, onSave }) {
  const stageDiscipline = stage?.discipline || discipline;
  const isLssa = stageDiscipline === 'lssa';
  const accentVar = isLssa ? 'var(--lssa-accent)' : 'var(--accent-color)';
  const accentShadow = isLssa ? 'rgba(52,199,89,0.3)' : 'rgba(0,122,255,0.3)';

  const [stageNumber, setStageNumber] = useState(() => stage.stageNumber ?? 1);
  const [time, setTime] = useState(() => (stage.time != null ? String(stage.time) : ''));
  const [isMajor, setIsMajor] = useState(() => !!stage.isMajor);
  const [hits, setHits] = useState(() => ({ ...EMPTY_HITS, ...(stage.hits || {}) }));
  const [scoringMethod, setScoringMethod] = useState(() => stage.scoringMethod || 'paladin');
  const [paladinPenalties, setPaladinPenalties] = useState(() => ({ ...EMPTY_PALADIN, ...(stage.paladinPenalties || {}) }));
  const [defensiveHits, setDefensiveHits] = useState(() => ({ ...EMPTY_DEFENSIVE_HITS, ...(stage.defensiveHits || {}) }));
  const [defensivePenalties, setDefensivePenalties] = useState(() => ({ ...EMPTY_DEFENSIVE_PEN, ...(stage.defensivePenalties || {}) }));
  const [timerShots, setTimerShots] = useState(() => (stage.timer?.shots ? [...stage.timer.shots] : null));

  const result = useMemo(() => {
    const t = parseFloat(time) || 0;
    if (!isLssa) return calculateHitFactor(hits, t, isMajor);
    return scoringMethod === 'paladin'
      ? calculatePaladin(t, paladinPenalties)
      : calculateDefensiveCount(t, defensiveHits, defensivePenalties);
  }, [isLssa, time, hits, isMajor, scoringMethod, paladinPenalties, defensiveHits, defensivePenalties]);

  const timerStats = useMemo(
    () => (timerShots?.length ? computeStats(timerShots, stage.timer?.parTime) : null),
    [timerShots, stage]
  );

  /** Elimina un colpo spurio: il tempo torna a essere quello dell'ultimo colpo. */
  const handleRemoveShot = (index) => {
    const next = timerShots.filter((_, i) => i !== index);
    setTimerShots(next);
    if (next.length > 0) setTime(next[next.length - 1].toFixed(2));
  };

  const handleSubmit = () => {
    const t = parseFloat(time) || 0;
    const patch = {
      stageNumber: parseInt(stageNumber, 10) || 1,
      time: t,
      result,
      discipline: stageDiscipline,
    };

    if (isLssa) {
      patch.scoringMethod = scoringMethod;
      patch.paladinPenalties = paladinPenalties;
      patch.defensiveHits = defensiveHits;
      patch.defensivePenalties = defensivePenalties;
    } else {
      patch.hits = hits;
      patch.isMajor = isMajor;
    }

    if (stage.timer) {
      patch.timer = timerShots?.length ? { ...stage.timer, shots: timerShots } : null;
    }

    onSave(patch);
  };

  const timeField = (
    <Section title="Tempo (secondi)">
      <input
        type="number"
        inputMode="decimal"
        value={time}
        step="0.01"
        min="0"
        onChange={(e) => setTime(e.target.value)}
        placeholder="0.00"
        style={{ width: '100%', padding: '14px', fontSize: '22px', fontWeight: 700, textAlign: 'center' }}
      />
    </Section>
  );

  const counters = (obj, setter, rows) => rows.map(([key, label, description], i) => (
    <HitCounter
      key={key}
      label={label}
      description={description}
      value={obj[key]}
      onChange={(v) => setter(prev => ({ ...prev, [key]: v }))}
      colorVar={key === 'A' ? '--accent-color' : ['M', 'NS', 'PROC', 'MISS'].includes(key) ? '--danger-color' : undefined}
      isLast={i === rows.length - 1}
    />
  ));

  return (
    <Modal isOpen={true} onClose={onClose} title={`Modifica Stage ${stage.stageNumber}`} maxWidth="520px" hideFooter>
      <div style={{ maxHeight: '56vh', overflowY: 'auto', paddingRight: '6px' }}>

        <Section title="Numero stage">
          <input
            type="number"
            inputMode="numeric"
            value={stageNumber}
            min="1"
            onChange={(e) => setStageNumber(e.target.value)}
            style={{ width: '100px', padding: '10px 12px', fontSize: '16px', fontWeight: 700, textAlign: 'center' }}
          />
        </Section>

        {!isLssa && (
          <>
            <Section title="Power Factor">
              <div style={{ display: 'flex', background: 'var(--bg-color)', borderRadius: '10px', padding: '4px' }}>
                {[[false, 'Minor', <Zap key="z" size={16} />], [true, 'Major', <Flame key="f" size={16} />]].map(([val, label, icon]) => (
                  <button
                    key={label}
                    onClick={() => setIsMajor(val)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '10px', borderRadius: '8px', fontWeight: 600, fontSize: '15px',
                      background: isMajor === val ? 'var(--card-bg)' : 'transparent',
                      color: isMajor === val ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: isMajor === val ? 'var(--shadow-sm)' : 'none',
                    }}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </Section>

            {timeField}

            <Section title="Hits">
              {counters(hits, setHits, [
                ['A', 'Alpha (A)', '5 Points'],
                ['C', 'Charlie (C)', isMajor ? '4 Points' : '3 Points'],
                ['D', 'Delta (D)', isMajor ? '2 Points' : '1 Point'],
              ])}
            </Section>

            <Section title="Penalità">
              {counters(hits, setHits, [
                ['M', 'Miss (M)', '-10 Points'],
                ['NS', 'No-Shoot (NS)', '-10 Points'],
                ['PROC', 'Procedural', '-10 Points'],
              ])}
            </Section>
          </>
        )}

        {isLssa && (
          <>
            <Section title="Metodo di punteggio">
              <div style={{ display: 'flex', background: 'var(--bg-color)', borderRadius: '10px', padding: '4px' }}>
                {[['paladin', 'Paladin'], ['defensive', 'Defensive Count']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setScoringMethod(val)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
                      background: scoringMethod === val ? 'var(--card-bg)' : 'transparent',
                      color: scoringMethod === val ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: scoringMethod === val ? 'var(--shadow-sm)' : 'none',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Section>

            {timeField}

            {scoringMethod === 'paladin' ? (
              <Section title="Penalità Paladin">
                {counters(paladinPenalties, setPaladinPenalties, [
                  ['FTN', 'FTN', `+${PALADIN_PENALTIES.FTN}s`],
                  ['PROC', 'Procedura', `+${PALADIN_PENALTIES.PROC}s`],
                  ['HNT', 'HNT', `+${PALADIN_PENALTIES.HNT}s`],
                  ['FTE', 'FTE', `+${PALADIN_PENALTIES.FTE}s`],
                  ['FTDR', 'FTDR', `+${PALADIN_PENALTIES.FTDR}s`],
                ])}
              </Section>
            ) : (
              <>
                <Section title="Zone colpite">
                  {counters(defensiveHits, setDefensiveHits, [
                    ['ZERO', 'Zona -0', `${DEFENSIVE_POINTS_DOWN.ZERO} PD`],
                    ['DOWN2', 'Zona -2', `${DEFENSIVE_POINTS_DOWN.DOWN2} PD`],
                    ['DOWN3', 'Zona -3', `${DEFENSIVE_POINTS_DOWN.DOWN3} PD`],
                    ['MISS', 'Miss', `${DEFENSIVE_POINTS_DOWN.MISS} PD`],
                  ])}
                </Section>
                <Section title="Penalità">
                  {counters(defensivePenalties, setDefensivePenalties, [
                    ['PENALTY', 'Bersaglio penalty', `+${DEFENSIVE_PENALTIES.PENALTY}s`],
                    ['FTE', 'FTE', `+${DEFENSIVE_PENALTIES.FTE}s`],
                    ['PROC', 'Procedura', `+${DEFENSIVE_PENALTIES.PROC}s`],
                    ['ANTISP', 'Antisportiva', `+${DEFENSIVE_PENALTIES.ANTISP}s`],
                  ])}
                </Section>
              </>
            )}
          </>
        )}

        {timerStats && (
          <Section title="Stringa cronometrata">
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.5 }}>
              {timerStats.count} colpi · 1° {fmt(timerStats.firstShot)}s · split medio {fmt(timerStats.avgSplit)}s.
              Eliminando un colpo il tempo torna a quello dell'ultimo colpo rimasto.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {timerShots.map((t, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600,
                    padding: '4px 6px 4px 9px', borderRadius: '8px', background: 'var(--bg-color)',
                    border: '1px solid var(--border-color)', fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {i + 1}: {fmt(t)}s
                  {i > 0 && <span style={{ color: 'var(--text-secondary)' }}>(+{fmt(timerStats.splits[i])})</span>}
                  <button
                    onClick={() => handleRemoveShot(i)}
                    aria-label={`Elimina colpo ${i + 1}`}
                    style={{ color: 'var(--danger-color)', display: 'flex', padding: '2px' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
          </Section>
        )}

      </div>

      <div style={{ padding: '14px', marginTop: '16px', background: 'var(--bg-color)', borderRadius: '12px', textAlign: 'center', border: `1px solid ${accentVar}` }}>
        <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-secondary)' }}>
          Risultato aggiornato
        </span>
        <div style={{ fontSize: '30px', fontWeight: 800, color: accentVar, marginTop: '2px', lineHeight: 1.1 }}>
          {isLssa
            ? <>{result.totalTime.toFixed(2)}<span style={{ fontSize: '15px' }}> sec</span></>
            : <>HF {result.hitFactor.toFixed(4)}</>}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          {isLssa
            ? <>Tempo {result.rawTime.toFixed(2)}s{result.pointsDownTime > 0 && ` · PD +${result.pointsDownTime.toFixed(2)}s`}{result.penaltyTime > 0 && ` · pen. +${result.penaltyTime.toFixed(2)}s`}</>
            : <>{result.stageScore} punti{result.totalPenalties > 0 && ` · pen. -${result.totalPenalties}`}</>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
        <button
          onClick={onClose}
          style={{
            flex: '0 0 auto', padding: '14px 20px', borderRadius: 'var(--border-radius-md)',
            background: 'var(--bg-color)', border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)', fontWeight: 600, fontSize: '15px',
          }}
        >
          Annulla
        </button>
        <button
          onClick={handleSubmit}
          style={{
            flex: 1, padding: '14px', borderRadius: 'var(--border-radius-md)', background: accentVar,
            color: '#FFF', fontWeight: 700, fontSize: '16px', boxShadow: `0 4px 12px ${accentShadow}`,
          }}
        >
          Salva modifiche
        </button>
      </div>
    </Modal>
  );
}
