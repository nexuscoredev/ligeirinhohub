import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { listarPromocoes } from '@/lib/marketing/api';
import {
  hojeLocal,
  promoExpiraEmBreve,
  promoExpirada,
  promoVigente,
} from '@/lib/marketing/helpers';
import { supabase } from '@/lib/supabase';
import type { Promocao } from '@/types/marketing';
import './marketing.css';

export function MarketingPainelPage() {
  const app = appPorId('marketing');
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const ref = hojeLocal();

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { promocoes: lista, error } = await listarPromocoes();
    if (error) setErro(error.message);
    else {
      setPromocoes(lista);
      setErro(null);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    const channel = supabase
      .channel('marketing-promocoes')
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

  const stats = useMemo(() => {
    const ativas = promocoes.filter((p) => promoVigente(p, ref));
    const expirando = promocoes.filter((p) => promoExpiraEmBreve(p, 3, ref));
    const expiradas = promocoes.filter((p) => promoExpirada(p, ref));
    return { ativas: ativas.length, expirando: expirando.length, expiradas: expiradas.length };
  }, [promocoes, ref]);

  if (!app) return null;

  const item = itemAppPorRota(app, '/marketing');

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Painel Marketing"
      subtitulo="Promoções na TV da loja — vigência e preços sincronizados com o catálogo."
    >
      <span className="hub-tag mkt-tag">• Gelada • Rápida • Completa</span>

      {erro ? <p className="erro">{erro}</p> : null}

      <div className="mkt-kpis" aria-busy={carregando}>
        <div className="mkt-kpi">
          <strong>{stats.ativas}</strong>
          <span>Promoções ativas hoje</span>
        </div>
        <div className="mkt-kpi">
          <strong>{stats.expirando}</strong>
          <span>Expirando em 3 dias</span>
        </div>
        <div className="mkt-kpi">
          <strong>{stats.expiradas}</strong>
          <span>Fora da validade</span>
        </div>
      </div>

      <div className="mkt-atalhos">
        <Link to="/marketing/promocoes" className="btn">
          Gerenciar promoções
        </Link>
        <Link to="/marketing/tv" className="btn btn-secundario">
          Abrir preview TV
        </Link>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--hub-muted)', margin: 0 }}>
        Denis define as campanhas; o time Comercial cadastra preço promocional e validade.
        Alterações refletem na TV em tempo real.
      </p>
    </AppPageHeader>
  );
}
