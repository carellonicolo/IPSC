import React, { useState, useCallback } from 'react';
import { getMatches, getMatch, createMatch, deleteMatch, addShooter, deleteShooter, deleteStage } from '../utils/matchStorage';
import { Plus, Trash2, ChevronRight, ArrowLeft, Users, Target, Clock, Trophy } from 'lucide-react';

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

export default function GareTab({ discipline }) {
  const [view, setView] = useState('matches'); // 'matches' | 'shooters' | 'stages'
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [selectedShooterId, setSelectedShooterId] = useState(null);
  const [newMatchName, setNewMatchName] = useState('');
  const [showNewMatch, setShowNewMatch] = useState(false);
  const [newShooterName, setNewShooterName] = useState('');
  const [showNewShooter, setShowNewShooter] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const matches = getMatches(discipline);
  const selectedMatch = selectedMatchId ? getMatch(selectedMatchId) : null;
  const selectedShooter = selectedMatch?.shooters.find(s => s.id === selectedShooterId) || null;

  const isLssa = discipline === 'lssa';
  const accentVar = isLssa ? 'var(--lssa-accent)' : 'var(--accent-color)';

  const handleCreateMatch = () => {
    if (!newMatchName.trim()) return;
    const m = createMatch(newMatchName, discipline);
    setNewMatchName('');
    setShowNewMatch(false);
    setSelectedMatchId(m.id);
    setView('shooters');
    refresh();
  };

  const handleDeleteMatch = (e, matchId) => {
    e.stopPropagation();
    if (confirm('Eliminare questa gara e tutti i dati salvati?')) {
      deleteMatch(matchId);
      if (selectedMatchId === matchId) {
        setSelectedMatchId(null);
        setView('matches');
      }
      refresh();
    }
  };

  const handleAddShooter = () => {
    if (!newShooterName.trim() || !selectedMatchId) return;
    addShooter(selectedMatchId, newShooterName);
    setNewShooterName('');
    setShowNewShooter(false);
    refresh();
  };

  const handleDeleteShooter = (e, shooterId) => {
    e.stopPropagation();
    if (confirm('Eliminare questo tiratore e tutti i suoi stage?')) {
      deleteShooter(selectedMatchId, shooterId);
      if (selectedShooterId === shooterId) {
        setSelectedShooterId(null);
        setView('shooters');
      }
      refresh();
    }
  };

  const handleDeleteStage = (stageId) => {
    if (confirm('Eliminare questo stage?')) {
      deleteStage(selectedMatchId, selectedShooterId, stageId);
      refresh();
    }
  };

  const goToShooters = (matchId) => {
    setSelectedMatchId(matchId);
    setView('shooters');
  };

  const goToStages = (shooterId) => {
    setSelectedShooterId(shooterId);
    setView('stages');
  };

  const goBack = () => {
    if (view === 'stages') { setSelectedShooterId(null); setView('shooters'); }
    else if (view === 'shooters') { setSelectedMatchId(null); setView('matches'); }
  };

  // ─── RENDER: STAGE DETAIL ──────────────────────────
  const renderStageDetail = (stage) => {
    if (stage.discipline === 'ipsc' || (!stage.discipline && !isLssa)) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: accentVar }}>
              HF {stage.result?.hitFactor?.toFixed(4) ?? '—'}
            </span>
            <span style={{ fontWeight: 600 }}>{stage.time?.toFixed(2) ?? '—'}''</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span>Punti: <strong style={{ color: 'var(--text-primary)' }}>{stage.result?.stageScore ?? 0}</strong></span>
            {stage.result?.totalPenalties > 0 && <span style={{ color: 'var(--danger-color)' }}>Pen: -{stage.result.totalPenalties}</span>}
            <span>PF: <strong>{stage.isMajor ? 'Major' : 'Minor'}</strong></span>
          </div>
          {stage.hits && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px', opacity: 0.8 }}>
              {stage.hits.A > 0 && <span>A:{stage.hits.A}</span>}
              {stage.hits.C > 0 && <span>C:{stage.hits.C}</span>}
              {stage.hits.D > 0 && <span>D:{stage.hits.D}</span>}
              {stage.hits.M > 0 && <span style={{ color: 'var(--danger-color)' }}>M:{stage.hits.M}</span>}
              {stage.hits.NS > 0 && <span style={{ color: 'var(--danger-color)' }}>NS:{stage.hits.NS}</span>}
              {stage.hits.PROC > 0 && <span style={{ color: 'var(--danger-color)' }}>PROC:{stage.hits.PROC}</span>}
            </div>
          )}
        </div>
      );
    }

    // LSSA
    const r = stage.result || {};
    if (stage.scoringMethod === 'defensive') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: accentVar }}>
              {r.totalTime?.toFixed(2) ?? '—'}<span style={{ fontSize: '14px', fontWeight: 600 }}> sec</span>
            </span>
            <span style={{ fontWeight: 600 }}>Defensive Count</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span>Tempo: <strong style={{ color: 'var(--text-primary)' }}>{r.rawTime?.toFixed(2) ?? 0}''</strong></span>
            {r.pointsDownTime > 0 && <span>PD: +{r.pointsDownTime?.toFixed(2)}'' ({r.totalPointsDown} PD)</span>}
            {r.penaltyTime > 0 && <span style={{ color: 'var(--danger-color)' }}>Pen: +{r.penaltyTime?.toFixed(2)}''</span>}
          </div>
          {stage.defensiveHits && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px', opacity: 0.8 }}>
              {stage.defensiveHits.ZERO > 0 && <span>-0:{stage.defensiveHits.ZERO}</span>}
              {stage.defensiveHits.DOWN2 > 0 && <span>-2:{stage.defensiveHits.DOWN2}</span>}
              {stage.defensiveHits.DOWN3 > 0 && <span>-3:{stage.defensiveHits.DOWN3}</span>}
              {stage.defensiveHits.MISS > 0 && <span style={{ color: 'var(--danger-color)' }}>Miss:{stage.defensiveHits.MISS}</span>}
            </div>
          )}
        </div>
      );
    }

    // Paladin
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '24px', fontWeight: 800, color: accentVar }}>
            {r.totalTime?.toFixed(2) ?? '—'}<span style={{ fontSize: '14px', fontWeight: 600 }}> sec</span>
          </span>
          <span style={{ fontWeight: 600 }}>Paladin</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <span>Tempo: <strong style={{ color: 'var(--text-primary)' }}>{r.rawTime?.toFixed(2) ?? 0}''</strong></span>
          {r.penaltyTime > 0 && <span style={{ color: 'var(--danger-color)' }}>Pen: +{r.penaltyTime?.toFixed(2)}''</span>}
        </div>
        {stage.paladinPenalties && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px', opacity: 0.8 }}>
            {stage.paladinPenalties.FTN > 0 && <span>FTN:{stage.paladinPenalties.FTN}</span>}
            {stage.paladinPenalties.PROC > 0 && <span>PROC:{stage.paladinPenalties.PROC}</span>}
            {stage.paladinPenalties.HNT > 0 && <span>HNT:{stage.paladinPenalties.HNT}</span>}
            {stage.paladinPenalties.FTE > 0 && <span>FTE:{stage.paladinPenalties.FTE}</span>}
            {stage.paladinPenalties.FTDR > 0 && <span>FTDR:{stage.paladinPenalties.FTDR}</span>}
          </div>
        )}
      </div>
    );
  };

  // ─── RENDER: MATCHES LIST ──────────────────────────
  if (view === 'matches') {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Le tue Gare</h2>
          <button
            onClick={() => setShowNewMatch(!showNewMatch)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 600, background: accentVar, color: '#FFF', boxShadow: `0 4px 12px ${isLssa ? 'rgba(52,199,89,0.3)' : 'rgba(0,122,255,0.3)'}` }}
          >
            <Plus size={16} /> Nuova Gara
          </button>
        </div>

        {showNewMatch && (
          <div className="card" style={{ padding: '16px', marginBottom: '12px', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newMatchName}
              onChange={(e) => setNewMatchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateMatch()}
              placeholder="Nome gara..."
              autoFocus
              style={{ flex: 1, padding: '12px', fontSize: '15px' }}
            />
            <button
              onClick={handleCreateMatch}
              disabled={!newMatchName.trim()}
              style={{ padding: '12px 20px', borderRadius: 'var(--border-radius-sm)', background: accentVar, color: '#FFF', fontWeight: 600, fontSize: '14px', opacity: newMatchName.trim() ? 1 : 0.5 }}
            >
              Crea
            </button>
          </div>
        )}

        {matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <Trophy size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ fontSize: '16px', fontWeight: 600 }}>Nessuna gara salvata</p>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>Crea la tua prima gara per iniziare</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {matches.map(m => (
              <div
                key={m.id}
                onClick={() => goToShooters(m.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goToShooters(m.id)}
                className="card"
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '0', textAlign: 'left', width: '100%' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '12px', marginTop: '4px' }}>
                    <span>{formatDate(m.createdAt)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={13} /> {m.shooters.length} tiratori</span>
                    <span>{m.shooters.reduce((acc, s) => acc + s.stages.length, 0)} stage</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={(e) => handleDeleteMatch(e, m.id)}
                    style={{ padding: '8px', color: 'var(--danger-color)', borderRadius: '50%' }}
                    aria-label="Elimina gara"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight size={18} color="var(--text-secondary)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── RENDER: SHOOTERS LIST ─────────────────────────
  if (view === 'shooters' && selectedMatch) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <button onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: accentVar, marginBottom: '16px', padding: '4px 0' }}>
          <ArrowLeft size={18} /> Le tue Gare
        </button>
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{selectedMatch.name}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatDate(selectedMatch.createdAt)}</p>
          </div>
          <button
            onClick={() => setShowNewShooter(!showNewShooter)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 600, background: accentVar, color: '#FFF', boxShadow: `0 4px 12px ${isLssa ? 'rgba(52,199,89,0.3)' : 'rgba(0,122,255,0.3)'}` }}
          >
            <Plus size={16} /> Tiratore
          </button>
        </div>

        {showNewShooter && (
          <div className="card" style={{ padding: '16px', marginBottom: '12px', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newShooterName}
              onChange={(e) => setNewShooterName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddShooter()}
              placeholder="Nome tiratore..."
              autoFocus
              style={{ flex: 1, padding: '12px', fontSize: '15px' }}
            />
            <button
              onClick={handleAddShooter}
              disabled={!newShooterName.trim()}
              style={{ padding: '12px 20px', borderRadius: 'var(--border-radius-sm)', background: accentVar, color: '#FFF', fontWeight: 600, fontSize: '14px', opacity: newShooterName.trim() ? 1 : 0.5 }}
            >
              Aggiungi
            </button>
          </div>
        )}

        {selectedMatch.shooters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <Users size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ fontSize: '16px', fontWeight: 600 }}>Nessun tiratore</p>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>Aggiungi i tiratori della gara</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedMatch.shooters.map(s => (
              <div
                key={s.id}
                onClick={() => goToStages(s.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goToStages(s.id)}
                className="card"
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: '0', textAlign: 'left', width: '100%' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {s.stages.length} stage salvati
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={(e) => handleDeleteShooter(e, s.id)}
                    style={{ padding: '8px', color: 'var(--danger-color)', borderRadius: '50%' }}
                    aria-label="Elimina tiratore"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight size={18} color="var(--text-secondary)" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── RENDER: STAGES LIST ───────────────────────────
  if (view === 'stages' && selectedMatch && selectedShooter) {
    const stages = [...selectedShooter.stages].sort((a, b) => a.stageNumber - b.stageNumber);
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <button onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: accentVar, marginBottom: '16px', padding: '4px 0' }}>
          <ArrowLeft size={18} /> {selectedMatch.name}
        </button>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{selectedShooter.name}</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{stages.length} stage salvati</p>
        </div>

        {stages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <Target size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ fontSize: '16px', fontWeight: 600 }}>Nessuno stage salvato</p>
            <p style={{ fontSize: '14px', marginTop: '4px' }}>Usa lo Score Calculator per calcolare e salvare i risultati</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stages.map(stage => (
              <div key={stage.id} className="card" style={{ padding: '16px 20px', marginBottom: '0' }}>
                <div className="flex-between" style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: accentVar, color: '#FFF', fontSize: '13px', fontWeight: 700 }}>
                      {stage.stageNumber}
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: 700 }}>Stage {stage.stageNumber}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {formatDate(stage.savedAt)} {formatTime(stage.savedAt)}
                    </span>
                    <button
                      onClick={() => handleDeleteStage(stage.id)}
                      style={{ padding: '6px', color: 'var(--danger-color)', borderRadius: '50%' }}
                      aria-label="Elimina stage"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {renderStageDetail(stage)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
