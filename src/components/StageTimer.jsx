import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Timer, Play, Square, Mic, MicOff, Settings2, Trash2, History, Info,
  Volume2, Hand, Plus, RotateCcw, ChevronDown, AlertTriangle, Check, Zap, Activity,
} from 'lucide-react';
import Modal from './Modal';
import {
  ShotTimerEngine, SENSITIVITY_THRESHOLDS, BEEP_GUARD_MS, isMicrophoneSupported,
} from '../utils/shotDetector';
import {
  loadSettings, saveSettings, getStrings, saveString, updateString, deleteString, clearStrings,
} from '../utils/timerStorage';
import { computeStats, fmt } from '../utils/timerStats';

/* ── Pezzi di UI riutilizzati nella pagina ──────────────────────────── */

function SectionTitle({ icon, children, onInfo, accent }) {
  return (
    <h2 style={{
      fontSize: '15px', fontWeight: 600, textTransform: 'uppercase',
      color: 'var(--text-secondary)', margin: 0,
      display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      {icon} {children}
      {onInfo && (
        <button onClick={onInfo} aria-label="Informazioni" style={{ color: accent, display: 'flex' }}>
          <Info size={16} />
        </button>
      )}
    </h2>
  );
}

function Segmented({ options, value, onChange, accent }) {
  return (
    <div style={{ display: 'flex', backgroundColor: 'var(--bg-color)', borderRadius: '10px', padding: '4px', gap: '2px' }}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '10px 8px', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
              backgroundColor: active ? 'var(--card-bg)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
              border: active ? `1px solid ${accent}` : '1px solid transparent',
              transition: 'var(--transition)',
            }}
          >
            {opt.icon} {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SettingRow({ label, hint, children }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.4 }}>{hint}</p>}
    </div>
  );
}

