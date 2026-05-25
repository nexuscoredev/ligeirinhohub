import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { temaApp, type AppSistema } from '@/lib/apps';
import './AppLauncherCard.css';

interface AppLauncherCardProps {
  app: AppSistema;
  /** Layout mais compacto (ex.: dashboard) */
  compact?: boolean;
  /** Índice para animação escalonada */
  staggerIndex?: number;
}

/** Nome curto abaixo do ícone (ex.: PDV em vez de Ligeirinho PDV) */
function nomeCurtoApp(nome: string): string {
  return nome.replace(/^Ligeirinho\s+/i, '');
}

export function AppLauncherCard({
  app,
  compact = false,
  staggerIndex = 0,
}: AppLauncherCardProps) {
  return (
    <Link
      to={app.rotaEntrada}
      className={`app-launcher-tile${compact ? ' app-launcher-tile--compact' : ''}`}
      data-app-id={app.id}
      aria-label={`Abrir ${app.nome}`}
      style={
        {
          ...temaApp(app),
          '--app-stagger': `${staggerIndex * 45}ms`,
        } as CSSProperties
      }
    >
      <span className="app-launcher-tile__mesh" aria-hidden />
      <span className="app-launcher-tile__glow" aria-hidden />
      <span className="app-launcher-tile__icon-wrap">
        <span className="app-launcher-tile__icon" aria-hidden>
          {app.icone}
        </span>
        {app.iconeLabel ? (
          <span className="app-launcher-tile__badge">{app.iconeLabel}</span>
        ) : null}
      </span>
      <span className="app-launcher-tile__nome">{nomeCurtoApp(app.nome)}</span>
    </Link>
  );
}
