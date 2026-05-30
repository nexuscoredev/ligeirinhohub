import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { ADMIN_DESCRICAO } from '@/lib/admin/modulos';
import {
  formatarMesCurto,
  formatarMoeda,
  vendasMensaisFiscal,
} from '@/lib/relatorios/api';
import { AdminSubnav } from '@/pages/admin/AdminSubnav';
import { GraficoBarrasDuplas } from '@/pages/admin/relatorios/RelatorioGraficos';
import '@/pages/admin/admin.css';
import './relatorios.css';

const MESES_OPCOES = [6, 12, 18] as const;

export function RelatoriosFiscalPage() {
  const [meses, setMeses] = useState<number>(12);
  const [linhas, setLinhas] = useState<
    {
      mes: string;
      nfe_quantidade: number;
      nfe_valor: number;
      nfce_quantidade: number;
      nfce_valor: number;
    }[]
  >([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { linhas: dados, error } = await vendasMensaisFiscal(meses);
    if (error) setErro(error.message);
    else {
      setLinhas(dados);
      setErro(null);
    }
    setCarregando(false);
  }, [meses]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const totais = useMemo(
    () =>
      linhas.reduce(
        (acc, l) => ({
          nfeQtd: acc.nfeQtd + l.nfe_quantidade,
          nfeVal: acc.nfeVal + l.nfe_valor,
          nfceQtd: acc.nfceQtd + l.nfce_quantidade,
          nfceVal: acc.nfceVal + l.nfce_valor,
        }),
        { nfeQtd: 0, nfeVal: 0, nfceQtd: 0, nfceVal: 0 },
      ),
    [linhas],
  );

  const rotulos = useMemo(() => linhas.map((l) => formatarMesCurto(l.mes)), [linhas]);

  return (
    <PageShell
      className="hub-page--denso"
      tag="Relatórios"
      titulo={
        <>
          Fiscal — <span>NF-e vs NFC-e</span>
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
        <label htmlFor="rel-fiscal-meses">Período</label>
        <select
          id="rel-fiscal-meses"
          value={meses}
          onChange={(e) => setMeses(Number(e.target.value))}
        >
          {MESES_OPCOES.map((m) => (
            <option key={m} value={m}>
              Últimos {m} meses
            </option>
          ))}
        </select>
      </div>

      <div className="rel-kpis" aria-busy={carregando}>
        <div className="rel-kpi">
          <strong>{totais.nfeQtd}</strong>
          <span>NF-e autorizadas</span>
          <small>{formatarMoeda(totais.nfeVal)}</small>
        </div>
        <div className="rel-kpi">
          <strong>{totais.nfceQtd}</strong>
          <span>NFC-e PDV</span>
          <small>{formatarMoeda(totais.nfceVal)}</small>
        </div>
        <Link to="/fiscal/emitidas" className="rel-kpi">
          <strong>→</strong>
          <span>Notas emitidas</span>
        </Link>
      </div>

      <section className="rel-secao" aria-label="Gráfico mensal">
        <h2>Faturamento mensal</h2>
        <div className="rel-card-grafico">
          {linhas.length > 0 ? (
            <GraficoBarrasDuplas
              rotulos={rotulos}
              serieA={linhas.map((l) => l.nfe_valor)}
              serieB={linhas.map((l) => l.nfce_valor)}
              nomeA="NF-e"
              nomeB="NFC-e"
              formatarValor={formatarMoeda}
            />
          ) : (
            <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>Sem notas no período selecionado.</p>
          )}
        </div>
      </section>

      <section className="rel-secao" aria-label="Tabela mensal">
        <h2>Detalhamento mensal</h2>
        <div className="rel-card-grafico rel-resumo-lista">
          {linhas.map((l) => (
            <div key={l.mes} className="rel-resumo-linha">
              <span>{formatarMesCurto(l.mes)}</span>
              <strong>
                NF-e {l.nfe_quantidade} ({formatarMoeda(l.nfe_valor)}) · NFC-e{' '}
                {l.nfce_quantidade} ({formatarMoeda(l.nfce_valor)})
              </strong>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
