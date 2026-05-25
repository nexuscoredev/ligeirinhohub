import { NavLink, Outlet } from 'react-router-dom';
import { usePerfil } from '@/contexts/PerfilContext';
import {
  GRUPOS_MENU,
  PAGINAS_SISTEMA,
  paginaPermitida,
  type GrupoMenu,
  type PaginaSistema,
} from '@/lib/paginasSistema';
import { appDisplayVersion } from '@/lib/appDisplayVersion';

const ICONES_MENU: Record<string, string> = {
  '/bem-vindo': '👋',
  '/dashboard': '📊',
  '/produtos': '🍺',
  '/clientes': '👥',
  '/pedidos': '📦',
  '/pdv': '🛒',
  '/totem': '📱',
  '/operacional': '⚡',
  '/motorista': '🚚',
  '/usuarios': '🔐',
};

function iconeMenu(rota: string) {
  return ICONES_MENU[rota] ?? '•';
}

export function MainLayout() {
  const { usuario, sair } = usePerfil();

  if (!usuario) return null;

  const menuVisivel = PAGINAS_SISTEMA.filter((p) =>
    paginaPermitida(
      p.rota,
      usuario.cargo,
      usuario.paginas_permitidas,
      usuario.email,
    ),
  );

  const porGrupo = menuVisivel.reduce<Record<GrupoMenu, PaginaSistema[]>>(
    (acc, pagina) => {
      acc[pagina.grupo] = acc[pagina.grupo] ?? [];
      acc[pagina.grupo].push(pagina);
      return acc;
    },
    {} as Record<GrupoMenu, PaginaSistema[]>,
  );

  return (
    <div className="layout-hub">
      <aside className="menu-lateral">
        <div className="menu-marca">
          <span className="menu-marca-icone" aria-hidden>
            🍷
          </span>
          <div className="menu-marca-texto">
            <span className="menu-marca-titulo">
              Ligeirinho <span>Hub</span>
            </span>
            <span className="menu-marca-versao">{appDisplayVersion()}</span>
          </div>
        </div>
        <nav className="menu-nav" aria-label="Menu principal">
          {(Object.keys(GRUPOS_MENU) as GrupoMenu[]).map((grupo) => {
            const itens = porGrupo[grupo];
            if (!itens?.length) return null;
            return (
              <div key={grupo} className="menu-grupo">
                <span className="menu-grupo-titulo">{GRUPOS_MENU[grupo]}</span>
                <ul>
                  {itens.map((pagina) => (
                    <li key={pagina.rota}>
                      <NavLink
                        to={pagina.rota}
                        className={({ isActive }) =>
                          isActive ? 'menu-link ativo' : 'menu-link'
                        }
                      >
                        <span className="menu-link-icone" aria-hidden>
                          {iconeMenu(pagina.rota)}
                        </span>
                        {pagina.titulo}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
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
