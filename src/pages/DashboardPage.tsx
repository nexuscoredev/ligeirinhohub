import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';
import { supabaseConfigurado } from '@/lib/supabase';
import './DashboardPage.css';

const kpis = [
  { rotulo: 'Pedidos hoje', valor: '—', nota: 'Aguardando módulo pedidos' },
  { rotulo: 'Em preparo', valor: '—', nota: 'Fila operacional' },
  { rotulo: 'Em rota', valor: '—', nota: 'Motoristas' },
  { rotulo: 'Faturamento', valor: 'R$ —', nota: 'Dashboard Fase 1' },
];

const modulos = [
  { nome: 'PDV', rota: '/pdv', status: 'Em breve', icone: '🛒' },
  { nome: 'Totem', rota: '/totem', status: 'Em breve', icone: '📱' },
  { nome: 'Operacional', rota: '/operacional', status: 'Em breve', icone: '⚡' },
  { nome: 'Motoristas', rota: '/motorista', status: 'Em breve', icone: '🚚' },
];

export function DashboardPage() {
  const { usuario } = usePerfil();
  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'equipe';

  return (
    <PageShell
      tag="• Gelada • Rápida • Completa"
      titulo={
        <>
          Olá, {primeiroNome} — visão <span>gerencial</span>
        </>
      }
      subtitulo="Entrega, balcão e operação da adega em um só painel."
    >
      <header className="dashboard-hero">
        <div className="dashboard-logo-box" aria-hidden>
          🍷
        </div>
        <div className="dashboard-hero-kpis">
          <div className="hub-stat-card">
            <strong>+100</strong>
            <span>produtos (meta catálogo)</span>
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
        {supabaseConfigurado
          ? ' — pronto para pedidos e realtime'
          : ' — verifique VITE_SUPABASE_* no .env'}
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

      <section aria-labelledby="dashboard-modulos-titulo">
        <div className="hub-secao-header">
          <h2 id="dashboard-modulos-titulo" className="hub-secao-titulo">
            Explore o <span>ecossistema</span>
          </h2>
          <Link to="/pedidos" className="hub-link">
            Ver pedidos →
          </Link>
        </div>
        <div className="dashboard-modulos-grid">
          {modulos.map((mod) => (
            <Link
              key={mod.nome}
              to={mod.rota}
              className="hub-modulo-card"
            >
              <span className="hub-modulo-icone" aria-hidden>
                {mod.icone}
              </span>
              <strong>{mod.nome}</strong>
              <em>{mod.status}</em>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
