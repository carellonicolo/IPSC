import React from 'react';
import { Minus, Plus } from 'lucide-react';

export default function HitCounter({ label, value, onChange, colorVar, description = "", isLast = false }) {
  const handleDecrement = () => {
    if (value > 0) onChange(value - 1);
  };

  const handleIncrement = () => {
    onChange(value + 1);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 0',
      borderBottom: isLast ? 'none' : '1px solid var(--border-color)'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ 
          fontSize: '18px', 
          fontWeight: '600',
          color: colorVar ? `var(${colorVar})` : 'inherit',
          letterSpacing: '-0.2px'
        }}>
          {label}
        </span>
        {description && (
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {description}
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button 
          className="counter-btn"
          onClick={handleDecrement}
          disabled={value === 0}
          style={{
            color: value > 0 ? (colorVar ? `var(${colorVar})` : 'var(--accent-color)') : 'var(--text-secondary)',
          }}
          aria-label={`Decrement ${label}`}
        >
          <Minus size={22} strokeWidth={3} />
        </button>
        
        <span style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          width: '36px', 
          textAlign: 'center',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {value}
        </span>
        
        <button 
          className="counter-btn"
          onClick={handleIncrement}
          style={{
            color: colorVar ? `var(${colorVar})` : 'var(--accent-color)'
          }}
          aria-label={`Increment ${label}`}
        >
          <Plus size={22} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
