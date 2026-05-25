import { Link } from 'react-router-dom';
import { appTemSubmenu, temaApp, type AppSistema } from '@/lib/apps';
import './AppLauncherCard.css';

interface AppLauncherCardProps {
  app: AppSistema;
  /** Exibe links dos módulos internos */
  showModulos?: boolean;
  /** Layout mais compacto (ex.: dashboard) */
  compact?: boolean;
}

export function AppLauncherCard({
  app,
  showModulos = true,
  compact = false,
}: AppLauncherCardProps) {
  const comSubmenu = appTemSubmenu(app);

  return (
    <article
      className={`app-launcher-card${compact ? ' app-launcher-card--compact' : ''}`}
      data-app-id={app.id}
      style={temaApp(app)}
    >
      <div className="app-launcher-card__glow" aria-hidden />
      <header className="app-launcher-card__header">
        <Link to={app.rotaEntrada} className="app-launcher-card__brand">
          <span className="app-launcher-card__icon" aria-hidden>
            {app.icone}
          </span>
          <span className="app-launcher-card__texto">
            <strong className="app-launcher-card__nome">{app.nome}</strong>
            {app.descricao ? (
              <span className="app-launcher-card__desc">{app.descricao}</span>
            ) : null}
          </span>
        </Link>
        <Link
          to={app.rotaEntrada}
          className="app-launcher-card__abrir"
          aria-label={`Abrir ${app.nome}`}
        >
          Abrir
        </Link>
      </header>

      {showModulos && comSubmenu ? (
        <ul className="app-launcher-card__modulos">
          {app.itens.map((item) => (
            <li key={item.rota}>
              <Link to={item.rota}>
                <span className="app-launcher-card__modulo-icone" aria-hidden>
                  {item.icone}
                </span>
                {item.titulo}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {showModulos && !comSubmenu && app.itens[0] ? (
        <p className="app-launcher-card__unico">
          <Link to={app.itens[0].rota}>{app.itens[0].titulo}</Link>
        </p>
      ) : null}
    </article>
  );
}
