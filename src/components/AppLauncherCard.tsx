import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { appTemSubmenu, temaApp, type AppSistema } from '@/lib/apps';
import './AppLauncherCard.css';

interface AppLauncherCardProps {
  app: AppSistema;
  /** Exibe links dos módulos internos */
  showModulos?: boolean;
  /** Layout mais compacto (ex.: dashboard) */
  compact?: boolean;
  /** Índice para animação escalonada */
  staggerIndex?: number;
}

export function AppLauncherCard({
  app,
  showModulos = true,
  compact = false,
  staggerIndex = 0,
}: AppLauncherCardProps) {
  const comSubmenu = appTemSubmenu(app);

  return (
    <article
      className={`app-launcher-card${compact ? ' app-launcher-card--compact' : ''}`}
      data-app-id={app.id}
      style={
        {
          ...temaApp(app),
          '--app-stagger': `${staggerIndex * 55}ms`,
        } as CSSProperties
      }
    >
      <div className="app-launcher-card__mesh" aria-hidden />
      <div className="app-launcher-card__glow" aria-hidden />
      <header className="app-launcher-card__header">
        <Link to={app.rotaEntrada} className="app-launcher-card__brand">
          <span className="app-launcher-card__icon-wrap">
            <span className="app-launcher-card__icon" aria-hidden>
              {app.icone}
            </span>
            {app.iconeLabel ? (
              <span className="app-launcher-card__icon-label">
                {app.iconeLabel}
              </span>
            ) : null}
          </span>
          <span className="app-launcher-card__texto">
            <strong className="app-launcher-card__nome">{app.nome}</strong>
            {app.tagline && !compact ? (
              <span className="app-launcher-card__tagline">{app.tagline}</span>
            ) : null}
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
          Abrir app
        </Link>
      </header>

      {showModulos && comSubmenu ? (
        <ul className="app-launcher-card__modulos">
          {app.itens.map((item, i) => (
            <li
              key={item.rota}
              style={
                { '--modulo-stagger': `${i * 40}ms` } as CSSProperties
              }
            >
              <Link to={item.rota}>
                <span className="app-launcher-card__modulo-icone" aria-hidden>
                  {item.icone}
                </span>
                <span className="app-launcher-card__modulo-texto">
                  {item.titulo}
                </span>
                <span className="app-launcher-card__modulo-seta" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {showModulos && !comSubmenu && app.itens[0] ? (
        <p className="app-launcher-card__unico">
          <Link to={app.itens[0].rota}>
            <span>{app.itens[0].titulo}</span>
            <span aria-hidden>→</span>
          </Link>
        </p>
      ) : null}
    </article>
  );
}
