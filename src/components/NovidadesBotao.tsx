import { useCallback, useEffect, useState } from 'react';
import { NovidadesModal } from '@/components/NovidadesModal';
import {
  marcarNovidadesComoLidas,
  temNovidadesNaoLidas,
} from '@/lib/novidades';
import './Novidades.css';

interface NovidadesBotaoProps {
  compacto?: boolean;
  className?: string;
}

export function NovidadesBotao({ compacto = false, className = '' }: NovidadesBotaoProps) {
  const [aberto, setAberto] = useState(false);
  const [naoLidas, setNaoLidas] = useState(() => temNovidadesNaoLidas());

  const atualizarNaoLidas = useCallback(() => {
    setNaoLidas(temNovidadesNaoLidas());
  }, []);

  useEffect(() => {
    atualizarNaoLidas();
    window.addEventListener('storage', atualizarNaoLidas);
    return () => window.removeEventListener('storage', atualizarNaoLidas);
  }, [atualizarNaoLidas]);

  function abrir() {
    setAberto(true);
    marcarNovidadesComoLidas();
    setNaoLidas(false);
  }

  function fechar() {
    setAberto(false);
  }

  const classes = [
    'novidades-botao',
    compacto ? 'novidades-botao--compacto' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <button
        type="button"
        className={classes}
        onClick={abrir}
        aria-haspopup="dialog"
        aria-label={
          naoLidas ? 'Novidades — há atualizações recentes' : 'Ver novidades do Hub'
        }
      >
        <span className="novidades-botao__icone" aria-hidden>
          ✨
        </span>
        {!compacto ? <span>Novidades</span> : null}
        {naoLidas ? (
          <span className="novidades-botao__badge" aria-hidden />
        ) : null}
      </button>
      {aberto ? <NovidadesModal onFechar={fechar} /> : null}
    </>
  );
}
