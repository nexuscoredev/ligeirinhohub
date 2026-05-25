import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { listarPromocoesAtivas } from '@/lib/marketing/api';
import { formatarValidade } from '@/lib/marketing/helpers';
import { formatarMoeda } from '@/lib/pedidos/constants';
import { supabase } from '@/lib/supabase';
import type { Promocao } from '@/types/marketing';
import './marketing.css';

const ROTACAO_MS = 8000;

export function TvPreviewPage() {
  const app = appPorId('marketing');
  const stageRef = useRef<HTMLDivElement>(null);
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [indice, setIndice] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const { promocoes: lista, error } = await listarPromocoesAtivas();
    if (error) setErro(error.message);
    else {
      setPromocoes(lista);
      setErro(null);
      setIndice((i) => (lista.length ? Math.min(i, lista.length - 1) : 0));
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    const channel = supabase
      .channel('marketing-tv')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'promocoes' },
        () => void carregar(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [carregar]);

  useEffect(() => {
    if (promocoes.length < 2) return;
    const t = window.setInterval(() => {
      setIndice((i) => (i + 1) % promocoes.length);
    }, ROTACAO_MS);
    return () => window.clearInterval(t);
  }, [promocoes.length]);

  const atual = promocoes[indice];

  async function entrarFullscreen() {
    const el = stageRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      /* ignore — browser may block */
    }
  }

  if (!app) return null;

  const item = itemAppPorRota(app, '/marketing/tv');

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Preview TV"
      subtitulo="Loop das promoções vigentes — fundo escuro, texto grande para monitor na loja."
    >
      {erro ? <p className="erro">{erro}</p> : null}

      <div className="mkt-tv-wrap">
        <div className="mkt-tv-toolbar">
          <button type="button" className="btn" onClick={() => void entrarFullscreen()}>
            Tela cheia no card
          </button>
          <Link to="/marketing/promocoes" className="btn btn-secundario">
            Editar promoções
          </Link>
          <span style={{ fontSize: '0.8rem', color: 'var(--hub-muted)' }}>
            {promocoes.length} na TV · troca a cada {ROTACAO_MS / 1000}s
          </span>
        </div>

        <div ref={stageRef} className="mkt-tv-stage" aria-live="polite">
          {carregando ? (
            <p className="mkt-tv-vazio">Carregando promoções…</p>
          ) : !atual ? (
            <p className="mkt-tv-vazio">
              Nenhuma promoção ativa hoje.
              <br />
              <Link to="/marketing/promocoes" style={{ color: '#ff9f0a' }}>
                Cadastrar promoções
              </Link>
            </p>
          ) : (
            <article key={atual.id} className="mkt-tv-card">
              <h2 className="mkt-tv-nome">{atual.produto_nome}</h2>
              <p className="mkt-tv-preco">{formatarMoeda(atual.preco_promo)}</p>
              {atual.preco_promo < atual.preco_original ? (
                <p className="mkt-tv-preco-de">de {formatarMoeda(atual.preco_original)}</p>
              ) : null}
              <p className="mkt-tv-validade">
                Válido {formatarValidade(atual.validade_inicio, atual.validade_fim)}
              </p>
            </article>
          )}
        </div>

        {promocoes.length > 1 ? (
          <div className="mkt-tv-dots" role="tablist" aria-label="Promoção na TV">
            {promocoes.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={i === indice}
                className={`mkt-tv-dot${i === indice ? ' ativo' : ''}`}
                onClick={() => setIndice(i)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </AppPageHeader>
  );
}
