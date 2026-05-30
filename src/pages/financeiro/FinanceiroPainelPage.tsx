import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { resumoFinanceiro } from '@/lib/financeiro/api';
import { formatarMoeda } from '@/lib/pedidos/constants';
import type { ResumoFinanceiro } from '@/types/financeiro';
import './financeiro.css';

const RESUMO_VAZIO: ResumoFinanceiro = {
  receber_aberto: 0,
  receber_vencido: 0,
  pagar_aberto: 0,
  pagar_vencido: 0,
  comissoes_pendentes: 0,
  vales_ativos: 0,
  qtd_receber_vencidas: 0,
  qtd_pagar_vencidas: 0,
};

export function FinanceiroPainelPage() {
  const app = appPorId('financeiro');
  const item = app ? itemAppPorRota(app, '/financeiro') : null;

  const [resumo, setResumo] = useState<ResumoFinanceiro>(RESUMO_VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { resumo: dados, error } = await resumoFinanceiro();
    if (error) setErro(error.message);
    else {
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
      titulo="Painel Financeiro"
      subtitulo="Contas a receber e pagar, caixa, comissões e vales."
    >
      {erro ? (
        <p className="fin-erro" role="alert">
          {erro}
        </p>
      ) : null}

      <div className="fin-kpis" aria-busy={carregando}>
        <div className="fin-kpi">
          <strong>{formatarMoeda(resumo.receber_aberto)}</strong>
          <span>A receber (aberto)</span>
        </div>
        <div className={`fin-kpi${resumo.qtd_receber_vencidas ? ' fin-kpi--alerta' : ''}`}>
          <strong>{formatarMoeda(resumo.receber_vencido)}</strong>
          <span>
            Vencido ({resumo.qtd_receber_vencidas} título
            {resumo.qtd_receber_vencidas === 1 ? '' : 's'})
          </span>
        </div>
        <div className="fin-kpi">
          <strong>{formatarMoeda(resumo.pagar_aberto)}</strong>
          <span>A pagar (aberto)</span>
        </div>
        <div className={`fin-kpi${resumo.qtd_pagar_vencidas ? ' fin-kpi--alerta' : ''}`}>
          <strong>{formatarMoeda(resumo.pagar_vencido)}</strong>
          <span>
            A pagar vencido ({resumo.qtd_pagar_vencidas})
          </span>
        </div>
        <div className="fin-kpi">
          <strong>{formatarMoeda(resumo.comissoes_pendentes)}</strong>
          <span>Comissões pendentes</span>
        </div>
        <div className="fin-kpi">
          <strong>{formatarMoeda(resumo.vales_ativos)}</strong>
          <span>Saldo vales ativos</span>
        </div>
      </div>

      <div className="fin-atalhos">
        <Link to="/financeiro/receber" className="btn">
          Contas a receber
        </Link>
        <Link to="/financeiro/pagar" className="btn btn-secundario">
          Contas a pagar
        </Link>
        <Link to="/financeiro/caixa" className="btn btn-secundario">
          Conferência de caixa
        </Link>
        <Link to="/financeiro/comissoes" className="btn btn-secundario">
          Comissões
        </Link>
        <Link to="/financeiro/vales" className="btn btn-secundario">
          Vales desconto
        </Link>
      </div>
    </AppPageHeader>
  );
}
