import { Link } from 'react-router-dom';
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
    <div className="dashboard-bebidas">
      <header className="dashboard-hero">
        <div className="dashboard-logo-box" aria-hidden>
          🍷
        </div>
        <div>
          <span className="dashboard-tag">• Gelada • Rápida • Completa</span>
          <h1 className="dashboard-titulo">
            Ligeirinho <span>Hub</span>
          </h1>
          <p className="dashboard-subtitulo">
            Olá, {primeiroNome} — visão gerencial da adega. Entrega, balcão e
            operação em um só lugar.
          </p>
          <div className="dashboard-hero-kpis">
            <div className="dashboard-mini-kpi">
              <div>
                <strong>+100</strong>
                <span>produtos (meta)</span>
              </div>
            </div>
            <div className="dashboard-mini-kpi">
              <div>
                <strong>1</strong>
                <span>pedido · uma fila</span>
              </div>
            </div>
            <div className="dashboard-mini-kpi">
              <div>
                <strong>{usuario?.cargo ?? '—'}</strong>
                <span>seu cargo</span>
              </div>
            </div>
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
        <div className="dashboard-secao-cabecalho">
          <h2 id="dashboard-kpis-titulo" className="dashboard-secao-titulo">
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
        <div className="dashboard-secao-cabecalho">
          <h2 id="dashboard-modulos-titulo" className="dashboard-secao-titulo">
            Explore o <span>ecossistema</span>
          </h2>
          <Link to="/pedidos" className="dashboard-secao-link">
            Ver pedidos →
          </Link>
        </div>
        <div className="dashboard-modulos-grid">
          {modulos.map((mod) => (
            <Link
              key={mod.nome}
              to={mod.rota}
              className="dashboard-modulo-card"
            >
              <span className="dashboard-modulo-icone" aria-hidden>
                {mod.icone}
              </span>
              <strong>{mod.nome}</strong>
              <em>{mod.status}</em>
            </Link>
          ))}
        </div>
      </section>

      <p className="dashboard-destaque">
        Design inspirado em{' '}
        <strong>Ligeirinho Bebidas</strong> — mesmo DNA visual (preto, laranja e
        dourado) aplicado ao painel administrativo.
      </p>
    </div>
  );
}
