import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  appTemSubmenu,
  temaApp,
  type AppSistema,
  type ItemApp,
} from '@/lib/apps';
import './AppMenuGroup.css';

function MenuItemFilho({ item }: { item: ItemApp }) {
  return (
    <li className="app-menu-tela">
      <NavLink
        to={item.rota}
        className={({ isActive }) =>
          isActive ? 'app-menu-filho ativo' : 'app-menu-filho'
        }
        end
      >
        <span className="app-menu-filho-icone" aria-hidden>
          {item.icone}
        </span>
        <span className="app-menu-filho-titulo">{item.titulo}</span>
      </NavLink>
    </li>
  );
}

interface AppMenuGroupProps {
  app: AppSistema;
  recolhido?: boolean;
}

export function AppMenuGroup({ app, recolhido = false }: AppMenuGroupProps) {
  const submenu = appTemSubmenu(app);
  const { pathname } = useLocation();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const rotaAtivaNoApp = app.itens.some(
    (i) => pathname === i.rota || pathname.startsWith(`${i.prefixo}/`),
  );

  useEffect(() => {
    if (submenu && detailsRef.current && rotaAtivaNoApp) {
      detailsRef.current.open = true;
    }
  }, [submenu, rotaAtivaNoApp, pathname]);

  if (!submenu) {
    const item = app.itens[0];
    return (
      <li className="app-menu-grupo" data-app-id={app.id} style={temaApp(app)}>
        <NavLink
          to={item.rota}
          className={({ isActive }) =>
            [
              isActive ? 'app-menu-pill ativo' : 'app-menu-pill',
              recolhido ? 'app-menu-pill--recolhido' : '',
            ]
              .filter(Boolean)
              .join(' ')
          }
          end
          title={recolhido ? app.nome : undefined}
        >
          <span className="app-menu-pill-icone-wrap">
            <span className="app-menu-pill-icone" aria-hidden>
              {app.icone}
            </span>
            {app.iconeLabel ? (
              <span className="app-menu-pill-badge">{app.iconeLabel}</span>
            ) : null}
          </span>
          <span className="app-menu-pill-texto">
            <span className="app-menu-pill-nome">{app.nome}</span>
          </span>
        </NavLink>
      </li>
    );
  }

  if (recolhido) {
    return (
      <li
        className="app-menu-grupo app-menu-grupo--recolhido"
        data-app-id={app.id}
        style={temaApp(app)}
      >
        <div className="app-menu-flyout-wrap">
          <NavLink
            to={app.rotaEntrada}
            className={({ isActive }) =>
              isActive
                ? 'app-menu-pill ativo app-menu-pill--recolhido'
                : 'app-menu-pill app-menu-pill--recolhido'
            }
            title={app.nome}
          >
            <span className="app-menu-pill-icone-wrap">
              <span className="app-menu-pill-icone" aria-hidden>
                {app.icone}
              </span>
              {app.iconeLabel ? (
                <span className="app-menu-pill-badge">{app.iconeLabel}</span>
              ) : null}
            </span>
          </NavLink>
          <div className="app-menu-flyout" role="menu" aria-label={app.nome}>
            <p className="app-menu-flyout-titulo">{app.nome}</p>
            <ul className="app-menu-filhos" aria-label={`Telas de ${app.nome}`}>
              {app.itens.map((item) => (
                <MenuItemFilho key={item.rota} item={item} />
              ))}
            </ul>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li
      className="app-menu-grupo app-menu-grupo--sub"
      data-app-id={app.id}
      style={temaApp(app)}
    >
      <details ref={detailsRef} className="app-menu-details">
        <summary className="app-menu-summary">
          <NavLink
            to={app.rotaEntrada}
            className={({ isActive }) =>
              isActive ? 'app-menu-pill ativo' : 'app-menu-pill'
            }
            onClick={(e) => e.stopPropagation()}
          >
            <span className="app-menu-pill-icone-wrap">
              <span className="app-menu-pill-icone" aria-hidden>
                {app.icone}
              </span>
              {app.iconeLabel ? (
                <span className="app-menu-pill-badge">{app.iconeLabel}</span>
              ) : null}
            </span>
            <span className="app-menu-pill-texto">
              <span className="app-menu-pill-nome">{app.nome}</span>
            </span>
          </NavLink>
          <span className="app-menu-chevron" aria-hidden />
        </summary>
        <ul className="app-menu-filhos" aria-label={`Telas de ${app.nome}`}>
          {app.itens.map((item) => (
            <MenuItemFilho key={item.rota} item={item} />
          ))}
        </ul>
      </details>
    </li>
  );
}
