import { Link } from 'react-router-dom';
import type { AppSistema, ItemApp } from '@/lib/apps';
import { NOME_PLATAFORMA } from '@/lib/apps';

interface AppBreadcrumbProps {
  app: AppSistema;
  item: ItemApp;
}

export function AppBreadcrumb({ app, item }: AppBreadcrumbProps) {
  return (
    <nav className="app-breadcrumb" aria-label="Localização no sistema">
      <Link to="/bem-vindo">{NOME_PLATAFORMA}</Link>
      <span aria-hidden>›</span>
      <Link to={app.rotaEntrada}>{app.nome}</Link>
      {item.rota !== app.rotaEntrada ? (
        <>
          <span aria-hidden>›</span>
          <span>{item.titulo}</span>
        </>
      ) : null}
    </nav>
  );
}
