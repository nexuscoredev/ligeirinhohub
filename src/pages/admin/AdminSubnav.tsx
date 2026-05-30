import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { usePerfil } from '@/contexts/PerfilContext';
import { itemHubPermitido } from '@/lib/apps';
import { HUB_ADMIN_MODULOS } from '@/lib/admin/modulos';
import './admin.css';

export function AdminSubnav() {
  const { usuario } = usePerfil();
  const { pathname } = useLocation();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const ativo = nav.querySelector<HTMLElement>('.admin-subnav-link.ativo');
    ativo?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [pathname]);

  if (!usuario) return null;

  const links = HUB_ADMIN_MODULOS.filter((m) =>
    itemHubPermitido(m, usuario.cargo, usuario.paginas_permitidas, usuario.email),
  );

  if (links.length < 2) return null;

  return (
    <div className="admin-subnav-wrap">
      <nav ref={navRef} className="admin-subnav" aria-label="Módulos administrativos">
        {links.map((m) => (
          <NavLink
            key={m.rota}
            to={m.rota}
            end={m.rota === '/admin'}
            className={({ isActive }) =>
              isActive ? 'admin-subnav-link ativo' : 'admin-subnav-link'
            }
          >
            <span aria-hidden>{m.icone}</span>
            {m.titulo}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