function NumberField({ value, onChange, min, max, step = 0.1, suffix, disabled }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '12px 46px 12px 14px', fontSize: '16px', fontWeight: 600,
          opacity: disabled ? 0.5 : 1,
        }}
      />
      {suffix && (
        <span style={{ position: 'absolute', right: '14px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', pointerEvents: 'none' }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

function StatBox({ label, value, unit, color, big }) {
  return (
    <div style={{
      background: 'var(--bg-color)', borderRadius: '12px', padding: big ? '14px 10px' : '12px 8px',
      border: '1px solid var(--border-color)', textAlign: 'center', minWidth: 0,
    }}>
      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{
        fontSize: big ? '25px' : '19px', fontWeight: 800, lineHeight: 1.1,
        color: color || 'var(--text-primary)', fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
        {unit && <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}> {unit}</span>}
      </div>
    </div>
  );
}

/**
 * Orologio che scorre. Vive in un componente separato cosi' il refresh a ogni
 * frame non ridisegna tutta la pagina (elenco colpi, storico, impostazioni).
 */
function RunningTime({ engineRef, t0Ref, active }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    let raf = 0;
    const loop = () => {
      const engine = engineRef.current;
      if (engine) setT(Math.max(0, engine.currentTime - t0Ref.current));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, engineRef, t0Ref]);
  return <>{fmt(t)}</>;
}

/* ── Cronometro ─────────────────────────────────────────────────────── */

export default function StageTimer({
  accent = 'var(--accent-color)',
  accentGlow = 'rgba(0, 122, 255, 0.35)',
  onUseTime,
}) {
  const [settings, setSettings] = useState(loadSettings);
  const [phase, setPhase] = useState('idle');       // idle | standby | running | stopped
  const [shots, setShots] = useState([]);
  const [micState, setMicState] = useState('off');  // off | requesting | on | error
  const [micError, setMicError] = useState(null);
  const [level, setLevel] = useState(0);
  const [flash, setFlash] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [history, setHistory] = useState(() => getStrings());
  const [openStringId, setOpenStringId] = useState(null);
  const [usedTime, setUsedTime] = useState(null);

  const engineRef = useRef(null);
  const t0Ref = useRef(0);            // istante zero (clock AudioContext) = beep di partenza
  const phaseRef = useRef('idle');
  const shotsRef = useRef([]);
  const savedStringIdRef = useRef(null);
  const timeoutsRef = useRef([]);
  const wakeLockRef = useRef(null);
  const calibPeakRef = useRef(0);

  const micSupported = isMicrophoneSupported();
  const threshold = SENSITIVITY_THRESHOLDS[settings.sensitivity - 1];
  const parTime = settings.parEnabled ? Number(settings.parTime) || 0 : 0;
  const stats = useMemo(() => computeStats(shots, parTime || null), [shots, parTime]);
  const isLive = phase === 'standby' || phase === 'running';

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { shotsRef.current = shots; }, [shots]);
  useEffect(() => { saveSettings(settings); }, [settings]);

  const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  /* ── Motore audio ─────────────────────────────────────────────── */

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      const engine = new ShotTimerEngine();
      engine.onLevel = (peak) => {
        setLevel(peak);
        if (peak > calibPeakRef.current) calibPeakRef.current = peak;
      };
      engine.onShot = ({ time }) => {
        if (phaseRef.current !== 'running') return;
        const rel = time - t0Ref.current;
        if (rel <= 0) return;
        setShots(prev => [...prev, rel]);
      };
      engineRef.current = engine;
    }
    return engineRef.current;
  }, []);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const releaseWakeLock = () => {
    try { wakeLockRef.current?.release(); } catch { /* gia' rilasciato */ }
    wakeLockRef.current = null;
  };

  useEffect(() => () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    try { wakeLockRef.current?.release(); } catch { /* gia' rilasciato */ }
    wakeLockRef.current = null;
    engineRef.current?.close();
    engineRef.current = null;
  }, []);

  // Sensibilita' e anti-eco vanno propagati al worklet anche a stringa in corso.
  useEffect(() => {
    engineRef.current?.setConfig({ threshold, deadTimeMs: Number(settings.deadTimeMs) || 110 });
  }, [threshold, settings.deadTimeMs]);

  const enableMic = useCallback(async () => {
    const engine = getEngine();
    setMicState('requesting');
    setMicError(null);
    try {
      await engine.enableMicrophone();
      engine.setConfig({ threshold, deadTimeMs: Number(settings.deadTimeMs) || 110 });
      setMicState('on');
      return true;
    } catch (err) {
      setMicState('error');
      setMicError(
        err && err.name === 'NotAllowedError'
          ? 'Permesso microfono negato. Autorizzalo dalle impostazioni del browser oppure passa alla modalita manuale.'
          : (err?.message || 'Impossibile accedere al microfono.')
      );
      return false;
    }
  }, [getEngine, threshold, settings.deadTimeMs]);

  const disableMic = () => {
    engineRef.current?.disableMicrophone();
    setMicState('off');
    setLevel(0);
  };

  /* ── Avvio / arresto ──────────────────────────────────────────── */

  const handleStart = useCallback(async () => {
    const engine = getEngine();
    clearTimeouts();
    setShots([]);
    shotsRef.current = [];
    savedStringIdRef.current = null;
    setUsedTime(null);
    setPhase('standby');
    phaseRef.current = 'standby';

    try {
      await engine.ensureContext();
    } catch (err) {
      setMicError(err.message);
      setPhase('idle');
      phaseRef.current = 'idle';
      return;
    }

    if (settings.inputMode === 'mic' && !engine.micActive) {
      const ok = await enableMic();
      if (!ok) {
        setPhase('idle');
        phaseRef.current = 'idle';
        return;
      }
    }

    // Il ritardo casuale e' il cuore del timer: impedisce di anticipare il via.
    // In IPSC il segnale di partenza arriva 1-4 s dopo il comando "Stand by".
    let delay;
    if (settings.delayMode === 'instant') delay = 0.15;
    else if (settings.delayMode === 'fixed') delay = Math.max(0, Number(settings.delayFixed) || 0);
    else {
      const min = Math.max(0, Number(settings.delayMin) || 0);
      const max = Math.max(min, Number(settings.delayMax) || min);
      delay = min + Math.random() * (max - min);
    }

    const beepMs = Number(settings.beepMs) || 250;
    const beepAt = engine.currentTime + delay;
    engine.scheduleBeep(beepAt, { durationMs: beepMs, volume: Number(settings.beepVolume) });

    // Zero del cronometro = uscita del beep dall'altoparlante. Il beep viene
    // schedulato sul clock audio, quindi va aggiunta la latenza di uscita della
    // scheda (piu' l'eventuale correzione manuale) per allinearlo ai colpi in ingresso.
    t0Ref.current = beepAt + engine.outputLatency + (Number(settings.calibrationMs) || 0) / 1000;

    // Il microfono resta sordo finche' il nostro stesso beep non e' finito,
    // altrimenti verrebbe contato come primo colpo.
    if (settings.inputMode === 'mic') {
      engine.arm(t0Ref.current + beepMs / 1000 + BEEP_GUARD_MS / 1000);
    }

    if (parTime > 0) {
      engine.scheduleBeep(t0Ref.current + parTime, {
        durationMs: beepMs, volume: Number(settings.beepVolume), freq: 1800,
      });
    }

    timeoutsRef.current.push(setTimeout(() => {
      setPhase('running');
      phaseRef.current = 'running';
      if (settings.visualStart) {
        setFlash(true);
        timeoutsRef.current.push(setTimeout(() => setFlash(false), 260));
      }
      if (settings.vibrate && navigator.vibrate) navigator.vibrate(120);
    }, Math.max(0, (beepAt - engine.currentTime) * 1000)));

    try {
      if ('wakeLock' in navigator) wakeLockRef.current = await navigator.wakeLock.request('screen');
    } catch { /* wake lock non disponibile su questo dispositivo */ }
  }, [getEngine, enableMic, settings, parTime]);

  const handleStop = useCallback(() => {
    clearTimeouts();
    engineRef.current?.disarm();
    // Uno stop durante lo stand by (o prima del par) non deve lasciare beep in coda.
    engineRef.current?.cancelScheduledBeeps();
    releaseWakeLock();
    setFlash(false);

    const wasRunning = phaseRef.current === 'running';
    setPhase(wasRunning ? 'stopped' : 'idle');
    phaseRef.current = wasRunning ? 'stopped' : 'idle';

    // Il tempo valido e' quello dell'ultimo colpo: lo STOP chiude l'ascolto,
    // non prolunga il cronometro.
    if (wasRunning && shotsRef.current.length > 0) {
      const entry = saveString({
        shots: shotsRef.current,
        parTime: parTime || null,
        inputMode: settings.inputMode,
      });
      savedStringIdRef.current = entry.id;
      setHistory(getStrings());
    }
  }, [parTime, settings.inputMode]);

  const handleReset = () => {
    clearTimeouts();
    engineRef.current?.disarm();
    engineRef.current?.cancelScheduledBeeps();
    releaseWakeLock();
    setShots([]);
    shotsRef.current = [];
    savedStringIdRef.current = null;
    setUsedTime(null);
    setPhase('idle');
    phaseRef.current = 'idle';
  };

  /** Colpo battuto a mano (modalita manuale o colpo sfuggito al microfono). */
  const addManualShot = useCallback(() => {
    if (phaseRef.current !== 'running') return;
    const engine = engineRef.current;
    if (!engine) return;
    const rel = engine.currentTime - t0Ref.current;
    if (rel <= 0) return;
    setShots(prev => [...prev, rel]);
    if (settings.vibrate && navigator.vibrate) navigator.vibrate(20);
  }, [settings.vibrate]);

  /** Elimina un colpo spurio (eco, plate colpita, sparo del tiratore accanto). */
  const removeShot = (index) => {
    const next = shots.filter((_, i) => i !== index);
    setShots(next);
    shotsRef.current = next;
    if (savedStringIdRef.current) {
      if (next.length === 0) {
        deleteString(savedStringIdRef.current);
        savedStringIdRef.current = null;
      } else {
        updateString(savedStringIdRef.current, next);
      }
      setHistory(getStrings());
    }
  };

  // Barra spaziatrice: start/stop. In modalita manuale batte i colpi durante la stringa.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (phaseRef.current === 'running' && settings.inputMode === 'manual') addManualShot();
      else if (phaseRef.current === 'standby' || phaseRef.current === 'running') handleStop();
      else handleStart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleStart, handleStop, addManualShot, settings.inputMode]);

  /* ── Taratura automatica della sensibilita ────────────────────── */

  const handleAutoCalibrate = async () => {
    if (micState !== 'on') {
      const ok = await enableMic();
      if (!ok) return;
    }
    setCalibrating(true);
    calibPeakRef.current = 0;
    timeoutsRef.current.push(setTimeout(() => {
      const ambient = calibPeakRef.current;
      // Serve un buon margine sopra il rumore di fondo per non contare voci e vento.
      const target = Math.max(ambient * 3.5, 0.05);
      let best = 1;
      for (let i = SENSITIVITY_THRESHOLDS.length - 1; i >= 0; i--) {
        if (SENSITIVITY_THRESHOLDS[i] >= target) { best = i + 1; break; }
      }
      updateSetting('sensitivity', best);
      setCalibrating(false);
    }, 2500));
  };

  const handleTestBeep = async () => {
    const engine = getEngine();
    try {
      await engine.ensureContext();
      engine.scheduleBeep(engine.currentTime + 0.05, {
        durationMs: Number(settings.beepMs) || 250,
        volume: Number(settings.beepVolume),
      });
      if (settings.vibrate && navigator.vibrate) navigator.vibrate(120);
    } catch { /* contesto audio non disponibile */ }
  };

  const handleUseTime = (seconds) => {
    if (!onUseTime) return;
    onUseTime(seconds);
    setUsedTime(seconds);
  };

  /* ── Rendering ────────────────────────────────────────────────── */

  const statusLabel = { idle: 'Pronto', standby: 'Stand by...', running: 'In corso', stopped: 'Stringa conclusa' }[phase];
  const statusColor = { idle: 'var(--text-secondary)', standby: '#FF9F0A', running: '#34C759', stopped: accent }[phase];
  const borderColor = phase === 'running' ? '#34C759' : phase === 'standby' ? '#FF9F0A' : 'var(--border-color)';
  const tapToShoot = phase === 'running' && settings.inputMode === 'manual';

  return (
    <div className="timer-grid fade-in">
      {flash && <div className="timer-flash" />}

      {/* ── COLONNA PRINCIPALE ── */}
      <div className="timer-main">

        {/* DISPLAY */}
        <div
          className="card"
          onClick={() => { if (tapToShoot) addManualShot(); }}
          style={{
            marginBottom: '20px', textAlign: 'center', padding: '28px 24px',
            border: `2px solid ${borderColor}`, transition: 'border-color 0.3s ease',
            cursor: tapToShoot ? 'pointer' : 'default',
          }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px',
            borderRadius: '20px', background: 'var(--bg-color)', border: '1px solid var(--border-color)',
            fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
            color: statusColor, marginBottom: '14px',
          }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%', background: statusColor,
              animation: isLive ? 'timerPulse 1s infinite' : 'none',
            }} />
            {statusLabel}
          </div>

          <div style={{
            fontSize: 'clamp(54px, 15vw, 88px)', fontWeight: 800, lineHeight: 1,
            letterSpacing: '-2px', fontVariantNumeric: 'tabular-nums',
            color: phase === 'standby' ? 'var(--text-secondary)' : accent,
          }}>
            {phase === 'standby'
              ? '– – –'
              : (stats.count > 0
                ? fmt(stats.totalTime)
                : <RunningTime engineRef={engineRef} t0Ref={t0Ref} active={phase === 'running'} />)}
            <span style={{ fontSize: '0.32em', fontWeight: 700, color: 'var(--text-secondary)', marginLeft: '6px' }}>s</span>
          </div>

          <div style={{ minHeight: '24px', marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {stats.count > 0 && (
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Colpo <strong style={{ color: 'var(--text-primary)' }}>{stats.count}</strong>
                {stats.count > 1 && <> · split <strong style={{ color: 'var(--text-primary)' }}>{fmt(stats.splits[stats.count - 1])}</strong>s</>}
              </span>
            )}
            {phase === 'running' && stats.count > 0 && (
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                Trascorso <RunningTime engineRef={engineRef} t0Ref={t0Ref} active />s
              </span>
            )}
            {parTime > 0 && (
              <span style={{ fontSize: '14px', fontWeight: 700, color: stats.parExceeded ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
                Par {fmt(parTime)}s{stats.parExceeded ? ' · superato' : ''}
              </span>
            )}
          </div>

          {phase === 'stopped' && stats.count === 0 && (
            <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--danger-color)', fontWeight: 600 }}>
              Nessun colpo rilevato: alza la sensibilita oppure passa alla modalita manuale.
            </p>
          )}

          {/* AZIONI */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
            <button
              onClick={(e) => { e.stopPropagation(); if (isLive) handleStop(); else handleStart(); }}
              style={{
                flex: '1 1 200px', padding: '20px', fontSize: '19px', fontWeight: 800, color: '#FFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                background: isLive ? 'var(--danger-color)' : '#34C759',
                borderRadius: 'var(--border-radius-lg)', letterSpacing: '0.5px',
                boxShadow: isLive ? '0 8px 24px rgba(255,59,48,0.35)' : '0 8px 24px rgba(52,199,89,0.35)',
              }}
            >
              {isLive ? <><Square size={22} fill="#FFF" /> STOP</> : <><Play size={22} fill="#FFF" /> START</>}
            </button>

            {phase === 'running' && (
              <button
                onClick={(e) => { e.stopPropagation(); addManualShot(); }}
                style={{
                  flex: '1 1 120px', padding: '20px 24px', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--bg-color)',
                  borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)',
                }}
              >
                <Plus size={20} /> Colpo
              </button>
            )}

            {phase === 'stopped' && (
              <button
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                style={{
                  flex: '1 1 120px', padding: '20px 24px', fontSize: '16px', fontWeight: 700, color: 'var(--danger-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--card-bg)',
                  borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)',
                }}
              >
                <RotateCcw size={20} /> Azzera
              </button>
            )}
          </div>

          <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, minHeight: '18px' }}>
            {tapToShoot
              ? 'Tocca il riquadro (o premi Spazio) a ogni colpo'
              : phase === 'idle' ? 'Barra spaziatrice per avviare e fermare' : ''}
          </p>
        </div>

        {/* DATI DELLA STRINGA */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <SectionTitle icon={<Timer size={18} />} accent={accent} onInfo={() => setShowInfo(true)}>
              Dati della stringa
            </SectionTitle>
          </div>
          <div className="timer-stats-grid">
            <StatBox label="1° colpo" value={fmt(stats.firstShot)} unit="s" color={accent} big />
            <StatBox label="Tempo totale" value={fmt(stats.totalTime)} unit="s" color={accent} big />
            <StatBox label="Colpi" value={stats.count} big />
            <StatBox label="Split medio" value={fmt(stats.avgSplit)} unit="s" />
            <StatBox label="Split migliore" value={fmt(stats.bestSplit)} unit="s" color="#34C759" />
            <StatBox label="Split peggiore" value={fmt(stats.worstSplit)} unit="s" color="#FF9F0A" />
            <StatBox label="Cadenza" value={stats.rateOfFire ? stats.rateOfFire.toFixed(2) : '—'} unit="c/s" />
            {parTime > 0 && (
              <StatBox
                label="Entro il par"
                value={`${stats.shotsInPar}/${stats.count}`}
                color={stats.parExceeded ? 'var(--danger-color)' : '#34C759'}
              />
            )}
          </div>

          {onUseTime && phase === 'stopped' && stats.count > 0 && (
            <button
              onClick={() => handleUseTime(stats.totalTime)}
              style={{
                width: '100%', marginTop: '18px', padding: '16px', fontSize: '16px', fontWeight: 700,
                color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                background: usedTime !== null ? '#34C759' : accent, borderRadius: 'var(--border-radius-lg)',
                boxShadow: `0 4px 12px ${accentGlow}`,
              }}
            >
              {usedTime !== null
                ? <><Check size={20} /> Tempo {fmt(usedTime)}s inserito nel calcolo</>
                : <><Zap size={20} /> Usa {fmt(stats.totalTime)}s nel calcolo punteggio</>}
            </button>
          )}
        </div>

        {/* ELENCO COLPI */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <SectionTitle icon={<Activity size={18} />} accent={accent}>Colpi ({stats.count})</SectionTitle>
          </div>
          {stats.count === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', padding: '18px 0' }}>
              Nessun colpo registrato.
            </p>
          ) : (
            <div className="timer-shot-list">
              {shots.map((t, i) => {
                const isBest = i === stats.bestSplitIndex && stats.count > 2;
                const isWorst = i === stats.worstSplitIndex && stats.count > 2;
                const afterPar = parTime > 0 && t > parTime;
                return (
                  <div key={i} className="timer-shot-row" style={{ borderLeftColor: afterPar ? 'var(--danger-color)' : 'transparent' }}>
                    <span className="timer-shot-num">{i + 1}</span>
                    <span style={{ fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', minWidth: '62px' }}>
                      {fmt(t)}<span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>s</span>
                    </span>
                    <span style={{
                      flex: 1, fontSize: '14px', fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                      color: isBest ? '#34C759' : isWorst ? '#FF9F0A' : 'var(--text-secondary)',
                    }}>
                      {i === 0 ? 'estrazione' : `split ${fmt(stats.splits[i])}s`}
                      {isBest ? ' ▼' : isWorst ? ' ▲' : ''}
                    </span>
                    {phase === 'stopped' && (
                      <button onClick={() => removeShot(i)} aria-label={`Elimina colpo ${i + 1}`} style={{ color: 'var(--text-secondary)', display: 'flex', padding: '4px' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {phase === 'stopped' && stats.count > 0 && (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: 1.5 }}>
              Elimina un colpo se il microfono ha captato un eco, una plate o lo sparo del tiratore accanto:
              il tempo totale viene ricalcolato sull'ultimo colpo rimasto.
            </p>
          )}
        </div>
      </div>

      {/* ── COLONNA LATERALE ── */}
      <div className="timer-side">

        {/* RILEVAMENTO */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <SectionTitle icon={<Settings2 size={18} />} accent={accent}>Rilevamento colpi</SectionTitle>
          </div>

          <Segmented
            accent={accent}
            value={settings.inputMode}
            onChange={(v) => { if (!isLive) updateSetting('inputMode', v); }}
            options={[
              { value: 'mic', label: 'Microfono', icon: <Mic size={16} /> },
              { value: 'manual', label: 'Manuale', icon: <Hand size={16} /> },
            ]}
          />

          {settings.inputMode === 'manual' && (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '14px', lineHeight: 1.5 }}>
              Ogni tocco sul display (o la barra spaziatrice) registra un colpo. Utile quando il microfono
              del telefono satura, in poligoni affollati o per contare a mano dal video.
            </p>
          )}

          {settings.inputMode === 'mic' && !micSupported && (
            <div style={{
              display: 'flex', gap: '8px', marginTop: '16px', padding: '12px', borderRadius: '10px',
              background: 'rgba(255,159,10,0.12)', color: '#FF9F0A', fontSize: '13px', fontWeight: 600,
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              Microfono non disponibile: serve una connessione HTTPS. Usa la modalita manuale.
            </div>
          )}

          {settings.inputMode === 'mic' && micSupported && (
            <div style={{ marginTop: '16px' }}>
              <button
                onClick={() => (micState === 'on' ? disableMic() : enableMic())}
                disabled={micState === 'requesting' || isLive}
                style={{
                  width: '100%', padding: '12px', fontSize: '15px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  borderRadius: '12px', border: '1px solid var(--border-color)',
                  background: micState === 'on' ? 'rgba(52,199,89,0.12)' : 'var(--bg-color)',
                  color: micState === 'on' ? '#34C759' : 'var(--text-secondary)',
                  opacity: isLive ? 0.6 : 1,
                }}
              >
                {micState === 'on' ? <Mic size={18} /> : <MicOff size={18} />}
                {micState === 'requesting' ? 'Richiesta permesso...' : micState === 'on' ? 'Microfono attivo' : 'Attiva microfono'}
              </button>

              {micError && (
                <p style={{ fontSize: '12.5px', color: 'var(--danger-color)', marginTop: '10px', lineHeight: 1.45, fontWeight: 600 }}>
                  {micError}
                </p>
              )}

              <div style={{ marginTop: '16px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <span>Livello microfono</span>
                  <span>Soglia {(threshold * 100).toFixed(0)}%</span>
                </div>
                <div style={{ position: 'relative', height: '10px', background: 'var(--bg-color)', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <div style={{
                    width: `${Math.min(100, level * 100)}%`, height: '100%',
                    background: level >= threshold ? 'var(--danger-color)' : '#34C759',
                    transition: 'width 0.08s linear',
                  }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${threshold * 100}%`, width: '2px', background: 'var(--text-primary)', opacity: 0.7 }} />
                </div>
              </div>

              <SettingRow
                label={`Sensibilita: ${settings.sensitivity}/8`}
                hint="1 = sorda, ignora i tiratori delle piazzole vicine. 8 = sensibilissima, per calibri leggeri o al chiuso."
              >
                <input
                  type="range" min="1" max="8" step="1"
                  value={settings.sensitivity}
                  onChange={(e) => updateSetting('sensitivity', Number(e.target.value))}
                  style={{ width: '100%', accentColor: accent }}
                />
                <button
                  onClick={handleAutoCalibrate}
                  disabled={calibrating || isLive}
                  style={{
                    width: '100%', marginTop: '10px', padding: '10px', fontSize: '13.5px', fontWeight: 700,
                    borderRadius: '10px', border: '1px solid var(--border-color)',
                    background: 'var(--bg-color)', color: calibrating ? '#FF9F0A' : 'var(--text-secondary)',
                  }}
                >
                  {calibrating ? 'Ascolto il rumore di fondo…' : 'Taratura automatica (2,5 s di silenzio)'}
                </button>
              </SettingRow>
            </div>
          )}
        </div>

        {/* PARTENZA E PAR */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <SectionTitle icon={<Timer size={18} />} accent={accent}>Partenza e par time</SectionTitle>
          </div>

          <SettingRow label="Ritardo prima del beep">
            <Segmented
              accent={accent}
              value={settings.delayMode}
              onChange={(v) => updateSetting('delayMode', v)}
              options={[
                { value: 'random', label: 'Random' },
                { value: 'fixed', label: 'Fisso' },
                { value: 'instant', label: 'Subito' },
              ]}
            />
          </SettingRow>

          {settings.delayMode === 'random' && (
            <SettingRow
              label="Intervallo casuale"
              hint="Regolamento IPSC: il segnale di partenza arriva 1-4 secondi dopo lo Stand by. Il ritardo variabile impedisce al tiratore di anticipare il via."
            >
              <div style={{ display: 'flex', gap: '10px' }}>
                <NumberField value={settings.delayMin} onChange={(v) => updateSetting('delayMin', v)} min={0} max={10} step={0.5} suffix="min" />
                <NumberField value={settings.delayMax} onChange={(v) => updateSetting('delayMax', v)} min={0} max={15} step={0.5} suffix="max" />
              </div>
            </SettingRow>
          )}

          {settings.delayMode === 'fixed' && (
            <SettingRow label="Ritardo fisso" hint="Attenzione: un ritardo sempre uguale insegna ad anticipare il beep invece che a reagire.">
              <NumberField value={settings.delayFixed} onChange={(v) => updateSetting('delayFixed', v)} min={0} max={15} step={0.5} suffix="s" />
            </SettingRow>
          )}

          <SettingRow label="Par time" hint="Secondo beep allo scadere del tempo impostato, per gli esercizi a tempo prefissato.">
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => updateSetting('parEnabled', !settings.parEnabled)}
                style={{
                  padding: '12px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
                  border: '1px solid var(--border-color)', flexShrink: 0,
                  background: settings.parEnabled ? accent : 'var(--bg-color)',
                  color: settings.parEnabled ? '#FFF' : 'var(--text-secondary)',
                }}
              >
                {settings.parEnabled ? 'ON' : 'OFF'}
              </button>
              <NumberField
                value={settings.parTime}
                onChange={(v) => updateSetting('parTime', v)}
                min={0.5} max={120} step={0.5} suffix="s"
                disabled={!settings.parEnabled}
              />
            </div>
          </SettingRow>

          <button
            onClick={() => setShowAdvanced(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '10px', fontSize: '13.5px', fontWeight: 700, color: 'var(--text-secondary)',
              background: 'var(--bg-color)', borderRadius: '10px', border: '1px solid var(--border-color)',
            }}
          >
            Impostazioni avanzate
            <ChevronDown size={16} style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {showAdvanced && (
            <div className="fade-in" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '18px', marginTop: '18px' }}>
              <SettingRow
                label={`Anti-eco (tempo morto): ${settings.deadTimeMs} ms`}
                hint="I picchi che arrivano entro questa finestra dopo un colpo sono considerati eco dello stesso sparo. Sui timer da gara il valore tipico e 100-110 ms."
              >
                <input
                  type="range" min="20" max="300" step="10"
                  value={settings.deadTimeMs}
                  onChange={(e) => updateSetting('deadTimeMs', Number(e.target.value))}
                  style={{ width: '100%', accentColor: accent }}
                />
              </SettingRow>

              <SettingRow label={`Volume beep: ${Math.round(settings.beepVolume * 100)}%`}>
                <input
                  type="range" min="0.1" max="1" step="0.05"
                  value={settings.beepVolume}
                  onChange={(e) => updateSetting('beepVolume', Number(e.target.value))}
                  style={{ width: '100%', accentColor: accent }}
                />
                <button
                  onClick={handleTestBeep}
                  style={{
                    width: '100%', marginTop: '10px', padding: '10px', fontSize: '13.5px', fontWeight: 700,
                    borderRadius: '10px', border: '1px solid var(--border-color)',
                    background: 'var(--bg-color)', color: 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  <Volume2 size={16} /> Prova il beep
                </button>
              </SettingRow>

              <SettingRow
                label={`Durata beep: ${settings.beepMs} ms`}
                hint="Durante il beep il microfono resta sordo, altrimenti conterebbe il beep stesso come primo colpo: un beep piu corto accorcia questa finestra cieca."
              >
                <input
                  type="range" min="150" max="600" step="50"
                  value={settings.beepMs}
                  onChange={(e) => updateSetting('beepMs', Number(e.target.value))}
                  style={{ width: '100%', accentColor: accent }}
                />
              </SettingRow>

              <SettingRow
                label={`Calibrazione: ${settings.calibrationMs > 0 ? '+' : ''}${settings.calibrationMs} ms`}
                hint="Correzione fine della latenza audio del dispositivo. Valori positivi accorciano i tempi misurati."
              >
                <input
                  type="range" min="-100" max="100" step="5"
                  value={settings.calibrationMs}
                  onChange={(e) => updateSetting('calibrationMs', Number(e.target.value))}
                  style={{ width: '100%', accentColor: accent }}
                />
              </SettingRow>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={settings.visualStart} onChange={(e) => updateSetting('visualStart', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: accent }} />
                  Lampeggio verde alla partenza
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={settings.vibrate} onChange={(e) => updateSetting('vibrate', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: accent }} />
                  Vibrazione, dove supportata
                </label>
              </div>
            </div>
          )}
        </div>

        {/* STORICO */}
        <div className="card" style={{ marginBottom: '0' }}>
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <SectionTitle icon={<History size={18} />} accent={accent}>Storico stringhe</SectionTitle>
            {history.length > 0 && (
              <button onClick={() => { clearStrings(); setHistory([]); }} style={{ color: 'var(--danger-color)', fontSize: '13px', fontWeight: 600 }}>
                Svuota
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', textAlign: 'center', padding: '12px 0' }}>
              Qui finiscono le ultime 25 stringhe cronometrate.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.map(entry => {
                const s = computeStats(entry.shots, entry.parTime);
                const open = openStringId === entry.id;
                return (
                  <div key={entry.id} style={{ background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px' }}>
                      <button onClick={() => setOpenStringId(open ? null : entry.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                        <span style={{ fontSize: '19px', fontWeight: 800, color: accent, fontVariantNumeric: 'tabular-nums' }}>
                          {fmt(s.totalTime)}<span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>s</span>
                        </span>
                        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.4 }}>
                          {s.count} colpi · 1° {fmt(s.firstShot)}s
                          <br />
                          {new Date(entry.savedAt).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </button>
                      <button onClick={() => { deleteString(entry.id); setHistory(getStrings()); }} aria-label="Elimina stringa" style={{ color: 'var(--text-secondary)', display: 'flex', padding: '4px' }}>
                        <Trash2 size={16} />
                      </button>
                      <ChevronDown size={18} style={{ color: 'var(--text-secondary)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>
                    {open && (
                      <div className="fade-in" style={{ padding: '0 14px 12px 14px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {entry.shots.map((t, i) => (
                          <span key={i} style={{
                            fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderRadius: '8px',
                            background: 'var(--card-bg)', border: '1px solid var(--border-color)',
                            fontVariantNumeric: 'tabular-nums',
                          }}>
                            {i + 1}: {fmt(t)}s
                            {i > 0 && <span style={{ color: 'var(--text-secondary)' }}> (+{fmt(s.splits[i])})</span>}
                          </span>
                        ))}
                        {onUseTime && (
                          <button
                            onClick={() => handleUseTime(s.totalTime)}
                            style={{ fontSize: '12px', fontWeight: 700, padding: '5px 10px', borderRadius: '8px', background: accent, color: '#FFF' }}
                          >
                            Usa {fmt(s.totalTime)}s
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <TimerInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
    </div>
  );
}

function TimerInfoModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Come funziona il cronometro" maxWidth="640px">
      <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px', fontSize: '14.5px', lineHeight: 1.6 }}>
        <p style={{ marginBottom: '12px' }}>
          Il timer riproduce il comportamento dei cronometri da gara (CED7000, PACT, Kestrel,
          Shooters Global). La sequenza e sempre la stessa:
        </p>
        <ol style={{ paddingLeft: '20px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><strong>Stand by</strong> — premuto START parte un ritardo <strong>casuale</strong>, di norma 1-4 secondi come previsto dal regolamento IPSC dopo il comando "Stand by". E casuale apposta: un ritardo fisso insegnerebbe ad anticipare il via invece che a reagire.</li>
          <li><strong>Beep di partenza</strong> — un tono acuto intorno ai 2,5 kHz. L'istante in cui parte il beep e lo <strong>zero</strong> del cronometro.</li>
          <li><strong>Ascolto</strong> — il microfono registra ogni picco sonoro sopra la soglia di sensibilita: quello e un colpo. Di ognuno restano il tempo dal via e lo <em>split</em> rispetto al colpo precedente.</li>
          <li><strong>Stop</strong> — il tempo valido e quello dell'<strong>ultimo colpo sparato</strong>. Premere STOP chiude la stringa ma non allunga il tempo: il cronometro si ferma di fatto a ogni colpo.</li>
        </ol>

        <h4 style={{ fontSize: '15px', marginBottom: '8px', color: 'var(--text-primary)' }}>I valori misurati</h4>
        <ul style={{ paddingLeft: '20px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <li><strong>Tempo del 1° colpo</strong> — reazione piu estrazione: il dato piu allenabile.</li>
          <li><strong>Split</strong> — intervallo fra due colpi consecutivi, cioe la velocita di ricollocazione della mira.</li>
          <li><strong>Tempo totale</strong> — dal beep all'ultimo colpo. E il tempo che entra nell'Hit Factor.</li>
          <li><strong>Split migliore, peggiore e cadenza</strong> — dove si perde tempo dentro la stringa.</li>
          <li><strong>Par time</strong> — secondo beep a un tempo prefissato, per gli esercizi a tempo chiuso.</li>
        </ul>

        <h4 style={{ fontSize: '15px', marginBottom: '8px', color: 'var(--text-primary)' }}>Sensibilita e anti-eco</h4>
        <p style={{ marginBottom: '16px' }}>
          La <strong>sensibilita</strong> e la soglia oltre la quale un rumore diventa un colpo: bassa in un poligono
          affollato, per non contare gli spari della piazzola accanto; alta al chiuso o con calibri leggeri.
          L'<strong>anti-eco</strong> e un tempo morto dopo ogni colpo, tipicamente 100-110 ms, entro il quale i
          rumori vengono ignorati: e cosi che si scartano rimbombi, plate colpite e code dello stesso sparo.
        </p>

        <div style={{
          fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-color)',
          padding: '12px', borderRadius: '10px', borderLeft: '4px solid var(--accent-color)',
        }}>
          <strong>Nota sulla precisione:</strong> un telefono non e un timer omologato. Il microfono satura,
          la latenza audio del dispositivo introduce qualche millisecondo di scarto e durante il beep il
          microfono resta volutamente sordo, quindi un colpo sparato entro circa 0,3 s dal via puo sfuggire.
          Ottimo per allenamento, prove e dry fire: per un tempo ufficiale di gara serve un timer omologato.
        </div>
      </div>
    </Modal>
  );
}
