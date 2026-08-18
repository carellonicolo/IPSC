import React, { useState, useEffect, useMemo } from 'react';
import HitCounter from './components/HitCounter';
import Modal from './components/Modal';
import { calculateHitFactor } from './utils/scoring';
import { Timer, RefreshCcw, Activity, Info, Sun, Moon, BookOpen, Download, LayoutGrid, FileText, Zap, Flame, Crosshair, Trophy, Save } from 'lucide-react';
import ChronoCheck from './components/ChronoCheck';
import LandingPage from './components/LandingPage';
import LSSAScoreCalculator from './components/LSSAScoreCalculator';
import GareTab from './components/GareTab';
import SaveStageModal from './components/SaveStageModal';
import StageTimer from './components/StageTimer';

const GithubIcon = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

function App() {
  // Discipline selector: null = landing, 'ipsc' or 'lssa'
  const [discipline, setDiscipline] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('discipline') || null;
    }
    return null;
  });
  const [isMajor, setIsMajor] = useState(false);
  const [time, setTime] = useState('');
  const [hits, setHits] = useState({
    A: 0, C: 0, D: 0, M: 0, NS: 0, PROC: 0
  });

  const [activeModal, setActiveModal] = useState(null);
  const [rulesTab, setRulesTab] = useState('safety');
  const [activeTab, setActiveTab] = useState('score'); // 'score' | 'chrono' | 'timer' | 'gare'
  const [showSaveModal, setShowSaveModal] = useState(false);
  // Dettaglio della stringa cronometrata da allegare allo stage, quando il
  // salvataggio parte dal Timer invece che dallo Score Calculator.
  const [timerStage, setTimerStage] = useState(null);

  // Theme Management
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (discipline) {
      localStorage.setItem('discipline', discipline);
      document.documentElement.setAttribute('data-discipline', discipline);
    } else {
      localStorage.removeItem('discipline');
      document.documentElement.removeAttribute('data-discipline');
    }
  }, [discipline]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleBackToLanding = () => {
    setDiscipline(null);
  };

  const handleHitChange = (key, value) => {
    setHits(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setHits({ A: 0, C: 0, D: 0, M: 0, NS: 0, PROC: 0 });
    setTime('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Tempo cronometrato -> campo tempo del calcolatore di Hit Factor
  const handleTimerTime = (seconds) => {
    setTime(seconds.toFixed(2));
    setActiveTab('score');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Tempo cronometrato -> stage di una gara, con il dettaglio dei colpi allegato
  const handleSaveTimerStage = ({ totalTime, shots, parTime, inputMode }) => {
    setTime(totalTime.toFixed(2));
    setTimerStage({ shots, parTime, inputMode });
    setShowSaveModal(true);
  };

  const openSaveModal = () => {
    setTimerStage(null);
    setShowSaveModal(true);
  };

  const closeSaveModal = () => {
    setShowSaveModal(false);
    setTimerStage(null);
  };

  const result = useMemo(() => {
    return calculateHitFactor(hits, time || 0, isMajor);
  }, [hits, time, isMajor]);

  // Landing page
  if (!discipline) {
    return <LandingPage onSelect={setDiscipline} theme={theme} toggleTheme={toggleTheme} />;
  }

  // LSSA / FIIDS
  if (discipline === 'lssa') {
    return <LSSAScoreCalculator onBack={handleBackToLanding} theme={theme} toggleTheme={toggleTheme} />;
  }

  // IPSC (default)
  return (
    <div style={{ width: '100%' }}>
      {/* HEADER */}
      <header style={{ textAlign: 'center', marginBottom: '24px', paddingTop: '24px', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '16px', top: '12px' }}>
          <button
            onClick={handleBackToLanding}
            style={{ padding: '8px 14px', color: 'var(--accent-color)', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border-color)', backdropFilter: 'blur(10px)' }}
          >
            ← Indietro
          </button>
        </div>
        <button
          onClick={toggleTheme}
          style={{ position: 'absolute', right: '16px', top: '12px', padding: '8px', color: 'var(--text-secondary)' }}
          aria-label="Toggle Tema"
        >
          {theme === 'dark' ? <Sun size={26} strokeWidth={2.5} /> : <Moon size={26} strokeWidth={2.5} />}
        </button>

        <div className="flex-center" style={{ gap: '12px', marginBottom: '8px', paddingTop: '4px' }}>
          <img src="/icon.svg" alt="IPSC Logo" width="40" height="40" style={{ borderRadius: '10px', boxShadow: 'var(--shadow-md)' }} />
          <h1 style={{ fontSize: '36px', letterSpacing: '-0.8px' }}>IPSC Score</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 600 }}>
          Hit Factor Calculator
        </p>

        {/* MAIN TAB SWITCHER */}
        <div className="main-tab-container" style={{ maxWidth: '720px', margin: '20px auto 0 auto', padding: '0 16px' }}>
          <div className="main-tab-switcher">
            <button
              onClick={() => setActiveTab('score')}
              className={`main-tab-btn ${activeTab === 'score' ? 'main-tab-active' : ''}`}
            >
              <Activity size={18} />
              <span className="tab-label-full">Score Calculator</span>
              <span className="tab-label-short">Score</span>
            </button>
            <button
              onClick={() => setActiveTab('chrono')}
              className={`main-tab-btn ${activeTab === 'chrono' ? 'main-tab-active' : ''}`}
            >
              <Crosshair size={18} />
              <span className="tab-label-full">Chrono Check</span>
              <span className="tab-label-short">Chrono</span>
            </button>
            <button
              onClick={() => setActiveTab('timer')}
              className={`main-tab-btn ${activeTab === 'timer' ? 'main-tab-active' : ''}`}
            >
              <Timer size={18} />
              <span className="tab-label-full">Timer Stage</span>
              <span className="tab-label-short">Timer</span>
            </button>
            <button
              onClick={() => setActiveTab('gare')}
              className={`main-tab-btn ${activeTab === 'gare' ? 'main-tab-active' : ''}`}
            >
              <Trophy size={18} />
              <span className="tab-label-full">Gare</span>
              <span className="tab-label-short">Gare</span>
            </button>
          </div>
        </div>

        {/* HEADER TOOLBAR LInks/Modals */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', maxWidth: '600px', margin: '16px auto 0 auto', padding: '0 16px' }}>
          {/* Sx - Regolamenti */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setActiveModal('rules')} className="toolbar-btn">
              <BookOpen size={16} /> Regole IPSC
            </button>
            <button onClick={() => setActiveModal('downloads')} className="toolbar-btn">
              <Download size={16} /> Scarica PDF
            </button>
          </div>
          {/* Dx - Esterni */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="https://github.com/nicolocarello/IPSC" target="_blank" rel="noopener noreferrer" className="toolbar-btn">
              <GithubIcon size={16} /> Github
            </a>
            <a href="https://apps.nicolocarello.it" target="_blank" rel="noopener noreferrer" className="toolbar-btn">
              <LayoutGrid size={16} /> Altre Apps
            </a>
          </div>
        </div>
      </header>

      {/* CORE LAYOUT */}
      {activeTab === 'chrono' && (
        <div className="fade-in" style={{ padding: '0 16px', paddingBottom: '40px' }}>
          <ChronoCheck />
        </div>
      )}

      {activeTab === 'timer' && (
        <div className="fade-in" style={{ padding: '0 16px', paddingBottom: '40px' }}>
          <StageTimer
            onUseTime={handleTimerTime}
            onSaveToMatch={handleSaveTimerStage}
            scorePreview={(seconds) => {
              const r = calculateHitFactor(hits, seconds, isMajor);
              return `HF ${r.hitFactor.toFixed(4)} · ${r.stageScore} punti${r.totalPenalties > 0 ? ` (pen. -${r.totalPenalties})` : ''}`;
            }}
          />
        </div>
      )}

      {activeTab === 'gare' && (
        <div className="fade-in" style={{ padding: '0 16px', paddingBottom: '40px' }}>
          <GareTab discipline="ipsc" />
        </div>
      )}

      {activeTab === 'score' && <div className="app-grid fade-in">
        
        {/* COLONNA SINISTRA (Hits / Penalties) */}
        <div className="grid-left" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ 
              fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', 
              color: 'var(--text-secondary)', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              Hits
              <button onClick={() => setActiveModal('hits')} aria-label="Info Hits" style={{ color: 'var(--accent-color)' }}><Info size={16} /></button>
            </h2>
            <HitCounter label="Alpha (A)" description="5 Points" value={hits.A} onChange={(val) => handleHitChange('A', val)} colorVar="--accent-color" />
            <HitCounter label="Charlie (C)" description={isMajor ? "4 Points" : "3 Points"} value={hits.C} onChange={(val) => handleHitChange('C', val)} />
            <HitCounter label="Delta (D)" description={isMajor ? "2 Points" : "1 Point"} value={hits.D} onChange={(val) => handleHitChange('D', val)} isLast={true} />
          </div>

          <div className="card" style={{ padding: '24px', marginBottom: '0' }}>
            <h2 style={{ 
              fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', 
              color: 'var(--text-secondary)', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              Penalties
              <button onClick={() => setActiveModal('penalties')} aria-label="Info Penalità" style={{ color: 'var(--accent-color)' }}><Info size={16} /></button>
            </h2>
            <HitCounter label="Miss (M)" description="-10 Points" value={hits.M} onChange={(val) => handleHitChange('M', val)} colorVar="--danger-color" />
            <HitCounter label="No-Shoot (NS)" description="-10 Points" value={hits.NS} onChange={(val) => handleHitChange('NS', val)} colorVar="--danger-color" />
            <HitCounter label="Procedural" description="-10 Points" value={hits.PROC} onChange={(val) => handleHitChange('PROC', val)} colorVar="--danger-color" isLast={true} />
          </div>
        </div>

        {/* COLONNA DESTRA (Stato, Tempo, Setup O Bottom in Mobile) */}
        <div className="grid-right">
          
          {/* CONFIG CARD */}
          <div className="card" style={{ marginBottom: '0' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--text-secondary)" /> Power Factor
              <button onClick={() => setActiveModal('powerfactor')} style={{ color: 'var(--accent-color)' }}><Info size={16} /></button>
            </h2>
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-color)', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
              <button onClick={() => setIsMajor(false)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '15px', backgroundColor: !isMajor ? 'var(--card-bg)' : 'transparent', color: !isMajor ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: !isMajor ? 'var(--shadow-sm)' : 'none', transition: 'var(--transition)' }}>
                <Zap size={16} /> Minor
              </button>
              <button onClick={() => setIsMajor(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '15px', backgroundColor: isMajor ? 'var(--card-bg)' : 'transparent', color: isMajor ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: isMajor ? 'var(--shadow-sm)' : 'none', transition: 'var(--transition)' }}>
                <Flame size={16} /> Major
              </button>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-secondary)' }}>
                <Timer size={18} /> Tempo (Secondi)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="0.00"
                style={{ width: '100%', padding: '20px', fontSize: '28px', fontWeight: '700', textAlign: 'center' }}
              />
            </div>
          </div>

          {/* RESULT CARD: MOSTRATA SOLO SU DESKTOP (Su Mobile c'è la Bottom Bar) */}
          <div className="card desktop-only" style={{ marginBottom: '0', border: '2px solid var(--border-color)', transform: 'scale(1.02)' }}>
            <div className="flex-between">
              <div>
                <span onClick={() => setActiveModal('hitfactor')} style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Hit Factor <Info size={14} color="var(--accent-color)" />
                </span>
                <div style={{ fontSize: '56px', fontWeight: '800', lineHeight: 1, color: 'var(--accent-color)', marginTop: '8px' }}>
                  {result.hitFactor.toFixed(4)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Punti: <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '18px' }}>{result.stageScore}</span></div>
                {result.totalPenalties > 0 && <div style={{ fontSize: '15px', color: 'var(--danger-color)', fontWeight: 600 }}>Penalità: -{result.totalPenalties}</div>}
              </div>
            </div>
          </div>

          {/* SALVA STAGE DESKTOP ONLY */}
          <button
            className="desktop-only"
            onClick={openSaveModal}
            disabled={!time || parseFloat(time) <= 0}
            style={{ width: '100%', padding: '16px', color: '#FFF', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: 'var(--accent-color)', borderRadius: 'var(--border-radius-lg)', boxShadow: '0 4px 12px rgba(0,122,255,0.3)', opacity: (!time || parseFloat(time) <= 0) ? 0.5 : 1 }}
          >
            <Save size={20} /> Salva Stage
          </button>

          {/* RESET DESKTOP ONLY */}
          <button className="desktop-only" onClick={handleReset} style={{ width: '100%', padding: '16px', color: 'var(--danger-color)', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <RefreshCcw size={20} /> Reset Stage
          </button>
        </div>
      </div>}

      {/* MOBILE FIXED BOTTOM ACTION BAR (solo nella tab Score) */}
      {activeTab === 'score' && (
        <div className="mobile-only mobile-bottom-bar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }} onClick={() => setActiveModal('hitfactor')}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Hit Factor <Info size={12} color="var(--accent-color)"/>
            </span>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-color)', lineHeight: 1 }}>
              {result.hitFactor.toFixed(4)}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: result.totalPenalties > 0 ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
              Punti: {result.stageScore} {result.totalPenalties > 0 && `(Pen: -${result.totalPenalties})`}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={openSaveModal}
              disabled={!time || parseFloat(time) <= 0}
              style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0, 122, 255, 0.4)', transition: 'transform 0.2s', opacity: (!time || parseFloat(time) <= 0) ? 0.4 : 1 }}
              aria-label="Salva Stage"
            >
              <Save size={24} strokeWidth={2.5} />
            </button>
            <button
              onClick={handleReset}
              style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--danger-color)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(255, 59, 48, 0.4)', transition: 'transform 0.2s' }}
              aria-label="Reset Stage"
            >
              <RefreshCcw size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      <SaveStageModal
        isOpen={showSaveModal}
        onClose={closeSaveModal}
        discipline="ipsc"
        currentState={{ time: parseFloat(time) || 0, hits, isMajor, result, ...(timerStage ? { timer: timerStage } : {}) }}
      />

      {/* MODALS */}
      <Modal isOpen={activeModal === 'hitfactor'} onClose={() => setActiveModal(null)} title="Che cos'è l'Hit Factor?" maxWidth="600px">
        <p style={{ marginBottom: '12px' }}>Nel Tiro Dinamico Sportivo (IPSC), l'obiettivo è incarnare il motto latino <em>"Diligentia, Vis, Celeritas"</em> (Precisione, Potenza, Velocità). L'<strong>Hit Factor (HF)</strong> è la formula matematica che bilancia magicamente questi tre elementi.</p>
        <p style={{ marginBottom: '16px' }}>In parole povere, l'Hit Factor indica <strong>quanti punti netti riesci a segnare per ogni secondo</strong> che passa.</p>
        <div style={{ padding: '16px', backgroundColor: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)', margin: '16px 0', textAlign: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--accent-color)' }}>HF</span> = (Totale Punti Bersagli - Penalità) / Tempo Impiegato
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Il calcolo premia chi trova il bilanciamento perfetto: essere ultra-veloci ma mancare i bersagli porta a un HF pessimo. D'altro canto, prendersi mire lunghissime per fare "Alfa" fa salire il tempo a dismisura, abbattendo l'HF. Nelle competizioni, l'Hit Factor più alto nello stage prende il 100% dei punti disponibili.</p>
      </Modal>

      <Modal isOpen={activeModal === 'powerfactor'} onClose={() => setActiveModal(null)} title="Major vs Minor & Ricarica" maxWidth="750px">
        <div style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: '12px' }}>
          <p style={{ marginBottom: '16px' }}>Il <strong>Power Factor</strong> (Fattore di Potenza) detta i punti delle zone esterne ed è dedotto dalle munizioni. La formula IPSC ufficiale è:</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '24px auto', padding: '24px', backgroundColor: 'var(--bg-color)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.03)'}}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-color)' }}>PF</div>
            <div style={{ fontSize: '24px', fontWeight: 500, color: 'var(--text-secondary)' }}>=</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ padding: '0 16px 12px 16px', borderBottom: '2.5px solid var(--text-primary)', fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px', textAlign: 'center' }}>
                Peso Palla <span style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 500 }}>(grs)</span> 
                <span style={{ color: 'var(--accent-color)', margin: '0 8px', fontSize: '20px' }}>×</span> 
                Velocità <span style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 500 }}>(fps)</span>
              </div>
              <div style={{ padding: '12px 16px 0 16px', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>1000</div>
            </div>
          </div>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
            <li><strong>Major (Min. PF 160 o 170):</strong> C = 4 pti, D = 2 pti.</li>
            <li><strong>Minor (Min. PF 125):</strong> C = 3 pti, D = 1 pto.</li>
          </ul>
          <h4 style={{ fontSize: '16px', color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px' }}>Esempi di Ricarica (Puramente Indicativi*)</h4>
          <p style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>Questi test standardizzati su <strong>canne IPSC da 5"</strong> restituiscono i seguenti profili di caricamento.</p>
          <div style={{ overflowX: 'auto', marginBottom: '16px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <table style={{ width: '100%', fontSize: '13.5px', textAlign: 'left', borderCollapse: 'collapse', minWidth: '450px', background: 'var(--card-bg)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-color)' }}>
                  <th style={{ padding: '10px 12px' }}>Calibro (PF)</th><th style={{ padding: '10px 12px' }}>Palla</th><th style={{ padding: '10px 12px' }}>Polvere (Vivace/Lente)</th><th style={{ padding: '10px 12px' }}>G. Polvere</th><th style={{ padding: '10px 12px' }}>OAL Tondo</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>9x19/21 (Minor)</td><td style={{ padding: '10px 12px' }}>124 gr</td><td style={{ padding: '10px 12px' }}>es. VN320 / BA9</td><td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--accent-color)' }}>~ 4.0 - 4.2 gr</td><td style={{ padding: '10px 12px' }}>29.0 mm</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>9x19/21 (Minor)</td><td style={{ padding: '10px 12px' }}>147 gr</td><td style={{ padding: '10px 12px' }}>es. VN320 / CSB1</td><td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--accent-color)' }}>~ 3.2 - 3.4 gr</td><td style={{ padding: '10px 12px' }}>29.5 mm</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>.40 S&W (Major)</td><td style={{ padding: '10px 12px' }}>180 gr</td><td style={{ padding: '10px 12px' }}>es. VN320 / VV340</td><td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--accent-color)' }}>~ 4.8 - 5.0 gr</td><td style={{ padding: '10px 12px' }}>28.5 mm</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>.38 Sup. (Major)</td><td style={{ padding: '10px 12px' }}>124 gr</td><td style={{ padding: '10px 12px' }}>es. 3N38 / VN350</td><td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--accent-color)' }}>~ 7.6+ gr</td><td style={{ padding: '10px 12px' }}>31.5 mm</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>.45 ACP (Major)</td><td style={{ padding: '10px 12px' }}>230 gr</td><td style={{ padding: '10px 12px' }}>es. VN320 / BA10</td><td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--accent-color)' }}>~ 4.5 - 5.0 gr</td><td style={{ padding: '10px 12px' }}>32.0 mm</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>.38 Spc (Rev)</td><td style={{ padding: '10px 12px' }}>158 gr</td><td style={{ padding: '10px 12px' }}>es. VN320 / N330</td><td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--accent-color)' }}>~ 4.2 - 4.5 gr</td><td style={{ padding: '10px 12px' }}>Cilindro</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--danger-color)', backgroundColor: 'rgba(255, 59, 48, 0.08)', padding: '12px', borderRadius: '8px', borderLeft: '4px solid var(--danger-color)' }}>
            <strong>*AVVERTENZA DI SICUREZZA:</strong> Le dosi in tabella sono stime puramente divulgative. Pressioni in camera disastrose possono essere generate se l'OAL (Lunghezza finita del tondo) è troppo corto per il tipo di palla o polvere! Ricaricate sempre seguendo pedissequamente i <strong>manuali ufficiali dei vari produttori</strong>.
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'hits'} onClose={() => setActiveModal(null)} title="I Bersagli e i Punti (Hits)" maxWidth="600px">
        <p style={{ marginBottom: '12px' }}>In IPSC si spara a bersagli di cartone sagomato e a piastre metalliche abbattibili (che valgono sempre 5 punti netti). I bersagli di cartone possiedono <strong>zone di precisione invisibili</strong> a distanza, e ogni stage richiede solitamente di colpirli con <strong>due colpi</strong>.</p>
        <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', marginTop: '16px', gap: '16px', display: 'flex', flexDirection: 'column' }}>
          <div>
            <strong style={{ color: 'var(--accent-color)', fontSize: '16px' }}>Alfa (A) - Zona Centrale:</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>È il "cuore" del bersaglio. Rappresenta un colpo piazzato perfettamente e vale sempre <strong>5 Punti</strong> per tutte le classi di potenza.</p>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: '16px' }}>Charlie (C) - Zona Media:</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Un colpo leggermente fuori centro. Inizia a pesare in base al calibro: vale <strong>4 Punti</strong> per chi spara calibri "Major", ma solo <strong>3 Punti</strong> per le "Minor".</p>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: '16px' }}>Delta (D) - Zona Periferica:</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Il colpo ha sfiorato i bordi del bersaglio. Costituisce solo <strong>2 Punti</strong> per le armi Major, e un misero <strong>1 Punto</strong> per le Minor!</p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'penalties'} onClose={() => setActiveModal(null)} title="Le Penalità" maxWidth="600px">
        <p style={{ marginBottom: '16px' }}>Nello sport dell'IPSC gli errori si pagano carissimi. Ogni singola penalità sottrae ben <strong>10 Punti</strong> dal totale del tuo stage (vanificando la fatica di 2 Alpha perfetti). Se le penalità superano i punti accumulati, il punteggio complessivo scende a zero.</p>
        <div style={{ padding: '20px', background: 'rgba(255, 59, 48, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--danger-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <strong style={{ color: 'var(--danger-color)', fontSize: '16px' }}>Miss (M) - Bersaglio Mancato:</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Si assegna quando un bersaglio non riporta il numero di impatti minimi previsti dal briefing (es. dovevi mettere due colpi, ma ce n'è solo uno visibile).</p>
          </div>
          <div style={{ borderTop: '1px solid rgba(255, 59, 48, 0.1)', paddingTop: '16px' }}>
            <strong style={{ color: 'var(--danger-color)', fontSize: '16px' }}>No-Shoot (NS) - Ostaggio Colpito:</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Spesso nello stage sono presenti sagome "bianche" o con la X nera (Ostaggi / Hard Cover). Colpirli è severamente punito con una penalità per ogni buco effettuato su di loro.</p>
          </div>
          <div style={{ borderTop: '1px solid rgba(255, 59, 48, 0.1)', paddingTop: '16px' }}>
            <strong style={{ color: 'var(--danger-color)', fontSize: '16px' }}>Procedural - Infrazione Regolamentare:</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Assegnata dal Range Officer (Giudice) se il tiratore calpesta le linee esterne del campo (fault lines), esplode colpi col piede fuori area, o viola obblighi di percorso specifici del briefing.</p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'downloads'} onClose={() => setActiveModal(null)} title="Scarica i Regolamenti Ufficiali" maxWidth="500px">
        <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Scarica sul tuo dispositivo i file PDF ufficiali del regolamento sportivo FIDTS e IPSC Handgun.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
           <a href="/regolamenti/IPSC-Handgun-Competition-Rules-Jan-2026-Edition-Final-29-Dec-2025.pdf" download className="download-card">
              <FileText size={20} color="var(--accent-color)" /><div style={{ flex: 1 }}><strong>IPSC Handgun Rules (ENG)</strong><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Edizione Gennaio 2026</div></div><Download size={18} />
           </a>
           <a href="/regolamenti/HandgunRegolamentoGennaio2024VersioneFinale-.pdf" download className="download-card">
              <FileText size={20} color="var(--accent-color)" /><div style={{ flex: 1 }}><strong>Regolamento Handgun FITDS (ITA)</strong><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Edizione Gennaio 2024</div></div><Download size={18} />
           </a>
           <a href="/regolamenti/Regolamento_Sportivo_2025_v_22.10.24.pdf" download className="download-card">
              <FileText size={20} color="var(--accent-color)" /><div style={{ flex: 1 }}><strong>Regolamento Sportivo FITDS</strong><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Aggiornamento 2025</div></div><Download size={18} />
           </a>
           <a href="/regolamenti/Appendici_2025_con_quote.pdf" download className="download-card">
              <FileText size={20} color="var(--accent-color)" /><div style={{ flex: 1 }}><strong>Appendici e Dimensioni (2025)</strong><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Quote Sagome e Dimensioni IPSC</div></div><Download size={18} />
           </a>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'rules'} onClose={() => setActiveModal(null)} title="Manuale Tecnico IPSC / FITDS (Ed. 2024-2026)" maxWidth="950px">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
          <button onClick={() => setRulesTab('safety')} style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', backgroundColor: rulesTab === 'safety' ? 'var(--accent-color)' : 'var(--bg-color)', color: rulesTab === 'safety' ? '#FFF' : 'var(--text-secondary)', transition: 'var(--transition)', border: 'none', cursor: 'pointer' }}>Sicurezza & DQ</button>
          <button onClick={() => setRulesTab('divisions')} style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', backgroundColor: rulesTab === 'divisions' ? 'var(--accent-color)' : 'var(--bg-color)', color: rulesTab === 'divisions' ? '#FFF' : 'var(--text-secondary)', transition: 'var(--transition)', border: 'none', cursor: 'pointer' }}>Divisioni Dettagliate</button>
          <button onClick={() => setRulesTab('equipment')} style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', backgroundColor: rulesTab === 'equipment' ? 'var(--accent-color)' : 'var(--bg-color)', color: rulesTab === 'equipment' ? '#FFF' : 'var(--text-secondary)', transition: 'var(--transition)', border: 'none', cursor: 'pointer' }}>Equipaggiamento</button>
          <button onClick={() => setRulesTab('scoring')} style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', backgroundColor: rulesTab === 'scoring' ? 'var(--accent-color)' : 'var(--bg-color)', color: rulesTab === 'scoring' ? '#FFF' : 'var(--text-secondary)', transition: 'var(--transition)', border: 'none', cursor: 'pointer' }}>Target & Punti</button>
          <button onClick={() => setRulesTab('procedure')} style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', backgroundColor: rulesTab === 'procedure' ? 'var(--accent-color)' : 'var(--bg-color)', color: rulesTab === 'procedure' ? '#FFF' : 'var(--text-secondary)', transition: 'var(--transition)', border: 'none', cursor: 'pointer' }}>Procedure & RO</button>
        </div>

        <div style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: '12px' }}>
          {rulesTab === 'safety' && (
            <div className="fade-in">
              <h3 style={{ color: 'var(--danger-color)', marginBottom: '16px', fontSize: '18px' }}>Capitolo 10: Sicurezza Generale e Match DQ</h3>
              <p style={{ fontSize: '14px', marginBottom: '20px', color: 'var(--text-secondary)' }}>La squalifica dal match (DQ) comporta l'immediata cessazione della partecipazione a tutti gli stage rimanenti. Non è appellabile se basata su violazioni fisiche della sicurezza.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--danger-color)', marginBottom: '10px' }}>Violazioni dei 180 Gradi (Regola 10.5.2)</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>L'arma (carica o scarica) non deve mai puntare "dietro" rispetto alla linea mediana dello stage. Durante la ricarica o la risoluzione di un inceppamento, la bocca della canna deve restare orientata entro i limiti sicuri.</p>
                </div>
                <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--danger-color)', marginBottom: '10px' }}>Maneggiamento Insicuro e Sweeping</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}><strong>Sweeping:</strong> Puntare la bocca della canna verso qualsiasi parte del proprio corpo. <strong>Dropped Gun:</strong> Far cadere l'arma in qualsiasi momento (anche scarica). <strong>Dito nel ponticello:</strong> Durante il movimento o la ricarica.</p>
                </div>
                <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--danger-color)', marginBottom: '10px' }}>Alcool e Comportamento Antisportivo</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>L'uso di sostanze che alterano la concentrazione comporta l'espulsione. Urla o imprecazioni violente verso gli arbitri portano a DQ per condotta antisportiva.</p>
                </div>
              </div>
            </div>
          )}

          {rulesTab === 'divisions' && (
            <div className="fade-in">
              <h3 style={{ color: 'var(--accent-color)', marginBottom: '16px', fontSize: '18px' }}>Analisi Tecnica Divisioni (Appendici D1-D5)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '15px', marginBottom: '12px' }}>Standard Division (Appendice D2)</h4>
                  <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li><strong>Scatola IPSC:</strong> L'arma con caricatore inserito deve entrare nella scatola (225 x 150 x 45 mm).</li>
                    <li><strong>Modifiche:</strong> Minigonne e organi di mira ammessi.</li>
                    <li><strong>Proibiti:</strong> Compensatori, fori di sfiato (porting) e ottiche elettroniche portate sul carrello.</li>
                  </ul>
                </div>
                <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '15px', marginBottom: '12px' }}>Production Division (Appendice D4)</h4>
                  <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li><strong>Lista Ufficiale:</strong> Solo armi approvate dalla "Production Division List".</li>
                    <li><strong>Peso Scatto:</strong> Minimo 2.27kg (5 lbs) per il primo colpo (doppia azione).</li>
                    <li><strong>Note:</strong> Vietata la Singola Azione pura (SAO) tipo 1911.</li>
                  </ul>
                </div>
                <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '15px', marginBottom: '12px' }}>Open Division (Appendice D1)</h4>
                  <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li><strong>Caricatori:</strong> Lunghezza massima 170 mm (misurati sul retro).</li>
                    <li><strong>Libertà:</strong> Uso di Red Dot, compensatori e percussori ultra-veloci ammesso.</li>
                    <li><strong>Fattore:</strong> Caricamento Major concesso per 9mm con PF minimo 160.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {rulesTab === 'equipment' && (
            <div className="fade-in">
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '18px' }}>Cinturoni, Fondine e Accessori (Capitolo 5)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '15px', marginBottom: '10px' }}>Regola dei 50mm</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>La distanza tra il fusto dell'arma e la faccia interna del cinturone non deve superare i **50 mm**.</p>
                </div>
                <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '15px', marginBottom: '10px' }}>Posizione della Fondina</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>In Production e Standard, l'arma deve essere portata dietro l'osso dell'anca.</p>
                </div>
                <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '15px', marginBottom: '10px' }}>Ritenzione</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>L'arma deve restare nella fondina durante i movimenti dinamici dello stage (scatti, salti).</p>
                </div>
              </div>
            </div>
          )}

          {rulesTab === 'scoring' && (
            <div className="fade-in">
              <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Tabella Target e Metodi di Calcolo</h3>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '24px' }}>
                <table style={{ width: '100%', fontSize: '13px', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-color)', borderBottom: '2.5px solid var(--border-color)' }}>
                      <th style={{ padding: '12px' }}>Bersaglio</th><th style={{ padding: '12px' }}>Zona A</th><th style={{ padding: '12px' }}>Zona C (M/m)</th><th style={{ padding: '12px' }}>Zona D (M/m)</th><th style={{ padding: '12px' }}>Miss</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px' }}><strong>IPSC Universal</strong></td><td style={{ padding: '12px' }}>5 pti</td><td style={{ padding: '12px' }}>4 / 3 pti</td><td style={{ padding: '12px' }}>2 / 1 pti</td><td style={{ padding: '12px' }}>-10 pti</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px' }}><strong>IPSC Mini</strong></td><td style={{ padding: '12px' }}>5 pti</td><td style={{ padding: '12px' }}>4 / 3 pti</td><td style={{ padding: '12px' }}>2 / 1 pti</td><td style={{ padding: '12px' }}>-10 pti</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px' }}><strong>Piastre / Poppers</strong></td><td style={{ padding: '12px' }}>5 pti</td><td style={{ padding: '12px' }}>-</td><td style={{ padding: '12px' }}>-</td><td style={{ padding: '12px' }}>-10 pti</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--accent-color)', marginBottom: '8px' }}>Procedurali Speciali</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}><strong>Double Procedural:</strong> Guadagno di un vantaggio significativo. <strong>Creeping:</strong> Muoversi prima del segnale Start Signal.</p>
                </div>
                <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--accent-color)', marginBottom: '8px' }}>No-Shoot</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Il No-Shoot conta al massimo due colpi per bersaglio ai fini della sottrazione punti.</p>
                </div>
              </div>
            </div>
          )}

          {rulesTab === 'procedure' && (
            <div className="fade-in">
              <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Ispezione e Comandi Ufficiali (Regola 8.3)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, auto) 1fr', gap: '12px', fontSize: '13px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-color)' }}>"Make Ready"</div><div style={{ color: 'var(--text-secondary)' }}>Tiratore prepara l'arma secondo il briefing.</div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-color)' }}>"Standby"</div><div style={{ color: 'var(--text-secondary)' }}>Il segnale acustico suonerà da 1 a 4 secondi dopo.</div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-color)' }}>"Stop!"</div><div style={{ color: 'var(--text-secondary)' }}>Cessare immediatamente il fuoco e restare immobile.</div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-color)' }}>"Range is Clear"</div><div style={{ color: 'var(--text-secondary)' }}>Ispezione e ripristino bersagli autorizzati.</div>
                  </div>
                </div>
                <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '15px', marginBottom: '8px' }}>Ispezione Bersagli</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Se il tiratore tocca il bersaglio prima che sia stato formalizzato il punteggio, non può sollevare contestazioni.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
}

export default App;
