import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';
import { APPS_SISTEMA, HUB_ADMIN_ITENS } from '@/lib/apps';

export function BemVindoPage() {
  const { usuario } = usePerfil();
  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'usuário';

  const atalhosHub = HUB_ADMIN_ITENS.filter(
    (i) => i.rota === '/dashboard' || i.rota === '/produtos',
  );

  return (
    <PageShell
      comLogo
      tag="Hub administrativo"
      titulo={<>Bem-vindo, {primeiroNome}</>}
      subtitulo="O ecossistema é organizado em apps — cada um com seus módulos internos."
      acoes={
        <Link to="/dashboard" className="btn">
          Ir ao dashboard
        </Link>
      }
    >
      <div className="hub-grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <p style={{ margin: '0 0 0.5rem', color: 'var(--hub-muted)' }}>
            Seu perfil
          </p>
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
            {usuario?.nome}
          </p>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--hub-gold)' }}>
            {usuario?.cargo}
          </p>
        </div>
        <div className="card">
          <p style={{ margin: '0 0 0.5rem', color: 'var(--hub-muted)' }}>
            Conceito
          </p>
          <p style={{ margin: 0 }}>
            <strong>Apps</strong> são módulos nomeados (ex.: Ligeirinho
            Operacional) com telas dentro — Clientes e Motoristas ficam no app
            Operacional.
          </p>
        </div>
      </div>

      {atalhosHub.length > 0 ? (
        <>
          <div className="hub-secao-header">
            <h2 className="hub-secao-titulo">
              Hub <span>administrativo</span>
            </h2>
          </div>
          <div className="hub-grid-4" style={{ marginBottom: '1.75rem' }}>
            {atalhosHub.map((item) => (
              <Link key={item.rota} to={item.rota} className="hub-modulo-card">
                <span className="hub-modulo-icone" aria-hidden>
                  {item.icone}
                </span>
                <strong>{item.titulo}</strong>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      <div className="hub-secao-header">
        <h2 className="hub-secao-titulo">
          Apps <span>disponíveis</span>
        </h2>
      </div>
      <div className="hub-grid-2">
        {APPS_SISTEMA.map((app) => (
          <article key={app.id} className="card app-resumo-card">
            <Link to={app.rotaEntrada} className="app-resumo-titulo">
              <span aria-hidden>{app.icone}</span>
              {app.nome}
            </Link>
            <ul className="app-resumo-itens">
              {app.itens.map((item) => (
                <li key={item.rota}>
                  <Link to={item.rota}>{item.titulo}</Link>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
