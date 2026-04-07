import React, { useState, useMemo } from 'react';
import HitCounter from './HitCounter';
import Modal from './Modal';
import { calculatePaladin, calculateDefensiveCount, PALADIN_PENALTIES, DEFENSIVE_PENALTIES, DEFENSIVE_POINTS_DOWN } from '../utils/lssaScoring';
import { Timer, RefreshCcw, Info, BookOpen, Download, FileText, LayoutGrid, Shield, Crosshair, Target, AlertTriangle, Trophy, Save } from 'lucide-react';
import ChronoCheck from './ChronoCheck';
import GareTab from './GareTab';
import SaveStageModal from './SaveStageModal';

const GithubIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export default function LSSAScoreCalculator({ onBack, theme, toggleTheme }) {
  const [scoringMethod, setScoringMethod] = useState('paladin'); // 'paladin' | 'defensive'
  const [activeTab, setActiveTab] = useState('score'); // 'score' | 'chrono' | 'gare'
  const [time, setTime] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [rulesTab, setRulesTab] = useState('safety');
  const [showSaveModal, setShowSaveModal] = useState(false);

  // PALADIN state
  const [paladinPenalties, setPaladinPenalties] = useState({
    FTN: 0, PROC: 0, HNT: 0, FTE: 0, FTDR: 0
  });

  // DEFENSIVE COUNT state
  const [defensiveHits, setDefensiveHits] = useState({
    ZERO: 0, DOWN2: 0, DOWN3: 0, MISS: 0
  });
  const [defensivePenalties, setDefensivePenalties] = useState({
    PENALTY: 0, FTE: 0, PROC: 0, ANTISP: 0
  });

  const handlePaladinChange = (key, value) => {
    setPaladinPenalties(prev => ({ ...prev, [key]: value }));
  };

  const handleDefensiveHitChange = (key, value) => {
    setDefensiveHits(prev => ({ ...prev, [key]: value }));
  };

  const handleDefensivePenaltyChange = (key, value) => {
    setDefensivePenalties(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setTime('');
    setPaladinPenalties({ FTN: 0, PROC: 0, HNT: 0, FTE: 0, FTDR: 0 });
    setDefensiveHits({ ZERO: 0, DOWN2: 0, DOWN3: 0, MISS: 0 });
    setDefensivePenalties({ PENALTY: 0, FTE: 0, PROC: 0, ANTISP: 0 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const paladinResult = useMemo(() => {
    return calculatePaladin(time || 0, paladinPenalties);
  }, [time, paladinPenalties]);

  const defensiveResult = useMemo(() => {
    return calculateDefensiveCount(time || 0, defensiveHits, defensivePenalties);
  }, [time, defensiveHits, defensivePenalties]);

  const result = scoringMethod === 'paladin' ? paladinResult : defensiveResult;

  const Sun = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
  const Moon = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

  return (
    <div style={{ width: '100%' }}>
      {/* HEADER */}
      <header style={{ textAlign: 'center', marginBottom: '24px', paddingTop: '24px', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '16px', top: '12px', display: 'flex', gap: '8px' }}>
          <button
            onClick={onBack}
            style={{ padding: '8px 14px', color: 'var(--lssa-accent)', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border-color)', backdropFilter: 'blur(10px)' }}
          >
            ← Indietro
          </button>
        </div>
        <button
          onClick={toggleTheme}
          style={{ position: 'absolute', right: '16px', top: '12px', padding: '8px', color: 'var(--text-secondary)' }}
          aria-label="Toggle Tema"
        >
          {theme === 'dark' ? <Sun size={26} /> : <Moon size={26} />}
        </button>

        <div className="flex-center" style={{ gap: '12px', marginBottom: '8px', paddingTop: '4px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--lssa-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>
            <Shield size={22} color="#FFF" />
          </div>
          <h1 style={{ fontSize: '36px', letterSpacing: '-0.8px' }}>LSSA Score</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 600 }}>
          {scoringMethod === 'paladin' ? 'Punteggio Paladin' : 'Defensive Count'} Calculator
        </p>

        {/* MAIN TAB SWITCHER */}
        <div className="main-tab-container" style={{ maxWidth: '400px', margin: '20px auto 0 auto', padding: '0 16px' }}>
          <div className="main-tab-switcher lssa-tab-switcher">
            <button
              onClick={() => setActiveTab('score')}
              className={`main-tab-btn ${activeTab === 'score' ? 'main-tab-active lssa-tab-active' : ''}`}
            >
              <Target size={18} /> Score Calculator
            </button>
            <button
              onClick={() => setActiveTab('chrono')}
              className={`main-tab-btn ${activeTab === 'chrono' ? 'main-tab-active lssa-tab-active' : ''}`}
            >
              <Crosshair size={18} /> Chrono Check
            </button>
            <button
              onClick={() => setActiveTab('gare')}
              className={`main-tab-btn ${activeTab === 'gare' ? 'main-tab-active lssa-tab-active' : ''}`}
            >
              <Trophy size={18} /> Gare
            </button>
          </div>
        </div>

        {/* TOOLBAR */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', maxWidth: '600px', margin: '16px auto 0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setActiveModal('rules')} className="toolbar-btn lssa-toolbar-btn">
              <BookOpen size={16} /> Regole LSSA/FIIDS
            </button>
            <button onClick={() => setActiveModal('downloads')} className="toolbar-btn lssa-toolbar-btn">
              <Download size={16} /> Scarica PDF
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="https://github.com/nicolocarello/IPSC" target="_blank" rel="noopener noreferrer" className="toolbar-btn lssa-toolbar-btn">
              <GithubIcon size={16} /> Github
            </a>
            <a href="https://apps.nicolocarello.it" target="_blank" rel="noopener noreferrer" className="toolbar-btn lssa-toolbar-btn">
              <LayoutGrid size={16} /> Altre Apps
            </a>
          </div>
        </div>
      </header>

      {/* CHRONO TAB */}
      {activeTab === 'chrono' && (
        <div className="fade-in" style={{ padding: '0 16px', paddingBottom: '40px' }}>
          <ChronoCheck />
        </div>
      )}

      {/* GARE TAB */}
      {activeTab === 'gare' && (
        <div className="fade-in" style={{ padding: '0 16px', paddingBottom: '40px' }}>
          <GareTab discipline="lssa" />
        </div>
      )}

      {/* SCORE TAB */}
      {activeTab === 'score' && (
        <div className="app-grid fade-in">
          {/* COLONNA SINISTRA */}
          <div className="grid-left" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* SCORING METHOD SELECTOR */}
            <div className="card" style={{ padding: '16px 24px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Metodo di Punteggio
                <button onClick={() => setActiveModal('scoring-info')} aria-label="Info Punteggio" style={{ color: 'var(--lssa-accent)' }}><Info size={16} /></button>
              </h2>
              <div style={{ display: 'flex', backgroundColor: 'var(--bg-color)', borderRadius: '10px', padding: '4px' }}>
                <button onClick={() => setScoringMethod('paladin')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '15px', backgroundColor: scoringMethod === 'paladin' ? 'var(--card-bg)' : 'transparent', color: scoringMethod === 'paladin' ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: scoringMethod === 'paladin' ? 'var(--shadow-sm)' : 'none', transition: 'var(--transition)' }}>
                  <Timer size={16} /> Paladin
                </button>
                <button onClick={() => setScoringMethod('defensive')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '15px', backgroundColor: scoringMethod === 'defensive' ? 'var(--card-bg)' : 'transparent', color: scoringMethod === 'defensive' ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: scoringMethod === 'defensive' ? 'var(--shadow-sm)' : 'none', transition: 'var(--transition)' }}>
                  <Target size={16} /> Defensive
                </button>
              </div>
            </div>

            {/* PALADIN PENALTIES */}
            {scoringMethod === 'paladin' && (
              <div className="card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Penalità
                  <button onClick={() => setActiveModal('paladin-penalties')} aria-label="Info Penalità" style={{ color: 'var(--lssa-accent)' }}><Info size={16} /></button>
                </h2>
                <HitCounter label="FTN" description={`Mancata Neutralizzazione (+${PALADIN_PENALTIES.FTN}'')`} value={paladinPenalties.FTN} onChange={(val) => handlePaladinChange('FTN', val)} colorVar="--danger-color" />
                <HitCounter label="Procedura" description={`Errore di Procedura (+${PALADIN_PENALTIES.PROC}'')`} value={paladinPenalties.PROC} onChange={(val) => handlePaladinChange('PROC', val)} colorVar="--danger-color" />
                <HitCounter label="HNT" description={`Hit Not Threat (+${PALADIN_PENALTIES.HNT}'')`} value={paladinPenalties.HNT} onChange={(val) => handlePaladinChange('HNT', val)} colorVar="--danger-color" />
                <HitCounter label="FTE" description={`Failure To Engage (+${PALADIN_PENALTIES.FTE}'')`} value={paladinPenalties.FTE} onChange={(val) => handlePaladinChange('FTE', val)} colorVar="--danger-color" />
                <HitCounter label="FTDR" description={`Failure To Do Right (+${PALADIN_PENALTIES.FTDR}'')`} value={paladinPenalties.FTDR} onChange={(val) => handlePaladinChange('FTDR', val)} colorVar="--danger-color" isLast={true} />
              </div>
            )}

            {/* DEFENSIVE COUNT HITS + PENALTIES */}
            {scoringMethod === 'defensive' && (
              <>
                <div className="card" style={{ padding: '24px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Points Down
                    <button onClick={() => setActiveModal('defensive-hits')} aria-label="Info Points Down" style={{ color: 'var(--lssa-accent)' }}><Info size={16} /></button>
                  </h2>
                  <HitCounter label="Zona -0" description="0 Points Down" value={defensiveHits.ZERO} onChange={(val) => handleDefensiveHitChange('ZERO', val)} colorVar="--lssa-accent" />
                  <HitCounter label="Zona -2" description="2 Points Down" value={defensiveHits.DOWN2} onChange={(val) => handleDefensiveHitChange('DOWN2', val)} colorVar="--lssa-warn" />
                  <HitCounter label="Zona -3" description="3 Points Down" value={defensiveHits.DOWN3} onChange={(val) => handleDefensiveHitChange('DOWN3', val)} colorVar="--lssa-warn" />
                  <HitCounter label="Miss" description="5 Points Down" value={defensiveHits.MISS} onChange={(val) => handleDefensiveHitChange('MISS', val)} colorVar="--danger-color" isLast={true} />
                </div>

                <div className="card" style={{ padding: '24px', marginBottom: '0' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Penalità
                    <button onClick={() => setActiveModal('defensive-penalties')} aria-label="Info Penalità" style={{ color: 'var(--lssa-accent)' }}><Info size={16} /></button>
                  </h2>
                  <HitCounter label="Penalty" description={`Bersaglio Penalty (+${DEFENSIVE_PENALTIES.PENALTY}'')`} value={defensivePenalties.PENALTY} onChange={(val) => handleDefensivePenaltyChange('PENALTY', val)} colorVar="--danger-color" />
                  <HitCounter label="FTE" description={`Mancato Ingaggio (+${DEFENSIVE_PENALTIES.FTE}'')`} value={defensivePenalties.FTE} onChange={(val) => handleDefensivePenaltyChange('FTE', val)} colorVar="--danger-color" />
                  <HitCounter label="Procedura" description={`Errore Procedura (+${DEFENSIVE_PENALTIES.PROC}'')`} value={defensivePenalties.PROC} onChange={(val) => handleDefensivePenaltyChange('PROC', val)} colorVar="--danger-color" />
                  <HitCounter label="Antisportivo" description={`Condotta Antisportiva (+${DEFENSIVE_PENALTIES.ANTISP}'')`} value={defensivePenalties.ANTISP} onChange={(val) => handleDefensivePenaltyChange('ANTISP', val)} colorVar="--danger-color" isLast={true} />
                </div>
              </>
            )}
          </div>

          {/* COLONNA DESTRA */}
          <div className="grid-right">
            {/* TIME INPUT */}
            <div className="card" style={{ marginBottom: '0' }}>
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
                  className="lssa-input-focus"
                  style={{ width: '100%', padding: '20px', fontSize: '28px', fontWeight: '700', textAlign: 'center' }}
                />
              </div>
            </div>

            {/* RESULT CARD DESKTOP */}
            <div className="card desktop-only" style={{ marginBottom: '0', border: '2px solid var(--border-color)', transform: 'scale(1.02)' }}>
              <div className="flex-between">
                <div>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Tempo Totale
                  </span>
                  <div style={{ fontSize: '56px', fontWeight: '800', lineHeight: 1, color: 'var(--lssa-accent)', marginTop: '8px' }}>
                    {result.totalTime.toFixed(2)}
                    <span style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-secondary)' }}> sec</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Tempo: <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '18px' }}>{result.rawTime.toFixed(2)}''</span>
                  </div>
                  {result.penaltyTime > 0 && (
                    <div style={{ fontSize: '15px', color: 'var(--danger-color)', fontWeight: 600 }}>
                      Penalità: +{result.penaltyTime.toFixed(2)}''
                    </div>
                  )}
                  {scoringMethod === 'defensive' && result.pointsDownTime > 0 && (
                    <div style={{ fontSize: '15px', color: 'var(--lssa-warn)', fontWeight: 600 }}>
                      PD: +{result.pointsDownTime.toFixed(2)}'' ({result.totalPointsDown} PD)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SALVA STAGE DESKTOP */}
            <button
              className="desktop-only"
              onClick={() => setShowSaveModal(true)}
              disabled={!time || parseFloat(time) <= 0}
              style={{ width: '100%', padding: '16px', color: '#FFF', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: 'var(--lssa-accent)', borderRadius: 'var(--border-radius-lg)', boxShadow: '0 4px 12px rgba(52,199,89,0.3)', opacity: (!time || parseFloat(time) <= 0) ? 0.5 : 1 }}
            >
              <Save size={20} /> Salva Stage
            </button>

            {/* RESET DESKTOP */}
            <button className="desktop-only" onClick={handleReset} style={{ width: '100%', padding: '16px', color: 'var(--danger-color)', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <RefreshCcw size={20} /> Reset Stage
            </button>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM BAR */}
      {activeTab === 'score' && (
        <div className="mobile-only mobile-bottom-bar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Tempo Totale
            </span>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--lssa-accent)', lineHeight: 1 }}>
              {result.totalTime.toFixed(2)}
              <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}> sec</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: result.penaltyTime > 0 ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
              T: {result.rawTime.toFixed(2)}''
              {result.penaltyTime > 0 && ` | Pen: +${result.penaltyTime.toFixed(2)}''`}
              {scoringMethod === 'defensive' && result.pointsDownTime > 0 && ` | PD: +${result.pointsDownTime.toFixed(2)}''`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={!time || parseFloat(time) <= 0}
              style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--lssa-accent)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(52,199,89,0.4)', transition: 'transform 0.2s', opacity: (!time || parseFloat(time) <= 0) ? 0.4 : 1 }}
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
        onClose={() => setShowSaveModal(false)}
        discipline="lssa"
        currentState={{
          time: parseFloat(time) || 0,
          scoringMethod,
          paladinPenalties,
          defensiveHits,
          defensivePenalties,
          result,
        }}
      />

      {/* ─── MODALS ─── */}

      <Modal isOpen={activeModal === 'scoring-info'} onClose={() => setActiveModal(null)} title="Metodi di Punteggio" maxWidth="600px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '16px', color: 'var(--lssa-accent)', marginBottom: '8px' }}>Paladin (LSSA)</h4>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Il punteggio PALADIN prevede l'aggiunta delle penalità, espresse in secondi, al tempo impiegato per l'esecuzione dell'esercizio. <strong>Vince il tempo totale più basso.</strong></p>
            <div style={{ padding: '12px', backgroundColor: 'var(--card-bg)', borderRadius: '8px', margin: '12px 0 0 0', textAlign: 'center' }}>
              <span style={{ fontWeight: 700, color: 'var(--lssa-accent)' }}>Score</span> = Tempo + Penalità (sec)
            </div>
          </div>
          <div style={{ padding: '16px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '16px', color: 'var(--lssa-accent)', marginBottom: '8px' }}>Defensive Count (FIIDS)</h4>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Il conteggio Defensive Count converte i Points Down (punti persi dalla precisione massima) in tempo aggiuntivo (0.5 sec per PD) e lo somma a tempo e penalità. <strong>Vince il tempo totale più basso.</strong></p>
            <div style={{ padding: '12px', backgroundColor: 'var(--card-bg)', borderRadius: '8px', margin: '12px 0 0 0', textAlign: 'center' }}>
              <span style={{ fontWeight: 700, color: 'var(--lssa-accent)' }}>Score</span> = Tempo + (PD × 0.5) + Penalità (sec)
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'paladin-penalties'} onClose={() => setActiveModal(null)} title="Penalità LSSA – Paladin" maxWidth="600px">
        <p style={{ marginBottom: '16px' }}>Nel sistema Paladin, le penalità sono espresse in secondi aggiunti al tempo di esecuzione. Sono previste dal Regolamento LSSA (par. 3.4).</p>
        <div style={{ padding: '20px', background: 'rgba(255, 59, 48, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--danger-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <strong style={{ color: 'var(--danger-color)', fontSize: '16px' }}>FTN – Failure To Neutralize (+5'')</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Assegnata quando un bersaglio non è neutralizzato: serve 1 colpo in zona "5" oppure 2 colpi in qualsiasi zona legale (Reg. 3.4.1).</p>
          </div>
          <div style={{ borderTop: '1px solid rgba(255, 59, 48, 0.1)', paddingTop: '16px' }}>
            <strong style={{ color: 'var(--danger-color)', fontSize: '16px' }}>Procedura (+5'')</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Assegnata quando il tiratore non esegue correttamente una procedura specificata nel briefing (Reg. 3.4.2).</p>
          </div>
          <div style={{ borderTop: '1px solid rgba(255, 59, 48, 0.1)', paddingTop: '16px' }}>
            <strong style={{ color: 'var(--danger-color)', fontSize: '16px' }}>HNT – Hit Not Threat (+10'')</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Assegnata quando il tiratore colpisce un bersaglio penalty (non minaccioso). Una sola penalità per bersaglio, indipendentemente dal numero di colpi (Reg. 3.4.3).</p>
          </div>
          <div style={{ borderTop: '1px solid rgba(255, 59, 48, 0.1)', paddingTop: '16px' }}>
            <strong style={{ color: 'var(--danger-color)', fontSize: '16px' }}>FTE – Failure To Engage (+15'')</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Assegnata per ogni bersaglio che il tiratore non ingaggia (Reg. 3.4.4). Non vengono assegnate penalità FTN aggiuntive.</p>
          </div>
          <div style={{ borderTop: '1px solid rgba(255, 59, 48, 0.1)', paddingTop: '16px' }}>
            <strong style={{ color: 'var(--danger-color)', fontSize: '16px' }}>FTDR – Failure To Do Right (+20'')</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Assegnata quando il tiratore aggira le regole compromettendo lo spirito dell'esercizio (Reg. 3.4.5).</p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'defensive-hits'} onClose={() => setActiveModal(null)} title="Bersaglio e Points Down (FIIDS)" maxWidth="600px">
        <p style={{ marginBottom: '16px' }}>Il bersaglio ufficiale FIIDS è composto da due box (superiore A e inferiore B). Il conteggio opera a "sottrazione dei punti" (Points Down). Più alto è il PD totale, maggiore è il tempo aggiunto al tuo score.</p>
        <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <strong style={{ color: 'var(--lssa-accent)', fontSize: '16px' }}>Zona -0 (Centro)</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Colpo perfetto nella zona di massimo punteggio (box superiore A o rettangolo centrale del box B). Nessun punto da sottrarre.</p>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <strong style={{ color: 'var(--lssa-warn)', fontSize: '16px' }}>Zona -2</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Colpo nella zona intermedia del bersaglio. 2 punti sottratti = +1 secondo al tempo totale.</p>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <strong style={{ color: 'var(--lssa-warn)', fontSize: '16px' }}>Zona -3</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Colpo nella zona periferica. 3 punti sottratti = +1.5 secondi al tempo totale.</p>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <strong style={{ color: 'var(--danger-color)', fontSize: '16px' }}>Miss (-5 PD)</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Colpo mancante sul bersaglio. 5 punti sottratti = +2.5 secondi al tempo totale.</p>
          </div>
        </div>
        <div style={{ padding: '12px', backgroundColor: 'var(--card-bg)', borderRadius: '8px', marginTop: '16px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
          <span style={{ fontWeight: 700, color: 'var(--lssa-accent)' }}>Tempo PD</span> = Points Down totali × 0.5 secondi
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'defensive-penalties'} onClose={() => setActiveModal(null)} title="Penalità FIIDS – Defensive Count" maxWidth="600px">
        <p style={{ marginBottom: '16px' }}>Le penalità FIIDS si sommano in secondi al tempo totale (Regolamento FIIDS, par. 3).</p>
        <div style={{ padding: '20px', background: 'rgba(255, 59, 48, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--danger-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <strong style={{ color: 'var(--danger-color)', fontSize: '16px' }}>Penalty – Bersaglio Penalty (+5'')</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Per ogni bersaglio "penalty" colpito. Una sola penalità per bersaglio anche con più colpi (Reg. 3.3).</p>
          </div>
          <div style={{ borderTop: '1px solid rgba(255, 59, 48, 0.1)', paddingTop: '16px' }}>
            <strong style={{ color: 'var(--danger-color)', fontSize: '16px' }}>FTE – Mancato Ingaggio (+5'')</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Per ogni bersaglio previsto ma non ingaggiato. Ai PD per i colpi mancanti si aggiunge questa penalità (Reg. 3.3).</p>
          </div>
          <div style={{ borderTop: '1px solid rgba(255, 59, 48, 0.1)', paddingTop: '16px' }}>
            <strong style={{ color: 'var(--danger-color)', fontSize: '16px' }}>Procedura (+3'')</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Errore nell'esecuzione dell'esercizio: cambio caricatore errato, copertura non rispettata, mano sbagliata, ecc. (Reg. 3.4).</p>
          </div>
          <div style={{ borderTop: '1px solid rgba(255, 59, 48, 0.1)', paddingTop: '16px' }}>
            <strong style={{ color: 'var(--danger-color)', fontSize: '16px' }}>Antisportivo (+8'')</strong>
            <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Condotta antisportiva, azioni sleali o uso di equipaggiamento non idoneo (Reg. 3.2).</p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'downloads'} onClose={() => setActiveModal(null)} title="Scarica i Regolamenti Ufficiali" maxWidth="500px">
        <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Scarica sul tuo dispositivo i file PDF ufficiali dei regolamenti LSSA e FIIDS.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a href="/regolamenti/Regolamento_LSSA_edizione_2013_versione_1_5_01GEN2020.pdf" download className="download-card">
            <FileText size={20} color="var(--lssa-accent)" /><div style={{ flex: 1 }}><strong>Regolamento LSSA Rifle</strong><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Edizione 2013, Versione 1.5 (GEN 2020)</div></div><Download size={18} />
          </a>
          <a href="/regolamenti/Regolamento_FIIDS_12_aprile.pdf" download className="download-card">
            <FileText size={20} color="var(--lssa-accent)" /><div style={{ flex: 1 }}><strong>Regolamento FIIDS</strong><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Edizione 2011, Versione 1.1</div></div><Download size={18} />
          </a>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'rules'} onClose={() => setActiveModal(null)} title="Manuale LSSA / FIIDS" maxWidth="950px">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
          {[
            { id: 'safety', label: 'Sicurezza & DQ' },
            { id: 'divisions', label: 'Divisioni' },
            { id: 'targets', label: 'Bersagli' },
            { id: 'scoring', label: 'Punteggio' },
            { id: 'procedure', label: 'Procedure' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setRulesTab(tab.id)} style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', backgroundColor: rulesTab === tab.id ? 'var(--lssa-accent)' : 'var(--bg-color)', color: rulesTab === tab.id ? '#FFF' : 'var(--text-secondary)', transition: 'var(--transition)', border: 'none', cursor: 'pointer' }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: '12px' }}>
          {rulesTab === 'safety' && (
            <div className="fade-in">
              <h3 style={{ color: 'var(--danger-color)', marginBottom: '16px', fontSize: '18px' }}>Sicurezza e Squalifiche</h3>
              <p style={{ fontSize: '14px', marginBottom: '20px', color: 'var(--text-secondary)' }}>Le competizioni LSSA/FIIDS devono essere progettate, realizzate e condotte ponendo particolare attenzione alla sicurezza.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--danger-color)', marginBottom: '10px' }}>Regole Fondamentali (LSSA 1.x / FIIDS 1.x)</h4>
                  <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>Trattare qualunque arma come se fosse carica</li>
                    <li>Non puntare mai l'arma verso qualcosa che non si vuole colpire</li>
                    <li>Tenere il dito fuori dal ponticello fino a quando le mire non sono allineate sul bersaglio</li>
                    <li>Essere sempre consapevoli del bersaglio e di cosa c'è dietro</li>
                  </ul>
                </div>
                <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--danger-color)', marginBottom: '10px' }}>Squalifica (DQ)</h4>
                  <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>Scarico accidentale dell'arma in condizioni di pericolo</li>
                    <li>Puntamento dell'arma verso persone (incluso se stessi)</li>
                    <li>Superamento degli angoli di sicurezza</li>
                    <li>Maneggiamento dell'arma fuori dalla linea di tiro senza autorizzazione</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {rulesTab === 'divisions' && (
            <div className="fade-in">
              <h3 style={{ color: 'var(--lssa-accent)', marginBottom: '16px', fontSize: '18px' }}>Divisioni LSSA / FIIDS</h3>
              <h4 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--text-primary)' }}>Categoria RIFLE (LSSA)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Tactical Scope (Rifle Open)</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Calibri fino al 7,62×39 mm. Sistema ottico ammesso, bipiede consentito. PF ≥ 150.</p>
                </div>
                <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Tactical Scope 22</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Calibro .22 LR con sistema ottico. Bipiede consentito.</p>
                </div>
                <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>AK47 Limited</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Esclusivamente 7,62×39 mm, solo mire metalliche. No ottiche, no bipiede. PF ≥ 150.</p>
                </div>
              </div>
              <h4 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--text-primary)' }}>Categoria HANDGUN (LSSA / FIIDS)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                {[
                  { name: 'Stock (SD)', desc: 'DA/SA o Safe Action, cal. 9×19 mm+, PF 125, 15 colpi' },
                  { name: 'Custom 9/.40', desc: 'Cal. 9mm/.40, PF Minor 125, PF Major 163 (.40), 15 colpi' },
                  { name: 'Custom .45 (CD)', desc: 'Solo .45 ACP, PF Major 163, 8 colpi' },
                  { name: 'Open', desc: 'Cal. 9mm+, ottiche e compensatori ammessi, PF 125' },
                  { name: 'Striker', desc: 'Safe Action, cal. 9mm+, PF 125, peso scatto 2.27 kg' },
                  { name: 'Optics', desc: 'Come Stock ma con mire optoelettroniche, PF 125' },
                  { name: 'Subgun', desc: 'Cal. 9-45, ottiche e compensatori ammessi, 15 colpi' },
                ].map(d => (
                  <div key={d.name} style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '12px' }}>
                    <h4 style={{ fontSize: '14px', marginBottom: '6px' }}>{d.name}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{d.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rulesTab === 'targets' && (
            <div className="fade-in">
              <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Bersagli</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '15px', marginBottom: '10px', color: 'var(--lssa-accent)' }}>Bersaglio LSSA (Allegato A)</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Bersagli cartacei di colore bianco con zona "5" centrale. Neutralizzazione: <strong>1 colpo in zona "5"</strong> oppure <strong>2 colpi in qualsiasi zona legale</strong>. I bersagli metallici sono neutralizzati quando completamente abbattuti (distanza minima Rifle: 50 mt, Handgun: 9 mt).</p>
                </div>
                <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '15px', marginBottom: '10px', color: 'var(--lssa-accent)' }}>Bersaglio FIIDS</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>Composto da due box collegati (A superiore, B inferiore) inscritti in un rettangolo 70×46 cm. Zone: <strong>-0</strong> (massimo punteggio, box A + centro box B), <strong>-2</strong> (intermedia), <strong>-3</strong> (periferica). Bordo esterno (1 cm dal bordo): colpi considerati Miss.</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>I bersagli metallici valgono zona -0 se colpiti. Se non colpiti/abbattuti: conteggiati come Miss (-5 PD). Distanza minima: 9 mt.</p>
                </div>
                <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '15px', marginBottom: '10px', color: 'var(--danger-color)' }}>Bersagli Penalty</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Chiaramente distinguibili (colore rosso o specificato nel briefing). Possono essere anche "parzializzati": una parte penalty e una parte valida. La parte nera (hard cover) annulla i colpi. Rapporto massimo FIIDS: 1 penalty ogni 2 ingaggiabili.</p>
                </div>
              </div>
            </div>
          )}

          {rulesTab === 'scoring' && (
            <div className="fade-in">
              <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Sistemi di Punteggio</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', border: '2px solid var(--lssa-accent)' }}>
                  <h4 style={{ fontSize: '16px', color: 'var(--lssa-accent)', marginBottom: '12px' }}>Paladin (LSSA – Reg. 3.2)</h4>
                  <div style={{ padding: '12px', backgroundColor: 'var(--card-bg)', borderRadius: '8px', textAlign: 'center', marginBottom: '12px' }}>
                    <strong style={{ color: 'var(--lssa-accent)' }}>Score = Tempo + Penalità (sec)</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {[
                          ['FTN', 'Mancata Neutralizzazione', '+5 sec'],
                          ['PROC', 'Errore di Procedura', '+5 sec'],
                          ['HNT', 'Hit Not Threat', '+10 sec'],
                          ['FTE', 'Failure To Engage', '+15 sec'],
                          ['FTDR', 'Failure To Do Right', '+20 sec'],
                        ].map(([code, desc, pen]) => (
                          <tr key={code} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px', fontWeight: 700 }}>{code}</td>
                            <td style={{ padding: '8px' }}>{desc}</td>
                            <td style={{ padding: '8px', fontWeight: 700, color: 'var(--danger-color)' }}>{pen}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', border: '2px solid var(--lssa-accent)' }}>
                  <h4 style={{ fontSize: '16px', color: 'var(--lssa-accent)', marginBottom: '12px' }}>Defensive Count (FIIDS – Reg. 16.3)</h4>
                  <div style={{ padding: '12px', backgroundColor: 'var(--card-bg)', borderRadius: '8px', textAlign: 'center', marginBottom: '12px' }}>
                    <strong style={{ color: 'var(--lssa-accent)' }}>Score = Tempo + (Points Down × 0.5) + Penalità (sec)</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    <strong>Points Down:</strong> -0 (0 PD), -2 (2 PD), -3 (3 PD), Miss (5 PD)
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {[
                          ['Penalty', 'Bersaglio Penalty colpito', '+5 sec'],
                          ['FTE', 'Mancato Ingaggio', '+5 sec'],
                          ['PROC', 'Errore di Procedura', '+3 sec'],
                          ['Antisportivo', 'Condotta Antisportiva', '+8 sec'],
                        ].map(([code, desc, pen]) => (
                          <tr key={code} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px', fontWeight: 700 }}>{code}</td>
                            <td style={{ padding: '8px' }}>{desc}</td>
                            <td style={{ padding: '8px', fontWeight: 700, color: 'var(--danger-color)' }}>{pen}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {rulesTab === 'procedure' && (
            <div className="fade-in">
              <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Comandi e Procedure di Gara</h3>
              <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '15px', marginBottom: '12px' }}>Comandi Ufficiali (LSSA 3.1.15 / FIIDS 2.15)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, auto) 1fr', gap: '10px', fontSize: '13px' }}>
                  {[
                    ['"Load and Make Ready"', 'Carica l\'arma e preparati'],
                    ['"Shooter Ready?"', 'Tiratore pronto?'],
                    ['"Standby"', 'Attenzione – segnale acustico imminente'],
                    ['"Finger"', 'Dito fuori dal ponticello'],
                    ['"Muzzle"', 'Attenzione alla volata'],
                    ['"Stop"', 'Cessare immediatamente il fuoco'],
                    ['"Cover"', 'Rispettare la copertura'],
                    ['"Unload and Show Clear"', 'Scarica l\'arma e mostra la camera vuota'],
                    ['"Hammer Down"', 'Abbatti il cane'],
                    ['"Holster"', 'Rifodera l\'arma'],
                    ['"Range is Safe"', 'Il campo è sicuro'],
                  ].map(([cmd, desc]) => (
                    <React.Fragment key={cmd}>
                      <div style={{ fontWeight: 700, color: 'var(--lssa-accent)' }}>{cmd}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{desc}</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '15px', marginBottom: '12px' }}>Condizioni di Partenza (LSSA 3.1.16)</h4>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div><strong>Condizione 1:</strong> Colpo camerato, caricatore inserito, sicura inserita (se presente).</div>
                  <div><strong>Condizione 2:</strong> Colpo NON camerato, caricatore inserito, azione chiusa, sicura non inserita.</div>
                  <div><strong>Condizione 3:</strong> Colpo NON camerato, caricatore NON inserito, azione chiusa.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
