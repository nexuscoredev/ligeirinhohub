import { useEffect, useState } from 'react';
import { AppLauncherCard } from '@/components/AppLauncherCard';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';
import { ADMIN_DESCRICAO } from '@/lib/admin/modulos';
import { APPS_SISTEMA, appPermitido } from '@/lib/apps';
import { formatarMoeda } from '@/lib/pedidos/constants';
import { listarEntregasPendentes, listarFilaPedidos, listarPedidosGeral } from '@/lib/pedidos/api';
import { supabaseConfigurado } from '@/lib/supabase';
import { AdminSubnav } from '@/pages/admin/AdminSubnav';
import '@/pages/admin/admin.css';
import './DashboardPage.css';

export function DashboardPage() {
  const { usuario } = usePerfil();
  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'equipe';
  const [kpiFila, setKpiFila] = useState('—');
  const [kpiHoje, setKpiHoje] = useState('—');
  const [kpiRota, setKpiRota] = useState('—');
  const [kpiFat, setKpiFat] = useState('R$ —');

  useEffect(() => {
    if (!supabaseConfigurado) return;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    void Promise.all([
      listarFilaPedidos(),
      listarEntregasPendentes(),
      listarPedidosGeral(),
    ]).then(([fila, rota, geral]) => {
      setKpiFila(String(fila.pedidos.length));
      setKpiRota(String(rota.pedidos.length));
      const doDia = geral.pedidos.filter(
        (p) => new Date(p.created_at) >= hoje,
      );
      setKpiHoje(String(doDia.length));
      const fat = doDia.reduce((s, p) => s + Number(p.valor_pedido), 0);
      setKpiFat(formatarMoeda(fat));
    });
  }, []);

  const kpis = [
    { rotulo: 'Pedidos hoje', valor: kpiHoje, nota: 'Criados desde 00h' },
    { rotulo: 'Em preparo', valor: kpiFila, nota: 'Fila operacional' },
    { rotulo: 'Em rota', valor: kpiRota, nota: 'Entregas pendentes' },
    { rotulo: 'Faturamento', valor: kpiFat, nota: 'Pedidos do dia' },
  ];

  const appsVisiveis = usuario
    ? APPS_SISTEMA.filter((app) =>
        appPermitido(
          app,
          usuario.cargo,
          usuario.paginas_permitidas,
          usuario.email,
        ),
      )
    : [];

  return (
    <PageShell
      className="hub-page--denso hub-page--dashboard"
      tag="Painel administrativo"
      titulo={
        <>
          Dashboard — <span>{primeiroNome}</span>
        </>
      }
      subtitulo={ADMIN_DESCRICAO}
    >
      <AdminSubnav />

      <div className="dashboard-topo">
        <div className="hub-stat-card">
          <strong>{appsVisiveis.length || APPS_SISTEMA.length}</strong>
          <span>apps</span>
        </div>
        <div className="hub-stat-card">
          <strong>{kpiFila}</strong>
          <span>pedido · fila</span>
        </div>
        <div className="hub-stat-card hub-stat-card--cargo">
          <span className="hub-stat-card__rotulo">Cargo</span>
          <strong className="hub-stat-card__valor" title={usuario?.cargo ?? undefined}>
            {usuario?.cargo ?? '—'}
          </strong>
        </div>
      </div>

      <section aria-labelledby="dashboard-kpis-titulo">
        <div className="hub-secao-header">
          <h2 id="dashboard-kpis-titulo" className="hub-secao-titulo">
            Indicadores <span>do dia</span>
          </h2>
        </div>
        <div className="dashboard-kpi-grid">
          {kpis.map((kpi) => (
            <article key={kpi.rotulo} className="dashboard-kpi-card">
              <span className="dashboard-kpi-rotulo">{kpi.rotulo}</span>
              <span className="dashboard-kpi-valor">{kpi.valor}</span>
              <span className="dashboard-kpi-nota">{kpi.nota}</span>
            </article>
          ))}
        </div>
      </section>

      {appsVisiveis.length > 0 ? (
        <section
          className="hub-secao--apps"
          aria-labelledby="dashboard-apps-titulo"
        >
          <div className="hub-secao-header">
            <h2 id="dashboard-apps-titulo" className="hub-secao-titulo">
              Aplicativos
            </h2>
          </div>
          <div className="hub-apps-launcher-grid hub-apps-launcher-grid--dashboard">
            {appsVisiveis.map((app, i) => (
              <AppLauncherCard
                key={app.id}
                app={app}
                compact
                staggerIndex={i}
              />
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
