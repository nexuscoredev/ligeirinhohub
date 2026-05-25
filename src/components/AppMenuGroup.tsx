import { NavLink } from 'react-router-dom';
import {
  appTemSubmenu,
  temaApp,
  type AppSistema,
  type ItemApp,
} from '@/lib/apps';
import './AppMenuGroup.css';

function MenuItemFilho({ item }: { item: ItemApp }) {
  return (
    <li>
      <NavLink
        to={item.rota}
        className={({ isActive }) =>
          isActive
            ? 'app-menu-filho ativo'
            : 'app-menu-filho'
        }
        end
      >
        <span className="app-menu-filho-icone" aria-hidden>
          {item.icone}
        </span>
        {item.titulo}
      </NavLink>
    </li>
  );
}

interface AppMenuGroupProps {
  app: AppSistema;
}

export function AppMenuGroup({ app }: AppMenuGroupProps) {
  const submenu = appTemSubmenu(app);

  if (!submenu) {
    const item = app.itens[0];
    return (
      <li className="app-menu-grupo" data-app-id={app.id} style={temaApp(app)}>
        <NavLink
          to={item.rota}
          className={({ isActive }) =>
            isActive ? 'app-menu-pill ativo' : 'app-menu-pill'
          }
          end
        >
          <span className="app-menu-pill-icone" aria-hidden>
            {app.icone}
          </span>
          <span className="app-menu-pill-texto">
            <span className="app-menu-pill-nome">{app.nome}</span>
            {app.descricao ? (
              <span className="app-menu-pill-desc">{app.descricao}</span>
            ) : null}
          </span>
        </NavLink>
      </li>
    );
  }

  return (
    <li className="app-menu-grupo app-menu-grupo--sub" data-app-id={app.id} style={temaApp(app)}>
      <NavLink
        to={app.rotaEntrada}
        className={({ isActive }) =>
          isActive ? 'app-menu-pill ativo' : 'app-menu-pill'
        }
      >
        <span className="app-menu-pill-icone" aria-hidden>
          {app.icone}
        </span>
        <span className="app-menu-pill-texto">
          <span className="app-menu-pill-nome">{app.nome}</span>
          {app.descricao ? (
            <span className="app-menu-pill-desc">{app.descricao}</span>
          ) : null}
        </span>
      </NavLink>
      <ul className="app-menu-filhos">
        {app.itens.map((item) => (
          <MenuItemFilho key={item.rota} item={item} />
        ))}
      </ul>
    </li>
  );
}
