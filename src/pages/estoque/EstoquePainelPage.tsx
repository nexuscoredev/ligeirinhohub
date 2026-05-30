import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppPageHeader } from '@/components/AppPageHeader';
import { appPorId, itemAppPorRota } from '@/lib/apps';
import { resumoEstoque } from '@/lib/estoque/api';
import type { ResumoEstoque } from '@/types/estoque';
import './estoque.css';

const RESUMO_VAZIO: ResumoEstoque = {
  produtos_com_saldo: 0,
  produtos_criticos: 0,
  lotes_vencendo: 0,
  movimentos_hoje: 0,
  total_unidades: 0,
};

export function EstoquePainelPage() {
  const app = appPorId('estoque');
  const item = app ? itemAppPorRota(app, '/estoque') : null;

  const [resumo, setResumo] = useState<ResumoEstoque>(RESUMO_VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { resumo: dados, error } = await resumoEstoque();
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
      titulo="Painel Estoque"
      subtitulo="Saldos, movimentos, lotes e inventário."
    >
      {erro ? (
        <p className="est-erro" role="alert">
          {erro}
        </p>
      ) : null}

      <div className="est-kpis" aria-busy={carregando}>
        <div className="est-kpi">
          <strong>{resumo.produtos_com_saldo}</strong>
          <span>Produtos com saldo</span>
        </div>
        <div className={`est-kpi${resumo.produtos_criticos ? ' est-kpi--alerta' : ''}`}>
          <strong>{resumo.produtos_criticos}</strong>
          <span>Abaixo do mínimo</span>
        </div>
        <div className={`est-kpi${resumo.lotes_vencendo ? ' est-kpi--alerta' : ''}`}>
          <strong>{resumo.lotes_vencendo}</strong>
          <span>Lotes vencendo (30d)</span>
        </div>
        <div className="est-kpi">
          <strong>{resumo.movimentos_hoje}</strong>
          <span>Movimentos hoje</span>
        </div>
        <div className="est-kpi">
          <strong>{Math.round(resumo.total_unidades)}</strong>
          <span>Unidades em estoque</span>
        </div>
      </div>

      <div className="est-atalhos">
        <Link to="/estoque/movimentos" className="btn">
          Entrada / Saída
        </Link>
        <Link to="/estoque/inventario" className="btn btn-secundario">
          Inventário
        </Link>
        <Link to="/estoque/entrada-xml" className="btn btn-secundario">
          Entrada XML
        </Link>
        <Link to="/estoque/inventario/app" className="btn btn-secundario">
          Inventário (app)
        </Link>
      </div>
    </AppPageHeader>
  );
}
