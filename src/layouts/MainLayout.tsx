import { NavLink, Outlet } from 'react-router-dom';
import { usePerfil } from '@/contexts/PerfilContext';
import {
  GRUPOS_MENU,
  PAGINAS_SISTEMA,
  paginaPermitida,
  type GrupoMenu,
} from '@/lib/paginasSistema';
import { appDisplayVersion } from '@/lib/appDisplayVersion';
import type { PaginaSistema } from '@/lib/paginasSistema';

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
          <span className="menu-marca-titulo">Ligeirinho Hub</span>
          <span className="menu-marca-versao">{appDisplayVersion()}</span>
        </div>
        <nav className="menu-nav">
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
          <p className="menu-usuario">{usuario.nome}</p>
          <p className="menu-cargo">{usuario.cargo}</p>
          <button type="button" className="btn btn-secundario" onClick={() => void sair()}>
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
