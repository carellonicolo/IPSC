import React, { useState, useMemo, useRef } from 'react';
import { Crosshair, RotateCcw, Scale, CheckCircle2, XCircle, Info } from 'lucide-react';

const GAUGE_MAX = 250;

/* Geometria del quadrante.
 * Il viewBox deve contenere l'intero arco piu' i tick e le etichette esterne:
 * con centro (130, 118), raggio 90 e sweep di 270 gradi l'estremo piu' basso
 * (etichette a raggio 109, a 45 gradi sotto l'orizzonte) arriva a y = 195. */
const GAUGE_W = 260;
const GAUGE_H = 206;
const centerX = 130;
const centerY = 118;
const gaugeRadius = 90;
const gaugeStroke = 14;
const tickInner = gaugeRadius + 4;
const tickOuter = gaugeRadius + 10;
const labelRadius = gaugeRadius + 23;
const startAngle = 225;
const totalSweep = 270;
const endAngle = startAngle - totalSweep;

const ZONES = [
  { from: 0, to: 125, color: '#FF3B30' },
  { from: 125, to: 170, color: '#FF9F0A' },
  { from: 170, to: GAUGE_MAX, color: '#34C759' },
];

const TICKS = [0, 125, 170, GAUGE_MAX];

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

const clampPF = (val) => Math.max(0, Math.min(val, GAUGE_MAX));
const angleForValue = (val) => startAngle - (clampPF(val) / GAUGE_MAX) * totalSweep;

