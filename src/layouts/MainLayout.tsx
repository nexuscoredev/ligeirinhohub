import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AppMenuGroup } from '@/components/AppMenuGroup';
import { HubLogo } from '@/components/HubLogo';
import { HubPerfilButton } from '@/components/HubPerfilButton';
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
import { lerMenuRecolhido, salvarMenuRecolhido } from '@/lib/menuLateral';

function MenuLink({ item, recolhido }: { item: ItemApp; recolhido: boolean }) {
  return (
    <li>
      <NavLink
        to={item.rota}
        className={({ isActive }) =>
          isActive ? 'menu-link ativo' : 'menu-link'
        }
        end
        title={recolhido ? item.titulo : undefined}
      >
        <span className="menu-link-icone" aria-hidden>
          {item.icone}
        </span>
        <span className="menu-link-texto">{item.titulo}</span>
      </NavLink>
    </li>
  );
}

export function MainLayout() {
  const { usuario, sair, session } = usePerfil();
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const [menuRecolhido, setMenuRecolhido] = useState(lerMenuRecolhido);

  useSessionTimeout(Boolean(session && usuario));

  function alternarMenuRecolhido() {
    setMenuRecolhido((atual) => {
      const proximo = !atual;
      salvarMenuRecolhido(proximo);
      return proximo;
    });
  }

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

  const hubVisivel = HUB_ADMIN_ITENS.filter(
    (item) =>
      item.rota !== '/perfil' &&
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

  const layoutClass = [
    'layout-hub',
    menuAberto ? 'menu-aberto' : '',
    menuRecolhido ? 'menu-recolhido' : '',
  ]
    .filter(Boolean)
    .join(' ');

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
        <HubPerfilButton
          nome={usuario.nome}
          cargo={usuario.cargo}
          avatarUrl={usuario.avatar_url}
          size="sm"
          className="menu-mobile-perfil"
        />
      </header>

      <div className="hub-acoes-topo" aria-label="Ações rápidas">
        <NovidadesBotao compacto className="hub-acoes-topo__item" />
        <TemaToggle compacto className="hub-acoes-topo__item" />
        <HubPerfilButton
          nome={usuario.nome}
          cargo={usuario.cargo}
          avatarUrl={usuario.avatar_url}
          size="md"
        />
      </div>

      <button
        type="button"
        className="menu-overlay"
        aria-label="Fechar menu"
        onClick={() => setMenuAberto(false)}
        tabIndex={menuAberto ? 0 : -1}
      />

      <aside
        id="menu-lateral-drawer"
        className={menuRecolhido ? 'menu-lateral menu-lateral--recolhido' : 'menu-lateral'}
      >
        <NavLink
          to="/sobre"
          className="menu-marca"
          title="Sobre o Ligeirinho Hub"
          onClick={() => setMenuAberto(false)}
        >
          <HubLogo size="sm" badgeHub />
          <div className="menu-marca-texto">
            <span className="menu-marca-titulo">{NOME_PLATAFORMA}</span>
            <span className="menu-marca-versao">{appDisplayVersion()}</span>
          </div>
        </NavLink>

        <button
          type="button"
          className="menu-recolher-btn"
          onClick={alternarMenuRecolhido}
          aria-label={menuRecolhido ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          aria-expanded={!menuRecolhido}
          title={menuRecolhido ? 'Expandir menu' : 'Recolher menu'}
        >
          <span className="menu-recolher-btn-icone" aria-hidden>
            {menuRecolhido ? '›' : '‹'}
          </span>
          <span className="menu-recolher-btn-texto">
            {menuRecolhido ? 'Expandir' : 'Recolher'}
          </span>
        </button>

        <nav className="menu-nav" aria-label="Menu principal">
          {hubVisivel.length > 0 ? (
            <div className="menu-secao">
              <span className="menu-secao-titulo">{NOME_PLATAFORMA}</span>
              <ul>
                {hubVisivel.map((item) => (
                  <MenuLink key={item.rota} item={item} recolhido={menuRecolhido} />
                ))}
              </ul>
            </div>
          ) : null}

          {appsVisiveis.length > 0 ? (
            <div className="menu-secao menu-secao-apps">
              <span className="menu-secao-titulo">
                Aplicativos
                <span className="menu-secao-badge" aria-label={`${appsVisiveis.length} apps`}>
                  {appsVisiveis.length}
                </span>
              </span>
              <ul className="menu-apps-gaveta" aria-label="Apps do ecossistema">
                {appsVisiveis.map((app) => (
                  <AppMenuGroup key={app.id} app={app} recolhido={menuRecolhido} />
                ))}
              </ul>
            </div>
          ) : null}
        </nav>

        <div className="menu-rodape">
          <NovidadesBotao compacto={menuRecolhido} className="menu-rodape-novidades" />
          <TemaToggle compacto={menuRecolhido} className="menu-rodape-tema" />
          <button
            type="button"
            className="btn btn-secundario menu-perfil-sair"
            onClick={() => void sair()}
            aria-label={menuRecolhido ? 'Sair' : undefined}
            title={menuRecolhido ? 'Sair' : undefined}
          >
            {menuRecolhido ? <span aria-hidden>↪</span> : 'Sair'}
          </button>
        </div>
      </aside>

      <main className="conteudo-principal">
        <Outlet />
      </main>

      <ChatLauncher usuario={usuario} />
    </div>
  );
}
