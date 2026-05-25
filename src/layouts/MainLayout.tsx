import { NavLink, Outlet } from 'react-router-dom';
import { HubLogo } from '@/components/HubLogo';
import { usePerfil } from '@/contexts/PerfilContext';
import {
  APPS_SISTEMA,
  HUB_ADMIN_ITENS,
  NOME_PLATAFORMA,
  appPermitido,
  appTemSubmenu,
  itemHubPermitido,
  type AppSistema,
  type ItemApp,
} from '@/lib/apps';
import { appDisplayVersion } from '@/lib/appDisplayVersion';

function MenuLink({ item }: { item: ItemApp }) {
  return (
    <li>
      <NavLink
        to={item.rota}
        className={({ isActive }) =>
          isActive ? 'menu-link ativo' : 'menu-link'
        }
        end
      >
        <span className="menu-link-icone" aria-hidden>
          {item.icone}
        </span>
        {item.titulo}
      </NavLink>
    </li>
  );
}

function MenuApp({ app }: { app: AppSistema }) {
  const submenu = appTemSubmenu(app);

  if (!submenu) {
    const item = app.itens[0];
    return (
      <li className="menu-app-item">
        <NavLink
          to={item.rota}
          className={({ isActive }) =>
            isActive ? 'menu-link menu-link-app ativo' : 'menu-link menu-link-app'
          }
          end
        >
          <span className="menu-link-icone" aria-hidden>
            {app.icone}
          </span>
          {app.nome}
        </NavLink>
      </li>
    );
  }

  return (
    <li className="menu-app-grupo">
      <NavLink
        to={app.rotaEntrada}
        className={({ isActive }) =>
          isActive ? 'menu-app-titulo ativo' : 'menu-app-titulo'
        }
      >
        <span className="menu-link-icone" aria-hidden>
          {app.icone}
        </span>
        {app.nome}
      </NavLink>
      <ul className="menu-app-filhos">
        {app.itens.map((item) => (
          <MenuLink key={item.rota} item={item} />
        ))}
      </ul>
    </li>
  );
}

export function MainLayout() {
  const { usuario, sair } = usePerfil();

  if (!usuario) return null;

  const hubVisivel = HUB_ADMIN_ITENS.filter((item) =>
    itemHubPermitido(
      item,
      usuario.cargo,
      usuario.paginas_permitidas,
      usuario.email,
    ),
  );

  const appsVisiveis = APPS_SISTEMA.filter((app) =>
    appPermitido(
      app,
      usuario.cargo,
      usuario.paginas_permitidas,
      usuario.email,
    ),
  );

  return (
    <div className="layout-hub">
      <aside className="menu-lateral">
        <NavLink to="/bem-vindo" className="menu-marca" title="Início">
          <HubLogo size="sm" badgeHub />
          <div className="menu-marca-texto">
            <span className="menu-marca-titulo">{NOME_PLATAFORMA}</span>
            <span className="menu-marca-versao">{appDisplayVersion()}</span>
          </div>
        </NavLink>

        <nav className="menu-nav" aria-label="Menu principal">
          {hubVisivel.length > 0 ? (
            <div className="menu-secao">
              <span className="menu-secao-titulo">{NOME_PLATAFORMA}</span>
              <ul>
                {hubVisivel.map((item) => (
                  <MenuLink key={item.rota} item={item} />
                ))}
              </ul>
            </div>
          ) : null}

          {appsVisiveis.length > 0 ? (
            <div className="menu-secao">
              <span className="menu-secao-titulo">Apps</span>
              <ul className="menu-apps-lista">
                {appsVisiveis.map((app) => (
                  <MenuApp key={app.id} app={app} />
                ))}
              </ul>
            </div>
          ) : null}
        </nav>

        <div className="menu-rodape">
          <div>
            <p className="menu-usuario">{usuario.nome}</p>
            <p className="menu-cargo">{usuario.cargo}</p>
          </div>
          <button
            type="button"
            className="btn btn-secundario"
            onClick={() => void sair()}
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="conteudo-principal">
        <Outlet />
      </main>
    </div>
  );
}
