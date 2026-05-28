import { Link } from 'react-router-dom';
import { AppLauncherCard } from '@/components/AppLauncherCard';
import { HubPerfilCard } from '@/components/HubPerfilCard';
import { PageShell } from '@/components/PageShell';
import { usePerfil } from '@/contexts/PerfilContext';
import { APPS_SISTEMA, appPermitido, itemHubPermitido } from '@/lib/apps';
import { HUB_ADMIN_MODULOS } from '@/lib/admin/modulos';
import '@/pages/admin/admin.css';

export function BemVindoPage() {
  const { usuario } = usePerfil();
  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'usuário';

  const atalhosHub = usuario
    ? HUB_ADMIN_MODULOS.filter((item) =>
        itemHubPermitido(
          item,
          usuario.cargo,
          usuario.paginas_permitidas,
          usuario.email,
        ),
      )
    : [];

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
      className="hub-page--denso hub-page--bem-vindo"
      tag="Hub administrativo"
      titulo={<>Bem-vindo, {primeiroNome}</>}
      subtitulo="Apps do ecossistema Ligeirinho."
    >
      {usuario ? (
        <HubPerfilCard
          nome={usuario.nome}
          cargo={usuario.cargo}
          avatarUrl={usuario.avatar_url}
          linkTo="/perfil"
          className="hub-perfil-card--pagina"
        />
      ) : null}

      {atalhosHub.length > 0 ? (
        <section
          className="hub-secao--hub-admin"
          aria-labelledby="hub-admin-titulo"
        >
          <div className="hub-secao-header">
            <h2 id="hub-admin-titulo" className="hub-secao-titulo">
              Hub <span>administrativo</span>
            </h2>
          </div>
          <nav className="admin-subnav admin-subnav--home" aria-label="Atalhos do hub administrativo">
            {atalhosHub.map((item) => (
              <Link key={item.rota} to={item.rota} className="admin-subnav-link">
                <span aria-hidden>{item.icone}</span>
                {item.titulo}
              </Link>
            ))}
          </nav>
        </section>
      ) : null}

      {appsVisiveis.length > 0 ? (
        <section className="hub-secao--apps" aria-labelledby="hub-apps-titulo">
          <div className="hub-secao-header">
            <h2 id="hub-apps-titulo" className="hub-secao-titulo">
              Seus <span>apps</span>
            </h2>
          </div>
          <div className="hub-apps-launcher-grid hub-apps-launcher-grid--home">
            {appsVisiveis.map((app, i) => (
              <AppLauncherCard key={app.id} app={app} staggerIndex={i} />
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
