import { useEffect, useRef } from 'react';
import { appDisplayVersion } from '@/lib/appDisplayVersion';
import {
  NOVIDADES,
  formatarDataNovidade,
  marcarNovidadesComoLidas,
} from '@/lib/novidades';
import './Novidades.css';

interface NovidadesModalProps {
  onFechar: () => void;
}

export function NovidadesModal({ onFechar }: NovidadesModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    marcarNovidadesComoLidas();
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') onFechar();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onFechar]);

  return (
    <div
      className="novidades-backdrop"
      role="presentation"
      onClick={onFechar}
    >
      <div
        ref={dialogRef}
        className="novidades-modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="novidades-titulo"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="novidades-modal__header">
          <div>
            <p className="novidades-modal__eyebrow">O que há de novo</p>
            <h2 id="novidades-titulo" className="novidades-modal__titulo">
              Novidades do Hub
            </h2>
            <p className="novidades-modal__versao">{appDisplayVersion()}</p>
          </div>
          <button
            type="button"
            className="novidades-modal__fechar"
            onClick={onFechar}
            aria-label="Fechar novidades"
          >
            ✕
          </button>
        </header>

        <ul className="novidades-lista">
          {NOVIDADES.map((n, i) => (
            <li
              key={n.id}
              className={`novidades-item${i === 0 ? ' novidades-item--recente' : ''}`}
            >
              <div className="novidades-item__topo">
                <time dateTime={n.data}>{formatarDataNovidade(n.data)}</time>
                {n.area ? <span className="novidades-item__area">{n.area}</span> : null}
                {i === 0 ? <span className="novidades-item__novo">Novo</span> : null}
              </div>
              <h3 className="novidades-item__titulo">{n.titulo}</h3>
              <ul className="novidades-item__itens">
                {n.itens.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
