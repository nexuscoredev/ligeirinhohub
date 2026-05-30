import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { ADMIN_DESCRICAO } from '@/lib/admin/modulos';
import {
  formatarHora,
  formatarMoeda,
  vendasPorHora,
} from '@/lib/relatorios/api';
import { AdminSubnav } from '@/pages/admin/AdminSubnav';
import { RelatorioBarra } from '@/pages/admin/relatorios/RelatorioGraficos';
import '@/pages/admin/admin.css';
import './relatorios.css';

export function RelatoriosVendasPage() {
  const [dataRef, setDataRef] = useState(() => new Date().toISOString().slice(0, 10));
  const [horas, setHoras] = useState<
    { hora: number; quantidade: number; valor_total: number }[]
  >([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { linhas, error } = await vendasPorHora(dataRef);
    if (error) setErro(error.message);
    else {
      setHoras(linhas);
      setErro(null);
    }
    setCarregando(false);
  }, [dataRef]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const totais = useMemo(() => {
    const qtd = horas.reduce((s, h) => s + h.quantidade, 0);
    const valor = horas.reduce((s, h) => s + h.valor_total, 0);
    return { qtd, valor, ticket: qtd ? valor / qtd : 0 };
  }, [horas]);

  const maxValor = useMemo(
    () => Math.max(...horas.map((h) => h.valor_total), 1),
    [horas],
  );

  return (
    <PageShell
      className="hub-page--denso"
      tag="Relatórios"
      titulo={
        <>
          Vendas por <span>hora</span>
        </>
      }
      subtitulo={ADMIN_DESCRICAO}
    >
      <AdminSubnav />

      <p style={{ marginBottom: '0.75rem' }}>
        <Link to="/admin/relatorios">← Voltar ao painel gerencial</Link>
      </p>

      {erro ? (
        <p className="rel-erro" role="alert">
          {erro}
        </p>
      ) : null}

      <div className="rel-filtro-data">
        <label htmlFor="rel-vendas-data">Data de referência</label>
        <input
          id="rel-vendas-data"
          type="date"
          value={dataRef}
          onChange={(e) => setDataRef(e.target.value)}
        />
      </div>

      <div className="rel-kpis" aria-busy={carregando}>
        <div className="rel-kpi">
          <strong>{totais.qtd}</strong>
          <span>Pedidos concluídos</span>
        </div>
        <div className="rel-kpi">
          <strong>{formatarMoeda(totais.valor)}</strong>
          <span>Faturamento</span>
        </div>
        <div className="rel-kpi">
          <strong>{formatarMoeda(totais.ticket)}</strong>
          <span>Ticket médio</span>
        </div>
      </div>

      <section className="rel-secao" aria-label="Distribuição horária">
        <h2>Distribuição por hora</h2>
        <div className="rel-card-grafico">
          {horas.every((h) => h.quantidade === 0) && !carregando ? (
            <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>
              Nenhuma venda concluída em {dataRef.split('-').reverse().join('/')}.
            </p>
          ) : (
            horas.map((h) => (
              <RelatorioBarra
                key={h.hora}
                rotulo={formatarHora(h.hora)}
                valor={h.valor_total}
                max={maxValor}
                secundario={
                  h.quantidade
                    ? `${h.quantidade} ped. · ${formatarMoeda(h.valor_total)}`
                    : '—'
                }
                cor={h.quantidade ? undefined : 'transparent'}
              />
            ))
          )}
        </div>
      </section>

      <section className="rel-secao" aria-label="Tabela resumo">
        <h2>Resumo numérico</h2>
        <div className="rel-card-grafico rel-resumo-lista">
          {horas
            .filter((h) => h.quantidade > 0)
            .map((h) => (
              <div key={h.hora} className="rel-resumo-linha">
                <span>{formatarHora(h.hora)}</span>
                <strong>
                  {h.quantidade} · {formatarMoeda(h.valor_total)}
                </strong>
              </div>
            ))}
        </div>
      </section>
    </PageShell>
  );
}
