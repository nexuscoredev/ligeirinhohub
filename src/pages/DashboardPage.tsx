import { HubLogo } from '@/components/HubLogo';
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
      comLogo
      tag="• Gelada • Rápida • Completa"
      titulo={
        <>
          Olá, {primeiroNome} — visão <span>gerencial</span>
        </>
      }
      subtitulo="Apps do ecossistema: PDV, Totem e Operacional com seus módulos internos."
    >
      <header className="dashboard-hero">
        <HubLogo size="hero" glow className="dashboard-hero-logo" />
        <div className="dashboard-hero-kpis">
          <div className="hub-stat-card">
            <strong>{appsVisiveis.length || APPS_SISTEMA.length}</strong>
            <span>apps no ecossistema</span>
          </div>
          <div className="hub-stat-card">
            <strong>1</strong>
            <span>pedido · uma fila</span>
          </div>
          <div className="hub-stat-card">
            <strong>{usuario?.cargo ?? '—'}</strong>
            <span>seu cargo no hub</span>
          </div>
        </div>
      </header>

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
          <div className="hub-apps-hero hub-apps-hero--compact">
            <h2 id="dashboard-apps-titulo" className="hub-apps-hero__titulo">
              Lançar <span>app</span>
            </h2>
            <p className="hub-apps-hero__sub">
              Acesso rápido aos módulos de operação e venda.
            </p>
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