const GaugeSVG = ({ currentResult, pfFloor }) => {
  const pf = currentResult ? currentResult.pf : null;
  const hasValue = pf !== null;
  const valueAngle = angleForValue(hasValue ? pf : 0);
  const marker = polarToCartesian(centerX, centerY, gaugeRadius, valueAngle);
  const statusColor = hasValue ? currentResult.statusColor : 'var(--text-secondary)';

  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      background: currentResult ? currentResult.bgGlow : 'transparent',
      borderRadius: '16px', padding: '8px 0', transition: 'background 0.4s ease',
    }}>
      <svg
        viewBox={`0 0 ${GAUGE_W} ${GAUGE_H}`}
        width="100%"
        style={{ maxWidth: '300px', height: 'auto', display: 'block' }}
        role="img"
        aria-label={hasValue
          ? `Power Factor ${pf}, ${currentResult.pass ? 'sufficiente' : 'insufficiente'} rispetto alla soglia di ${pfFloor}`
          : 'Power Factor non ancora calcolato'}
      >
        {/* Traccia di fondo */}
        <path
          d={describeArc(centerX, centerY, gaugeRadius, startAngle, endAngle)}
          fill="none" stroke="var(--border-color)" strokeWidth={gaugeStroke}
          strokeLinecap="round" opacity="0.35"
        />

        {/* Fasce di riferimento: insufficiente / minor / major */}
        {ZONES.map(z => (
          <path
            key={z.from}
            d={describeArc(centerX, centerY, gaugeRadius, angleForValue(z.from), angleForValue(z.to))}
            fill="none" stroke={z.color} strokeWidth={gaugeStroke} opacity="0.22"
          />
        ))}

        {/* Arco di avanzamento fino al valore misurato */}
        {hasValue && pf > 0 && (
          <path
            d={describeArc(centerX, centerY, gaugeRadius, startAngle, valueAngle)}
            fill="none" stroke={statusColor} strokeWidth={gaugeStroke} strokeLinecap="round"
            style={{ transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        )}

        {/* Tacche e valori di scala */}
        {TICKS.map(val => {
          const a = angleForValue(val);
          const inner = polarToCartesian(centerX, centerY, tickInner, a);
          const outer = polarToCartesian(centerX, centerY, tickOuter, a);
          const label = polarToCartesian(centerX, centerY, labelRadius, a);
          const isFloor = val === pfFloor;
          return (
            <g key={val}>
              <line
                x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
                stroke={isFloor ? 'var(--text-primary)' : 'var(--text-secondary)'}
                strokeWidth={isFloor ? 2.5 : 1.5}
                opacity={isFloor ? 0.9 : 0.45}
                strokeLinecap="round"
              />
              <text
                x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fontWeight={isFloor ? 800 : 600}
                fill={isFloor ? 'var(--text-primary)' : 'var(--text-secondary)'}
                opacity={isFloor ? 1 : 0.6}
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Indicatore sul valore corrente */}
        {hasValue && (
          <g style={{ transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <circle cx={marker.x} cy={marker.y} r="9" fill="var(--card-bg)" />
            <circle cx={marker.x} cy={marker.y} r="6.5" fill={statusColor} />
          </g>
        )}

        {/* Lettura centrale: nessuna sovrapposizione con l'arco */}
        <text x={centerX} y={centerY - 24} textAnchor="middle" dominantBaseline="middle"
              fontSize="9.5" fontWeight="700" letterSpacing="1.4" fill="var(--text-secondary)">
          POWER FACTOR
        </text>
        <text x={centerX} y={centerY + 8} textAnchor="middle" dominantBaseline="middle"
              fontSize="44" fontWeight="800" fill={statusColor}
              style={{ transition: 'fill 0.4s ease' }}>
          {hasValue ? pf : '—'}
        </text>
        {hasValue && (
          <>
            <text x={centerX} y={centerY + 34} textAnchor="middle" dominantBaseline="middle"
                  fontSize="11" fontWeight="800" letterSpacing="0.8" fill={currentResult.color}>
              {currentResult.classification}
            </text>
            <text x={centerX} y={centerY + 52} textAnchor="middle" dominantBaseline="middle"
                  fontSize="10" fontWeight="600" fill="var(--text-secondary)">
              richiesto ≥ {pfFloor}
            </text>
          </>
        )}
      </svg>
    </div>
  );
};

function classifyPF(pf) {
  if (pf >= 170) return { classification: 'MAJOR', color: '#34C759' };
  if (pf >= 160) return { classification: 'MAJOR (Open 9mm)', color: '#30D158' };
  if (pf >= 125) return { classification: 'MINOR', color: '#FF9F0A' };
  return { classification: 'INSUFFICIENTE', color: '#FF3B30' };
}

/**
 * Un test e' PASS solo rispetto al PF dichiarato: 165 e' "Major (Open 9mm)"
 * come fascia, ma resta un FAIL per chi ha dichiarato Major. Colore e alone
 * del cruscotto seguono l'esito, la fascia resta come riferimento di scala.
 */
function buildTest(pf, avgValue, pfFloor, extra = {}) {
  const pass = pf >= pfFloor;
  return {
    pf,
    avg: avgValue.toFixed(1),
    pass,
    statusColor: pass ? '#34C759' : '#FF3B30',
    bgGlow: pass ? 'rgba(52, 199, 89, 0.13)' : 'rgba(255, 59, 48, 0.10)',
    ...classifyPF(pf),
    ...extra,
  };
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

  const results = useMemo(() => {
    const w = parseFloat(bulletWeight);
    const w2 = parseFloat(bulletWeight2);
    if (!w || w <= 0) return null;

    const parsed = velocities.map(v => parseFloat(v)).filter(v => v > 0);
    const pfFloor = declaredPF === 'major' ? 170 : 125;

    let test1 = null;
    if (parsed.length >= 3) {
      const avg = (parsed[0] + parsed[1] + parsed[2]) / 3;
      test1 = buildTest(calcPF(w, avg), avg, pfFloor);
    }

    let test2 = null;
    if (parsed.length >= 4) {
      const available = parsed.slice(0, 6);
      const avg = avgTopN(available, 3);
      test2 = buildTest(calcPF(w, avg), avg, pfFloor, { usedCount: available.length });
    }

    let test3 = null;
    if (parsed.length >= 7) {
      const avg = avgTopN(parsed.slice(0, 7), 3);
      test3 = buildTest(calcPF(w, avg), avg, pfFloor);
    }

    let test3alt = null;
    if (w2 && w2 > w && parsed.length >= 6) {
      const avg = avgTopN(parsed.slice(0, 6), 3);
      test3alt = buildTest(calcPF(w2, avg), avg, pfFloor, { bulletWeight: w2 });
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
      <span style={{ fontWeight: 800, fontSize: '15px', color: test.statusColor }}>PF {test.pf}</span>
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
                aria-label="Peso della prima palla in grani"
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
                  aria-label="Peso della seconda palla in grani"
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
                  aria-label={`Velocità colpo ${i + 1} in fps`}
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
                    aria-label={`Velocità colpo ${i + 1} in fps`}
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
                  aria-label="Velocità colpo 7 in fps"
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
          <GaugeSVG currentResult={currentResult} pfFloor={results?.pfFloor ?? (declaredPF === 'major' ? 170 : 125)} />

          {/* Esito su telefono: la card grande con PASS/FAIL e' desktop-only,
              quindi da mobile il cruscotto non diceva mai se il campione passava. */}
          {currentResult ? (
            <div className="mobile-only" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              flexWrap: 'wrap', marginTop: '14px', padding: '10px 14px', borderRadius: '12px',
              background: currentResult.pass ? 'rgba(52, 199, 89, 0.10)' : 'rgba(255, 59, 48, 0.08)',
              border: `1px solid ${currentResult.statusColor}33`,
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 12px', borderRadius: '20px',
                background: currentResult.statusColor, color: '#FFF',
                fontSize: '13px', fontWeight: 800, letterSpacing: '0.5px',
              }}>
                {currentResult.pass ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                {currentResult.pass ? 'PASS' : 'FAIL'}
              </span>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {declaredPF === 'major' ? 'Major' : 'Minor'} dichiarato · media {currentResult.avg} fps
                {currentResult.pf > GAUGE_MAX && ' · oltre il fondo scala'}
              </span>
            </div>
          ) : (
            <p style={{ marginTop: '14px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Inserisci peso della palla e le prime 3 velocità per il calcolo.
            </p>
          )}
        </div>

        {/* Risultato Grande (desktop) */}
        {currentResult && (
          <div className="card desktop-only" style={{ marginBottom: 0, border: `2px solid ${currentResult.statusColor}33`, transform: 'scale(1.02)', padding: '20px' }}>
            <div className="flex-between">
              <div>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Power Factor</span>
                <div style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1, color: currentResult.statusColor, marginTop: '8px' }}>
                  {currentResult.pf}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  padding: '8px 16px', borderRadius: '20px',
                  background: currentResult.statusColor, color: '#FFF',
                  fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px',
                  boxShadow: `0 4px 12px ${currentResult.statusColor}44`,
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
