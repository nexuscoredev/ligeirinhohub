import { useEffect, useState } from 'react';
import { aplicarAtualizacaoPwa } from '@/lib/pwa';
import './pwa-update-banner.css';

type PwaUpdateDetail = { status: 'ready' } | { status: 'need-refresh' };

export function PwaUpdateBanner() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    function onEvt(e: Event) {
      const ev = e as CustomEvent<PwaUpdateDetail>;
      if (ev.detail?.status === 'need-refresh') setVisivel(true);
    }
    window.addEventListener('hub-pwa', onEvt);
    return () => window.removeEventListener('hub-pwa', onEvt);
  }, []);

  if (!visivel) return null;

  return (
    <div className="pwa-update" role="status" aria-live="polite">
      <div className="pwa-update__card">
        <div className="pwa-update__texto">
          <strong>Atualização disponível</strong>
          <span>Recarregue para usar a versão mais nova.</span>
        </div>
        <div className="pwa-update__acoes">
          <button
            type="button"
            className="btn"
            onClick={() => void aplicarAtualizacaoPwa()}
          >
            Atualizar agora
          </button>
          <button
            type="button"
            className="btn btn-secundario"
            onClick={() => setVisivel(false)}
          >
            Depois
          </button>
        </div>
      </div>
    </div>
  );
}

