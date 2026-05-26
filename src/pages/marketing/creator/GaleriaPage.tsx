import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { FILTROS_GALERIA, labelCampanha } from '@/lib/marketing/creator/constants';
import { atualizarArteGaleria, listarArtesGaleria, removerArteGaleria } from '@/lib/marketing/creator/storage';
import type { ArteSalva } from '@/lib/marketing/creator/types';
import './marketing-creator.css';

type FiltroId = (typeof FILTROS_GALERIA)[number]['id'];

function filtroAplica(filtro: FiltroId, a: ArteSalva) {
  if (filtro === 'todas') return true;
  if (filtro === 'favoritos') return a.favorito;
  return a.tipoCampanha === filtro;
}

export function GaleriaPage() {
  const app = appPorId('marketing');
  const item = itemAppPorRota(app!, '/marketing/galeria');
  const [filtro, setFiltro] = useState<FiltroId>('todas');
  const [tick, setTick] = useState(0);

  const artes = useMemo(() => listarArtesGaleria(), [tick]);
  const filtradas = artes.filter((a) => filtroAplica(filtro, a));

  if (!app) return null;

  return (
    <AppPageHeader app={app} item={item} titulo="Galeria" subtitulo="Suas artes geradas e variações.">
      <div className="mkt-galeria-topo">
        <h2 className="mkt-galeria-titulo">
          Galeria <span className="mkt-galeria-count">{artes.length}</span>
        </h2>
        <Link to="/marketing/criar" className="btn">
          + Criar arte
        </Link>
      </div>

      <div className="mkt-galeria-filtros" role="tablist" aria-label="Filtros da galeria">
        {FILTROS_GALERIA.map((f) => (
          <button
            key={f.id}
            type="button"
            className={filtro === f.id ? 'mkt-galeria-filtro ativo' : 'mkt-galeria-filtro'}
            role="tab"
            aria-selected={filtro === f.id}
            onClick={() => setFiltro(f.id as FiltroId)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <p className="card">Nenhuma arte neste filtro.</p>
      ) : (
        <div className="mkt-galeria-grid" role="list">
          {filtradas.map((a) => (
            <div key={a.id} className="mkt-galeria-item" role="listitem">
              <div className="mkt-galeria-thumb">
                <img src={a.previewDataUrl} alt={a.titulo} />
                <span className="mkt-galeria-badge">{labelCampanha(a.tipoCampanha)}</span>
                <button
                  type="button"
                  className={a.favorito ? 'mkt-galeria-fav ativo' : 'mkt-galeria-fav'}
                  title={a.favorito ? 'Desfavoritar' : 'Favoritar'}
                  onClick={() => {
                    atualizarArteGaleria(a.id, { favorito: !a.favorito });
                    setTick((x) => x + 1);
                  }}
                >
                  ★
                </button>
              </div>
              <div className="mkt-galeria-meta">
                <strong>{a.titulo}</strong>
                <span>{new Date(a.criadoEm).toLocaleString('pt-BR')}</span>
              </div>
              <div className="mkt-galeria-acoes">
                <a className="btn btn-secundario" href={a.previewDataUrl} download={`arte-${a.id}.png`}>
                  Download
                </a>
                <button
                  type="button"
                  className="btn btn-secundario"
                  onClick={() => {
                    removerArteGaleria(a.id);
                    setTick((x) => x + 1);
                  }}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppPageHeader>
  );
}

