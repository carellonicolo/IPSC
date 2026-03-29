import React, { useState, useMemo, useRef } from 'react';
import { Crosshair, RotateCcw, Scale, CheckCircle2, XCircle, Info } from 'lucide-react';

const GAUGE_MAX = 250;

function classifyPF(pf) {
  if (pf >= 170) return { classification: 'MAJOR', color: '#34C759', bgGlow: 'rgba(52, 199, 89, 0.15)' };
  if (pf >= 160) return { classification: 'MAJOR (Open 9mm)', color: '#30D158', bgGlow: 'rgba(48, 209, 88, 0.12)' };
  if (pf >= 125) return { classification: 'MINOR', color: '#FF9F0A', bgGlow: 'rgba(255, 159, 10, 0.12)' };
  return { classification: 'INSUFFICIENTE', color: '#FF3B30', bgGlow: 'rgba(255, 59, 48, 0.12)' };
}

function calcPF(weight, avgVelocity) {
  return Math.floor((weight * avgVelocity) / 1000);
}

function avgTopN(velocities, n) {
  const sorted = [...velocities].sort((a, b) => b - a);
  return sorted.slice(0, n).reduce((s, v) => s + v, 0) / Math.min(n, sorted.length);
}

function ChronoCheck() {
  const [bulletWeight, setBulletWeight] = useState('');
  const [bulletWeight2, setBulletWeight2] = useState('');
  const [velocities, setVelocities] = useState(['', '', '', '', '', '', '']);
  const [declaredPF, setDeclaredPF] = useState('major');
  const inputRefs = useRef([]);

  const filledCount = velocities.filter(v => v !== '' && parseFloat(v) > 0).length;

  const results = useMemo(() => {
    const w = parseFloat(bulletWeight);
    const w2 = parseFloat(bulletWeight2);
    if (!w || w <= 0) return null;

    const parsed = velocities.map(v => parseFloat(v)).filter(v => v > 0);
    const pfFloor = declaredPF === 'major' ? 170 : 125;

    let test1 = null;
    if (parsed.length >= 3) {
      const avg = (parsed[0] + parsed[1] + parsed[2]) / 3;
      const pf = calcPF(w, avg);
      test1 = { pf, avg: avg.toFixed(1), pass: pf >= pfFloor, ...classifyPF(pf) };
    }

    let test2 = null;
    if (parsed.length >= 4) {
      const available = parsed.slice(0, 6);
      const avg = avgTopN(available, 3);
      const pf = calcPF(w, avg);
      test2 = { pf, avg: avg.toFixed(1), pass: pf >= pfFloor, usedCount: available.length, ...classifyPF(pf) };
    }

    let test3 = null;
    if (parsed.length >= 7) {
      const avg = avgTopN(parsed.slice(0, 7), 3);
      const pf = calcPF(w, avg);
      test3 = { pf, avg: avg.toFixed(1), pass: pf >= pfFloor, ...classifyPF(pf) };
    }

    let test3alt = null;
    if (w2 && w2 > w && parsed.length >= 6) {
      const avg = avgTopN(parsed.slice(0, 6), 3);
      const pf = calcPF(w2, avg);
      test3alt = { pf, avg: avg.toFixed(1), pass: pf >= pfFloor, bulletWeight: w2, ...classifyPF(pf) };
    }

    let current = test1;
    if (test2) current = test2;
    if (test3) current = test3;
    if (test3alt && test3alt.pf > (test3 ? test3.pf : 0)) current = test3alt;

    return { test1, test2, test3, test3alt, current, pfFloor };
  }, [bulletWeight, bulletWeight2, velocities, declaredPF]);

  const handleVelocityChange = (index, value) => {
    const newVel = [...velocities];
    newVel[index] = value;
    setVelocities(newVel);
  };

  const handleReset = () => {
    setBulletWeight('');
    setBulletWeight2('');
    setVelocities(['', '', '', '', '', '', '']);
    setDeclaredPF('major');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showStep2 = results?.test1 && !results.test1.pass;
  const showStep3 = results?.test2 && !results.test2.pass;
  const currentResult = results?.current;

  // SVG Gauge
  const gaugeRadius = 90;
  const gaugeStroke = 12;
  const centerX = 120;
  const centerY = 105;
  const startAngle = 225;
  const totalSweep = 270;
  const endAngle = startAngle - totalSweep;

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  };

  const describeArc = (cx, cy, r, startA, endA) => {
    const start = polarToCartesian(cx, cy, r, startA);
    const end = polarToCartesian(cx, cy, r, endA);
    const sweep = startA - endA;
    const largeArc = sweep > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const angleForValue = (val) => startAngle - (Math.min(val, GAUGE_MAX) / GAUGE_MAX) * totalSweep;

  const pfValue = currentResult ? Math.min(currentResult.pf, GAUGE_MAX) : 0;
  const ratio = pfValue / GAUGE_MAX;
  const needleAngle = startAngle - ratio * totalSweep;
  const needleEnd = polarToCartesian(centerX, centerY, gaugeRadius - 20, needleAngle);
  const needleColor = currentResult ? currentResult.color : 'var(--text-secondary)';

  // Stile input velocità
  const velInputStyle = (idx) => {
    const v = parseFloat(velocities[idx]);
    const isActive = idx < 3 || (showStep2 && idx < 6) || (showStep3 && idx === 6);
    const isFilled = v > 0;
    let isTop3 = false;
    if (isFilled && results?.current) {
      const parsed = velocities.map(v => parseFloat(v)).filter(v => v > 0);
      const sorted = [...parsed].sort((a, b) => b - a);
      isTop3 = sorted.indexOf(v) < 3 && parsed.length > 3;
    }
    return {
      width: '100%', padding: '10px', fontSize: '16px', fontWeight: 700,
      textAlign: 'center', borderRadius: '10px',
      opacity: isActive ? 1 : 0.35,
      pointerEvents: isActive ? 'auto' : 'none',
      border: isTop3 ? '2px solid var(--accent-color)' : undefined,
      background: isTop3 ? 'rgba(0, 122, 255, 0.05)' : undefined,
    };
  };

  const sectionLabel = {
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '8px',
    display: 'flex', alignItems: 'center', gap: '6px'
  };

  const stepBadge = (num, color) => ({
    background: color, color: '#FFF', borderRadius: '50%', width: '18px', height: '18px',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800
  });

  const resultBar = (test, label) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginTop: '8px', padding: '10px 12px', borderRadius: '10px',
      background: test.pass ? 'rgba(52, 199, 89, 0.08)' : 'rgba(255, 59, 48, 0.08)',
      border: `1px solid ${test.pass ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 59, 48, 0.2)'}`,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
        {test.pass
          ? <><CheckCircle2 size={16} color="#34C759" /> <span style={{ color: '#34C759' }}>PASS{label ? ` ${label}` : ''}</span></>
          : <><XCircle size={16} color="#FF3B30" /> <span style={{ color: '#FF3B30' }}>FAIL{label ? ` ${label}` : ''}</span></>
        }
        <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '12px' }}>Media: {test.avg} fps</span>
      </div>
      <span style={{ fontWeight: 800, fontSize: '15px', color: test.color }}>PF {test.pf}</span>
    </div>
  );

  // Componente Gauge SVG riutilizzabile
  const GaugeSVG = () => (
    <div style={{
      display: 'flex', justifyContent: 'center',
      background: currentResult ? currentResult.bgGlow : 'transparent',
      borderRadius: '16px', padding: '4px 0', transition: 'background 0.4s ease'
    }}>
      <svg width="240" height="148" viewBox="0 0 240 148">
        <path d={describeArc(centerX, centerY, gaugeRadius, startAngle, endAngle)} fill="none" stroke="var(--border-color)" strokeWidth={gaugeStroke} strokeLinecap="round" opacity="0.4" />
        <path d={describeArc(centerX, centerY, gaugeRadius, angleForValue(0), angleForValue(125))} fill="none" stroke="#FF3B30" strokeWidth={gaugeStroke} strokeLinecap="round" opacity="0.25" />
        <path d={describeArc(centerX, centerY, gaugeRadius, angleForValue(125), angleForValue(170))} fill="none" stroke="#FF9F0A" strokeWidth={gaugeStroke} strokeLinecap="round" opacity="0.25" />
        <path d={describeArc(centerX, centerY, gaugeRadius, angleForValue(170), angleForValue(GAUGE_MAX))} fill="none" stroke="#34C759" strokeWidth={gaugeStroke} strokeLinecap="round" opacity="0.25" />
        {currentResult && (
          <path d={describeArc(centerX, centerY, gaugeRadius, startAngle, needleAngle)} fill="none" stroke={currentResult.color} strokeWidth={gaugeStroke} strokeLinecap="round" style={{ transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }} />
        )}
        {[0, 125, 170, 250].map((val) => {
          const a = angleForValue(val);
          const outer = polarToCartesian(centerX, centerY, gaugeRadius + 8, a);
          const inner = polarToCartesian(centerX, centerY, gaugeRadius + 2, a);
          const labelPos = polarToCartesian(centerX, centerY, gaugeRadius + 18, a);
          const isMajor = val === 125 || val === 170;
          return (
            <g key={val}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={isMajor ? 'var(--text-primary)' : 'var(--text-secondary)'} strokeWidth={isMajor ? 2 : 1} opacity={isMajor ? 0.8 : 0.4} />
              <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight={isMajor ? 700 : 500} fill={isMajor ? 'var(--text-primary)' : 'var(--text-secondary)'} opacity={isMajor ? 1 : 0.5}>{val}</text>
            </g>
          );
        })}
        <line x1={centerX} y1={centerY} x2={needleEnd.x} y2={needleEnd.y} stroke={needleColor} strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }} />
        <circle cx={centerX} cy={centerY} r="5" fill={needleColor} style={{ transition: 'fill 0.4s ease' }} />
        <circle cx={centerX} cy={centerY} r="2.5" fill="var(--card-bg)" />
        <text x={centerX} y={centerY + 26} textAnchor="middle" dominantBaseline="middle" fontSize="28" fontWeight="800" fill={currentResult ? currentResult.color : 'var(--text-secondary)'} style={{ transition: 'fill 0.4s ease' }}>
          {currentResult ? currentResult.pf : '—'}
        </text>
        {currentResult && (
          <text x={centerX} y={centerY + 46} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="700" letterSpacing="1.5" fill={currentResult.color}>
            {currentResult.classification}
          </text>
        )}
      </svg>
    </div>
  );

  return (
    <div className="chrono-grid">

      {/* COLONNA SINISTRA — Input Steps */}
      <div className="chrono-left" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {/* Dati Campione */}
        <div className="card" style={{ padding: '20px', marginBottom: 0 }}>
          <div style={sectionLabel}>
            <Scale size={13} /> Dati Campione (Reg. 5.6.3.2-3)
          </div>

          <div style={{ display: 'flex', backgroundColor: 'var(--bg-color)', borderRadius: '10px', padding: '3px', marginBottom: '12px' }}>
            <button onClick={() => setDeclaredPF('minor')} style={{ flex: 1, padding: '8px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', backgroundColor: declaredPF === 'minor' ? 'var(--card-bg)' : 'transparent', color: declaredPF === 'minor' ? '#FF9F0A' : 'var(--text-secondary)', boxShadow: declaredPF === 'minor' ? 'var(--shadow-sm)' : 'none', transition: 'var(--transition)' }}>
              Minor (≥125)
            </button>
            <button onClick={() => setDeclaredPF('major')} style={{ flex: 1, padding: '8px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', backgroundColor: declaredPF === 'major' ? 'var(--card-bg)' : 'transparent', color: declaredPF === 'major' ? '#34C759' : 'var(--text-secondary)', boxShadow: declaredPF === 'major' ? 'var(--shadow-sm)' : 'none', transition: 'var(--transition)' }}>
              Major (≥170)
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', letterSpacing: '0.3px' }}>
                Peso 1ª Palla (gr)
              </label>
              <input
                type="number" inputMode="decimal" value={bulletWeight}
                onChange={(e) => setBulletWeight(e.target.value)}
                placeholder="es. 124"
                style={{ width: '100%', padding: '14px', fontSize: '20px', fontWeight: 700, textAlign: 'center', borderRadius: '10px' }}
              />
            </div>
            {showStep3 && (
              <div style={{ flex: 1, animation: 'fadeIn 0.3s ease-out' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', letterSpacing: '0.3px' }}>
                  Peso 2ª Palla (gr)
                </label>
                <input
                  type="number" inputMode="decimal" value={bulletWeight2}
                  onChange={(e) => setBulletWeight2(e.target.value)}
                  placeholder="opzionale"
                  style={{ width: '100%', padding: '14px', fontSize: '20px', fontWeight: 700, textAlign: 'center', borderRadius: '10px' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* STEP 1 */}
        <div className="card" style={{ padding: '20px', marginBottom: 0 }}>
          <div style={sectionLabel}>
            <span style={stepBadge('1', 'var(--accent-color)')}>1</span>
            Test Iniziale — 3 colpi (Reg. 5.6.3.3)
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.4 }}>
            Media di tutte e 3 le velocità misurate.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px', textAlign: 'center' }}>
                  #{i + 1} fps
                </label>
                <input
                  ref={el => inputRefs.current[i] = el}
                  type="number" inputMode="decimal" value={velocities[i]}
                  onChange={(e) => handleVelocityChange(i, e.target.value)}
                  placeholder="—"
                  style={velInputStyle(i)}
                />
              </div>
            ))}
          </div>
          {results?.test1 && resultBar(results.test1, '')}
        </div>

        {/* STEP 2 */}
        {showStep2 && (
          <div className="card fade-in" style={{ padding: '20px', marginBottom: 0 }}>
            <div style={sectionLabel}>
              <span style={stepBadge('2', '#FF9F0A')}>2</span>
              Retest — 3 colpi aggiuntivi (Reg. 5.6.3.6)
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.4 }}>
              PF ricalcolato con la media delle <strong>3 velocità più alte</strong> su tutti i colpi sparati.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[3, 4, 5].map(i => (
                <div key={i} style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px', textAlign: 'center' }}>
                    #{i + 1} fps
                  </label>
                  <input
                    ref={el => inputRefs.current[i] = el}
                    type="number" inputMode="decimal" value={velocities[i]}
                    onChange={(e) => handleVelocityChange(i, e.target.value)}
                    placeholder="—"
                    style={velInputStyle(i)}
                  />
                </div>
              ))}
            </div>
            {results?.test2 && results.test2.usedCount >= 4 && resultBar(results.test2, '')}
          </div>
        )}

        {/* STEP 3 */}
        {showStep3 && (
          <div className="card fade-in" style={{ padding: '20px', marginBottom: 0 }}>
            <div style={sectionLabel}>
              <span style={stepBadge('3', '#FF3B30')}>3</span>
              Ultima Chance — 7° colpo (Reg. 5.6.3.7)
            </div>
            <div style={{
              fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.5,
              padding: '10px 12px', background: 'rgba(255, 159, 10, 0.06)', borderRadius: '10px',
              border: '1px solid rgba(255, 159, 10, 0.12)'
            }}>
              <strong>Il tiratore sceglie:</strong><br/>
              (a) Pesare la 2ª palla — se più pesante, ricalcola PF con best 3 di 6<br/>
              (b) Sparare il 7° colpo — ricalcola PF con best 3 di 7
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ width: '120px' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px', textAlign: 'center' }}>
                  #7 fps
                </label>
                <input
                  ref={el => inputRefs.current[6] = el}
                  type="number" inputMode="decimal" value={velocities[6]}
                  onChange={(e) => handleVelocityChange(6, e.target.value)}
                  placeholder="—"
                  style={velInputStyle(6)}
                />
              </div>
              <div style={{ flex: 1, fontSize: '11px', color: 'var(--text-secondary)', paddingBottom: '12px' }}>
                Oppure inserisci il peso della 2ª palla sopra per l'opzione (a)
              </div>
            </div>
            {results?.test3 && resultBar(results.test3, '(7° colpo)')}
            {results?.test3alt && (
              <div style={{ marginTop: results?.test3 ? '0' : '8px' }}>
                {resultBar(results.test3alt, `(2ª palla: ${results.test3alt.bulletWeight}gr)`)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* COLONNA DESTRA — Gauge + Soglie + Reset (sticky su desktop) */}
      <div className="chrono-right">

        {/* Gauge Card */}
        <div className="card" style={{ padding: '24px', textAlign: 'center', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', justifyContent: 'center' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #FF9F0A, #FF6723)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255, 103, 35, 0.3)'
            }}>
              <Crosshair size={18} color="#FFF" strokeWidth={2.5} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Chrono Check</h2>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>Procedura IPSC — Reg. 5.6.3</p>
            </div>
          </div>
          <GaugeSVG />
        </div>

        {/* Risultato Grande (desktop) */}
        {currentResult && (
          <div className="card desktop-only" style={{ marginBottom: 0, border: `2px solid ${currentResult.color}33`, transform: 'scale(1.02)', padding: '20px' }}>
            <div className="flex-between">
              <div>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Power Factor</span>
                <div style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1, color: currentResult.color, marginTop: '8px' }}>
                  {currentResult.pf}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  padding: '8px 16px', borderRadius: '20px',
                  background: currentResult.color, color: '#FFF',
                  fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px',
                  boxShadow: `0 4px 12px ${currentResult.color}44`,
                  marginBottom: '8px'
                }}>
                  {currentResult.pass ? 'PASS' : 'FAIL'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Media: {currentResult.avg} fps
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Soglie */}
        <div className="card" style={{ padding: '16px', marginBottom: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Soglie IPSC Handgun</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {[
              { label: 'Major', color: '#34C759', value: 'PF ≥ 170' },
              { label: 'Major (Open 9mm)', color: '#30D158', value: 'PF ≥ 160' },
              { label: 'Minor', color: '#FF9F0A', value: 'PF ≥ 125' },
              { label: 'Insufficiente', color: '#FF3B30', value: 'PF < 125' },
            ].map(t => (
              <div key={t.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: t.color, marginRight: '6px' }}></span>{t.label}</span>
                <span style={{ fontWeight: 600 }}>{t.value}</span>
              </div>
            ))}
          </div>
          <div style={{
            fontSize: '11px', color: 'var(--text-secondary)', padding: '10px 12px',
            borderRadius: '8px', background: 'rgba(0, 122, 255, 0.05)',
            border: '1px solid rgba(0, 122, 255, 0.1)', lineHeight: 1.5
          }}>
            <Info size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} color="var(--accent-color)" />
            <strong>Reg. 5.6.3.5:</strong> Il PF viene troncato senza arrotondamento (124.999 = 124, non 125).
          </div>
        </div>

        {/* Reset */}
        <button onClick={handleReset} style={{
          width: '100%', padding: '16px', borderRadius: 'var(--border-radius-lg)',
          background: 'var(--card-bg)', border: '1px solid var(--border-color)',
          color: 'var(--danger-color)', fontSize: '16px', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <RotateCcw size={20} /> Nuovo Controllo
        </button>
      </div>
    </div>
  );
}

export default ChronoCheck;
