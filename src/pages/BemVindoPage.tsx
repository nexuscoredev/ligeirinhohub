import { Link } from 'react-router-dom';
import { AppLauncherCard } from '@/components/AppLauncherCard';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';
import { APPS_SISTEMA, HUB_ADMIN_ITENS, appPermitido } from '@/lib/apps';

export function BemVindoPage() {
  const { usuario } = usePerfil();
  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'usuário';

  const atalhosHub = HUB_ADMIN_ITENS.filter(
    (i) => i.rota === '/dashboard' || i.rota === '/produtos',
  );

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
      tag="Hub administrativo"
      titulo={<>Bem-vindo, {primeiroNome}</>}
      subtitulo="O ecossistema é organizado em apps — cada um com identidade visual e módulos internos."
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

      {appsVisiveis.length > 0 ? (
        <>
          <div className="hub-secao-header">
            <h2 className="hub-secao-titulo">
              Apps <span>disponíveis</span>
            </h2>
          </div>
          <div className="hub-apps-launcher-grid">
            {appsVisiveis.map((app) => (
              <AppLauncherCard key={app.id} app={app} />
            ))}
          </div>
        </>
      ) : null}
    </PageShell>
  );
}
