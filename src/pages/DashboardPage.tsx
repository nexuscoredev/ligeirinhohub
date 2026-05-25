import { AppLauncherCard } from '@/components/AppLauncherCard';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';
import { APPS_SISTEMA, appPermitido } from '@/lib/apps';
import { supabaseConfigurado } from '@/lib/supabase';
import './DashboardPage.css';

const kpis = [
  { rotulo: 'Pedidos hoje', valor: '—', nota: 'Aguardando módulo pedidos' },
  { rotulo: 'Em preparo', valor: '—', nota: 'Fila operacional' },
  { rotulo: 'Em rota', valor: '—', nota: 'Motoristas' },
  { rotulo: 'Faturamento', valor: 'R$ —', nota: 'Dashboard Fase 1' },
];

export function DashboardPage() {
  const { usuario } = usePerfil();
  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'equipe';

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
      className="hub-page--denso"
      tag="• Gelada • Rápida • Completa"
      titulo={
        <>
          Olá, {primeiroNome} — visão <span>gerencial</span>
        </>
      }
      subtitulo="PDV, Totem e Operacional."
    >
      <div className="dashboard-topo">
        <div className="hub-stat-card">
          <strong>{appsVisiveis.length || APPS_SISTEMA.length}</strong>
          <span>apps</span>
        </div>
        <div className="hub-stat-card">
          <strong>1</strong>
          <span>pedido · fila</span>
        </div>
        <div className="hub-stat-card">
          <strong>{usuario?.cargo ?? '—'}</strong>
          <span>seu cargo</span>
        </div>
      </div>

      <div
        className={`dashboard-status ${supabaseConfigurado ? 'ok' : ''}`}
        role="status"
      >
        <span className="dashboard-status-dot" aria-hidden />
        Supabase:{' '}
        <strong>
          {supabaseConfigurado ? 'conectado' : 'não configurado'}
        </strong>
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
              Lançar <span>app</span>
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
