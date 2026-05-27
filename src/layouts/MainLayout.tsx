import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AppMenuGroup } from '@/components/AppMenuGroup';
import { HubLogo } from '@/components/HubLogo';
import { HubPerfilCard } from '@/components/HubPerfilCard';
import { NovidadesAutoPrompt } from '@/components/NovidadesAutoPrompt';
import { NovidadesBotao } from '@/components/NovidadesBotao';
import { ChatLauncher } from '@/components/chat/ChatLauncher';
import { TemaToggle } from '@/components/TemaToggle';
import { usePerfil } from '@/contexts/PerfilContext';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import {
  APPS_SISTEMA,
  HUB_ADMIN_ITENS,
  NOME_PLATAFORMA,
  appPermitido,
  itemHubPermitido,
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

export function MainLayout() {
  const { usuario, sair, session } = usePerfil();
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  useSessionTimeout(Boolean(session && usuario));

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuAberto) {
      document.body.classList.remove('hub-menu-aberto');
      return;
    }
    document.body.classList.add('hub-menu-aberto');
    return () => document.body.classList.remove('hub-menu-aberto');
  }, [menuAberto]);

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

  const layoutClass = menuAberto ? 'layout-hub menu-aberto' : 'layout-hub';

  return (
    <div className={layoutClass}>
      <NovidadesAutoPrompt />
      <header className="menu-mobile-topbar">
        <button
          type="button"
          className="menu-mobile-toggle"
          aria-expanded={menuAberto}
          aria-controls="menu-lateral-drawer"
          onClick={() => setMenuAberto((v) => !v)}
        >
          <span className="menu-mobile-toggle-icone" aria-hidden>
            {menuAberto ? '✕' : '☰'}
          </span>
          <span className="menu-mobile-toggle-texto">Menu</span>
        </button>
        <NavLink
          to="/bem-vindo"
          className="menu-mobile-marca"
          onClick={() => setMenuAberto(false)}
        >
          <HubLogo size="sm" badgeHub />
          <span className="menu-mobile-marca-titulo">{NOME_PLATAFORMA}</span>
        </NavLink>
        <NovidadesBotao compacto className="menu-mobile-novidades" />
        <TemaToggle compacto className="menu-mobile-tema" />
      </header>

      <button
        type="button"
        className="menu-overlay"
        aria-label="Fechar menu"
        onClick={() => setMenuAberto(false)}
        tabIndex={menuAberto ? 0 : -1}
      />

      <aside id="menu-lateral-drawer" className="menu-lateral">
        <NavLink
          to="/bem-vindo"
          className="menu-marca"
          title="Início"
          onClick={() => setMenuAberto(false)}
        >
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
            <div className="menu-secao menu-secao-apps">
              <span className="menu-secao-titulo">
                Apps instalados
                <span className="menu-secao-badge" aria-label={`${appsVisiveis.length} apps`}>
                  {appsVisiveis.length}
                </span>
              </span>
              <ul className="menu-apps-gaveta" aria-label="Apps do ecossistema">
                {appsVisiveis.map((app) => (
                  <AppMenuGroup key={app.id} app={app} />
                ))}
              </ul>
            </div>
          ) : null}
        </nav>

        <div className="menu-rodape">
          <ChatLauncher usuario={usuario} />
          <NovidadesBotao />
          <TemaToggle />
          <HubPerfilCard nome={usuario.nome} cargo={usuario.cargo} />
          <button
            type="button"
            className="btn btn-secundario menu-perfil-sair"
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
