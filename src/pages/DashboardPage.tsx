import { Link } from 'react-router-dom';
import { HubLogo } from '@/components/HubLogo';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';
import { APPS_SISTEMA } from '@/lib/apps';
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
            <strong>{APPS_SISTEMA.length}</strong>
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

      <section aria-labelledby="dashboard-apps-titulo">
        <div className="hub-secao-header">
          <h2 id="dashboard-apps-titulo" className="hub-secao-titulo">
            Apps <span>do sistema</span>
          </h2>
        </div>
        <div className="dashboard-apps-grid">
          {APPS_SISTEMA.map((app) => (
            <article key={app.id} className="dashboard-app-card card">
              <header className="dashboard-app-card-header">
                <span aria-hidden>{app.icone}</span>
                <Link to={app.rotaEntrada} className="dashboard-app-nome">
                  {app.nome}
                </Link>
              </header>
              <ul className="dashboard-app-itens">
                {app.itens.map((item) => (
                  <li key={item.rota}>
                    <Link to={item.rota}>
                      <span aria-hidden>{item.icone}</span>
                      {item.titulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
