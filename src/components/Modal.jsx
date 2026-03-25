import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth }) {
  // Disabilita lo scrolling in background quando la modal è aperta
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Chiudi con Esc
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: maxWidth || '400px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Chiudi Modale">
          <X size={18} strokeWidth={2.5} />
        </button>
        
        <h3 style={{ fontSize: '20px', marginBottom: '16px', paddingRight: '24px' }}>
          {title}
        </h3>
        
        <div style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>
          {children}
        </div>
        
        <button 
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px',
            marginTop: '28px',
            backgroundColor: 'var(--accent-color)',
            color: '#FFFFFF',
            borderRadius: 'var(--border-radius-md)',
            fontWeight: 600,
            fontSize: '16px',
            letterSpacing: '0.3px',
            boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)'
          }}
        >
          Ho capito
        </button>
      </div>
    </div>
  );
}
