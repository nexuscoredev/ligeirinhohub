import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { resumoFiscal } from '@/lib/fiscal/api';
import type { ResumoFiscal } from '@/types/fiscal';
import './fiscal.css';

const RESUMO_VAZIO: ResumoFiscal = {
  emitidas: 0,
  autorizadas: 0,
  rejeitadas: 0,
  canceladas: 0,
  nfce_pdv: 0,
  nfe_hub: 0,
};

export function FiscalPainelPage() {
  const app = appPorId('fiscal');
  const item = app ? itemAppPorRota(app, '/fiscal') : null;

  const [resumo, setResumo] = useState<ResumoFiscal>(RESUMO_VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { resumo: dados, error } = await resumoFiscal();
    if (error) {
      setErro(error.message);
    } else {
      setResumo(dados);
      setErro(null);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (!app || !item) return null;

  return (
    <AppPageHeader
      app={app}
      item={item}
      titulo="Painel Fiscal"
      subtitulo="NF-e (negociações) e NFC-e (PDV) em um só lugar."
    >
      {erro ? (
        <p className="fisc-erro" role="alert">
          {erro}
        </p>
      ) : null}

      <div className="fisc-kpis" aria-busy={carregando}>
        <div className="fisc-kpi">
          <strong>{resumo.emitidas}</strong>
          <span>Notas registradas</span>
        </div>
        <div className="fisc-kpi">
          <strong>{resumo.autorizadas}</strong>
          <span>Autorizadas</span>
        </div>
        <div className="fisc-kpi">
          <strong>{resumo.rejeitadas}</strong>
          <span>Rejeitadas</span>
        </div>
        <div className="fisc-kpi">
          <strong>{resumo.nfce_pdv}</strong>
          <span>NFC-e (PDV)</span>
        </div>
        <div className="fisc-kpi">
          <strong>{resumo.nfe_hub}</strong>
          <span>NF-e (HUB)</span>
        </div>
      </div>

      <div className="fisc-atalhos">
        <Link to="/fiscal/emitidas" className="btn">
          Notas emitidas
        </Link>
        <Link to="/fiscal/emitir" className="btn btn-secundario">
          Emitir NF-e
        </Link>
        <Link to="/fiscal/series" className="btn btn-secundario">
          Séries fiscais
        </Link>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--hub-muted)', margin: 0 }}>
        NFC-e continua no PDV. NF-e de pedidos com tipo documento &quot;NF-e&quot; é emitida
        pela Edge Function <code>nfe-emitir</code> via Nuvem Fiscal.
      </p>
    </AppPageHeader>
  );
}
