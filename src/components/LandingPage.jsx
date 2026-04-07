import React from 'react';
import { Activity, Shield, Sun, Moon } from 'lucide-react';

export default function LandingPage({ onSelect, theme, toggleTheme }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative'
    }}>
      <button
        onClick={toggleTheme}
        style={{ position: 'absolute', right: '16px', top: '12px', padding: '8px', color: 'var(--text-secondary)' }}
        aria-label="Toggle Tema"
      >
        {theme === 'dark' ? <Sun size={26} strokeWidth={2.5} /> : <Moon size={26} strokeWidth={2.5} />}
      </button>

      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '28px', letterSpacing: '-0.5px', marginBottom: '8px' }}>Scegli la Disciplina</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 500 }}>
          Seleziona il sistema di punteggio da utilizzare
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        width: '100%',
        maxWidth: '640px'
      }}>
        {/* IPSC Card */}
        <button
          onClick={() => onSelect('ipsc')}
          className="landing-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '40px 32px',
            background: 'var(--card-bg)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderRadius: 'var(--border-radius-lg)',
            border: '2px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <div style={{
            width: '72px', height: '72px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #007AFF, #0051D5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0, 122, 255, 0.35)'
          }}>
            <Activity size={36} color="#FFF" strokeWidth={2.5} />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px', color: 'var(--text-primary)' }}>IPSC</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.4 }}>
              Hit Factor Calculator<br />
              <span style={{ fontSize: '12px' }}>FITDS • Tiro Dinamico Sportivo</span>
            </p>
          </div>
        </button>

        {/* LSSA Card */}
        <button
          onClick={() => onSelect('lssa')}
          className="landing-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '40px 32px',
            background: 'var(--card-bg)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderRadius: 'var(--border-radius-lg)',
            border: '2px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <div style={{
            width: '72px', height: '72px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #34C759, #248A3D)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(52, 199, 89, 0.35)'
          }}>
            <Shield size={36} color="#FFF" strokeWidth={2.5} />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px', color: 'var(--text-primary)' }}>LSSA</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.4 }}>
              Paladin / Defensive Count<br />
              <span style={{ fontSize: '12px' }}>FIIDS • Tiro Difensivo Sportivo</span>
            </p>
          </div>
        </button>
      </div>

      <p style={{ marginTop: '40px', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 500 }}>
        by <a href="https://apps.nicolocarello.it" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>nicolocarello.it</a>
      </p>
    </div>
  );
}
