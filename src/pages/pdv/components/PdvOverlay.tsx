import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PdvOverlayProps {
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
  largura?: 'md' | 'lg' | 'xl';
}

export function PdvOverlay({ titulo, onFechar, children, largura = 'md' }: PdvOverlayProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onFechar();
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onFechar]);

  return createPortal(
    <div className="pdv-overlay" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="pdv-overlay__backdrop" onClick={onFechar} />
      <div className={`pdv-overlay__card pdv-overlay__card--${largura}`}>
        <header className="pdv-overlay__header">
          <h2>{titulo}</h2>
          <button
            type="button"
            className="pdv-overlay__fechar"
            onClick={onFechar}
            aria-label="Fechar (ESC)"
          >
            ESC ↩
          </button>
        </header>
        <div className="pdv-overlay__corpo">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
