import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { ADMIN_DESCRICAO } from '@/lib/admin/modulos';
import {
  formatarHora,
  formatarMesCurto,
  formatarMoeda,
  resumoGerencial,
  vendasMensaisFiscal,
  vendasPorHora,
} from '@/lib/relatorios/api';
import type { ResumoGerencial } from '@/types/relatorios';
import { AdminSubnav } from '@/pages/admin/AdminSubnav';
import { GraficoBarrasDuplas, RelatorioBarra } from '@/pages/admin/relatorios/RelatorioGraficos';
import '@/pages/admin/admin.css';
import './relatorios.css';

const RESUMO_VAZIO: ResumoGerencial = {
  vendas_hoje_qtd: 0,
  vendas_hoje_valor: 0,
  ticket_medio: 0,
  receber_aberto: 0,
  pagar_aberto: 0,
  receber_vencido: 0,
  pagar_vencido: 0,
  lotes_vencendo: 0,
  nfe_autorizadas: 0,
  nfce_autorizadas: 0,
  estoque_critico: 0,
  clientes_ativos: 0,
};

export function RelatoriosPainelPage() {
  const [resumo, setResumo] = useState<ResumoGerencial>(RESUMO_VAZIO);
  const [horas, setHoras] = useState<{ hora: number; quantidade: number; valor_total: number }[]>([]);
  const [mensal, setMensal] = useState<
    { mes: string; nfe_quantidade: number; nfe_valor: number; nfce_quantidade: number; nfce_valor: number }[]
  >([]);
  const [dataRef, setDataRef] = useState(() => new Date().toISOString().slice(0, 10));
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    const [resumoRes, horasRes, mensalRes] = await Promise.all([
      resumoGerencial(),
      vendasPorHora(dataRef),
      vendasMensaisFiscal(6),
    ]);

    if (resumoRes.error) setErro(resumoRes.error.message);
    else setResumo(resumoRes.resumo);

    if (horasRes.error && !resumoRes.error) setErro(horasRes.error.message);
    else setHoras(horasRes.linhas);

    if (mensalRes.error && !resumoRes.error && !horasRes.error) setErro(mensalRes.error.message);
    else setMensal(mensalRes.linhas);

    setCarregando(false);
  }, [dataRef]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const maxHora = useMemo(
    () => Math.max(...horas.map((h) => h.valor_total), 1),
    [horas],
  );

  const horasComVenda = useMemo(
    () => horas.filter((h) => h.quantidade > 0),
    [horas],
  );

  const rotulosMensal = useMemo(() => mensal.map((m) => formatarMesCurto(m.mes)), [mensal]);

  return (
    <PageShell
      className="hub-page--denso"
      tag="Painel administrativo"
      titulo={
        <>
          Relatórios — <span>gerencial</span>
        </>
      }
      subtitulo={ADMIN_DESCRICAO}
    >
      <AdminSubnav />

      {erro ? (
        <p className="rel-erro" role="alert">
          {erro}
        </p>
      ) : null}

      <div className="rel-kpis" aria-busy={carregando}>
        <Link to="/admin/relatorios/vendas" className="rel-kpi">
          <strong>{resumo.vendas_hoje_qtd}</strong>
          <span>Vendas hoje</span>
          <small>{formatarMoeda(resumo.vendas_hoje_valor)}</small>
        </Link>
        <Link to="/financeiro/receber" className="rel-kpi">
          <strong>{formatarMoeda(resumo.receber_aberto)}</strong>
          <span>A receber</span>
          {resumo.receber_vencido > 0 ? (
            <small>Vencido: {formatarMoeda(resumo.receber_vencido)}</small>
          ) : null}
        </Link>
        <Link to="/financeiro/pagar" className="rel-kpi">
          <strong>{formatarMoeda(resumo.pagar_aberto)}</strong>
          <span>A pagar</span>
          {resumo.pagar_vencido > 0 ? (
            <small>Vencido: {formatarMoeda(resumo.pagar_vencido)}</small>
          ) : null}
        </Link>
        <Link to="/estoque/inventario" className={`rel-kpi${resumo.lotes_vencendo ? ' rel-kpi--alerta' : ''}`}>
          <strong>{resumo.lotes_vencendo}</strong>
          <span>Lotes vencendo (30d)</span>
        </Link>
        <Link to="/admin/relatorios/fiscal" className="rel-kpi">
          <strong>{resumo.nfe_autorizadas}</strong>
          <span>NF-e emitidas</span>
          <small>NFC-e PDV: {resumo.nfce_autorizadas}</small>
        </Link>
        <div className="rel-kpi">
          <strong>{formatarMoeda(resumo.ticket_medio)}</strong>
          <span>Ticket médio</span>
          <small>Pedidos concluídos hoje</small>
        </div>
        <Link
          to="/estoque/inventario"
          className={`rel-kpi${resumo.estoque_critico ? ' rel-kpi--alerta' : ''}`}
        >
          <strong>{resumo.estoque_critico}</strong>
          <span>Estoque crítico</span>
        </Link>
        <Link to="/clientes" className="rel-kpi">
          <strong>{resumo.clientes_ativos}</strong>
          <span>Clientes ativos</span>
        </Link>
      </div>

      <section className="rel-secao" aria-label="Gráficos">
        <h2>Indicadores visuais</h2>
        <div className="rel-grid-graficos">
          <div className="rel-card-grafico">
            <div className="rel-card-grafico__topo">
              <h3>Vendas por hora</h3>
              <Link to="/admin/relatorios/vendas">Detalhes →</Link>
            </div>
            <div className="rel-filtro-data">
              <label htmlFor="rel-data-ref">Data</label>
              <input
                id="rel-data-ref"
                type="date"
                value={dataRef}
                onChange={(e) => setDataRef(e.target.value)}
              />
            </div>
            {horasComVenda.length === 0 && !carregando ? (
              <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>Sem vendas concluídas nesta data.</p>
            ) : (
              horasComVenda.map((h) => (
                <RelatorioBarra
                  key={h.hora}
                  rotulo={formatarHora(h.hora)}
                  valor={h.valor_total}
                  max={maxHora}
                  secundario={`${h.quantidade} · ${formatarMoeda(h.valor_total)}`}
                />
              ))
            )}
          </div>

          <div className="rel-card-grafico">
            <div className="rel-card-grafico__topo">
              <h3>NF-e vs NFC-e (6 meses)</h3>
              <Link to="/admin/relatorios/fiscal">Detalhes →</Link>
            </div>
            {mensal.length > 0 ? (
              <GraficoBarrasDuplas
                rotulos={rotulosMensal}
                serieA={mensal.map((m) => m.nfe_valor)}
                serieB={mensal.map((m) => m.nfce_valor)}
                nomeA="NF-e (valor)"
                nomeB="NFC-e (valor)"
                formatarValor={formatarMoeda}
              />
            ) : (
              <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>Sem dados fiscais no período.</p>
            )}
          </div>
        </div>
      </section>

      <div className="rel-atalhos">
        <Link to="/admin/relatorios/vendas" className="btn">
          Relatório de vendas
        </Link>
        <Link to="/admin/relatorios/fiscal" className="btn btn-secundario">
          Relatório fiscal
        </Link>
        <Link to="/admin/dashboard" className="btn btn-secundario">
          Dashboard operacional
        </Link>
      </div>
    </PageShell>
  );
}
