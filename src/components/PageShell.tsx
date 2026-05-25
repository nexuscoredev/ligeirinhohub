import type { ReactNode } from 'react';
import { HubLogo } from '@/components/HubLogo';

interface PageShellProps {
  tag?: string;
  titulo: ReactNode;
  subtitulo?: string;
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Exibe logo oficial compacto ao lado do título */
  comLogo?: boolean;
}

export function PageShell({
  tag,
  titulo,
  subtitulo,
  acoes,
  children,
  className = '',
  comLogo = false,
}: PageShellProps) {
  return (
    <div className={`hub-page ${className}`.trim()}>
      {tag ? <span className="hub-tag">{tag}</span> : null}
      <header className="hub-page-header">
        <div className="hub-page-header-texto">
          {comLogo ? (
            <HubLogo size="sm" badgeHub className="hub-page-header-logo" />
          ) : null}
          <div>
            <h1 className="hub-page-title">{titulo}</h1>
            {subtitulo ? (
              <p className="hub-page-subtitle">{subtitulo}</p>
            ) : null}
          </div>
        </div>
        {acoes}
      </header>
      {children}
    </div>
  );
}
