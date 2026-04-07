import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import { getMatches, createMatch, addShooter, addStage, getMatch } from '../utils/matchStorage';
import { Plus, Check, ChevronRight } from 'lucide-react';

export default function SaveStageModal({ isOpen, onClose, discipline, currentState, onSaved }) {
  const [step, setStep] = useState(1); // 1=match, 2=shooter, 3=confirm
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [selectedShooterId, setSelectedShooterId] = useState(null);
  const [newMatchName, setNewMatchName] = useState('');
  const [newShooterName, setNewShooterName] = useState('');
  const [stageNumber, setStageNumber] = useState(1);
  const [saved, setSaved] = useState(false);

  const isLssa = discipline === 'lssa';
  const accentVar = isLssa ? 'var(--lssa-accent)' : 'var(--accent-color)';
  const accentShadow = isLssa ? 'rgba(52,199,89,0.3)' : 'rgba(0,122,255,0.3)';

  const matches = useMemo(() => isOpen ? getMatches(discipline) : [], [isOpen, discipline, saved]);
  const selectedMatch = selectedMatchId ? getMatch(selectedMatchId) : null;
  const selectedShooter = selectedMatch?.shooters.find(s => s.id === selectedShooterId) || null;

  const handleClose = () => {
    setStep(1);
    setSelectedMatchId(null);
    setSelectedShooterId(null);
    setNewMatchName('');
    setNewShooterName('');
    setSaved(false);
    onClose();
  };

  const handleSelectMatch = (matchId) => {
    setSelectedMatchId(matchId);
    setStep(2);
  };

  const handleCreateMatch = () => {
    if (!newMatchName.trim()) return;
    const m = createMatch(newMatchName, discipline);
    setNewMatchName('');
    setSelectedMatchId(m.id);
    setStep(2);
  };

  const handleSelectShooter = (shooterId) => {
    setSelectedShooterId(shooterId);
    const match = getMatch(selectedMatchId);
    const shooter = match?.shooters.find(s => s.id === shooterId);
    setStageNumber((shooter?.stages.length ?? 0) + 1);
    setStep(3);
  };

  const handleCreateShooter = () => {
    if (!newShooterName.trim() || !selectedMatchId) return;
    const s = addShooter(selectedMatchId, newShooterName);
    setNewShooterName('');
    if (s) {
      setSelectedShooterId(s.id);
      setStageNumber(1);
      setStep(3);
    }
  };

  const handleSave = () => {
    if (!selectedMatchId || !selectedShooterId) return;
    addStage(selectedMatchId, selectedShooterId, {
      stageNumber,
      discipline,
      ...currentState,
    });
    setSaved(true);
    if (onSaved) onSaved();
    setTimeout(() => handleClose(), 800);
  };

  if (!isOpen) return null;

  // Success feedback
  if (saved) {
    return (
      <Modal isOpen={true} onClose={handleClose} title="Stage Salvato" maxWidth="400px">
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: accentVar, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Check size={32} color="#FFF" strokeWidth={3} />
          </div>
          <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Salvato!</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Stage {stageNumber} — {selectedShooter?.name}
          </p>
        </div>
      </Modal>
    );
  }

  // Step 1: Select Match
  if (step === 1) {
    return (
      <Modal isOpen={true} onClose={handleClose} title="Seleziona Gara" maxWidth="450px">
        <div style={{ maxHeight: '50vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {matches.map(m => (
            <button
              key={m.id}
              onClick={() => handleSelectMatch(m.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', width: '100%', textAlign: 'left' }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.shooters.length} tiratori</div>
              </div>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </button>
          ))}

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newMatchName}
                onChange={(e) => setNewMatchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateMatch()}
                placeholder="Nuova gara..."
                style={{ flex: 1, padding: '12px', fontSize: '14px' }}
              />
              <button
                onClick={handleCreateMatch}
                disabled={!newMatchName.trim()}
                style={{ padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: accentVar, color: '#FFF', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', opacity: newMatchName.trim() ? 1 : 0.5 }}
              >
                <Plus size={16} /> Crea
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  // Step 2: Select Shooter
  if (step === 2 && selectedMatch) {
    return (
      <Modal isOpen={true} onClose={handleClose} title="Seleziona Tiratore" maxWidth="450px">
        <button
          onClick={() => { setSelectedMatchId(null); setStep(1); }}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: accentVar, marginBottom: '12px', padding: '0' }}
        >
          ← {selectedMatch.name}
        </button>

        <div style={{ maxHeight: '50vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {selectedMatch.shooters.map(s => (
            <button
              key={s.id}
              onClick={() => handleSelectShooter(s.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', width: '100%', textAlign: 'left' }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.stages.length} stage</div>
              </div>
              <ChevronRight size={16} color="var(--text-secondary)" />
            </button>
          ))}

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newShooterName}
                onChange={(e) => setNewShooterName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateShooter()}
                placeholder="Nuovo tiratore..."
                style={{ flex: 1, padding: '12px', fontSize: '14px' }}
              />
              <button
                onClick={handleCreateShooter}
                disabled={!newShooterName.trim()}
                style={{ padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: accentVar, color: '#FFF', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', opacity: newShooterName.trim() ? 1 : 0.5 }}
              >
                <Plus size={16} /> Aggiungi
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  // Step 3: Confirm & Save
  if (step === 3 && selectedMatch && selectedShooter) {
    const previewLabel = discipline === 'ipsc'
      ? `HF ${currentState.result?.hitFactor?.toFixed(4) ?? '—'}`
      : `${currentState.result?.totalTime?.toFixed(2) ?? '—'} sec`;

    return (
      <Modal isOpen={true} onClose={handleClose} title="Conferma Salvataggio" maxWidth="450px">
        <button
          onClick={() => { setSelectedShooterId(null); setStep(2); }}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: accentVar, marginBottom: '16px', padding: '0' }}
        >
          ← {selectedMatch.name} / {selectedShooter.name}
        </button>

        <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Gara</span>
            <span style={{ fontSize: '14px', fontWeight: 700 }}>{selectedMatch.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tiratore</span>
            <span style={{ fontSize: '14px', fontWeight: 700 }}>{selectedShooter.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Stage N°</span>
            <input
              type="number"
              inputMode="numeric"
              value={stageNumber}
              onChange={(e) => setStageNumber(parseInt(e.target.value) || 1)}
              min="1"
              style={{ width: '80px', padding: '8px 12px', fontSize: '16px', fontWeight: 700, textAlign: 'center' }}
            />
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Risultato</span>
            <div style={{ fontSize: '28px', fontWeight: 800, color: accentVar, marginTop: '4px' }}>{previewLabel}</div>
          </div>
        </div>

        <button
          onClick={handleSave}
          style={{ width: '100%', padding: '16px', background: accentVar, color: '#FFF', borderRadius: 'var(--border-radius-md)', fontWeight: 700, fontSize: '16px', boxShadow: `0 4px 12px ${accentShadow}`, letterSpacing: '0.3px' }}
        >
          Salva Stage
        </button>
      </Modal>
    );
  }

  return null;
}
