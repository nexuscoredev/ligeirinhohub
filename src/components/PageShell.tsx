import type { ReactNode } from 'react';

interface PageShellProps {
  tag?: string;
  titulo: ReactNode;
  subtitulo?: string;
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageShell({
  tag,
  titulo,
  subtitulo,
  acoes,
  children,
  className = '',
}: PageShellProps) {
  return (
    <div className={`hub-page ${className}`.trim()}>
      {tag ? <span className="hub-tag">{tag}</span> : null}
      <header className="hub-page-header">
        <div>
          <h1 className="hub-page-title">{titulo}</h1>
          {subtitulo ? (
            <p className="hub-page-subtitle">{subtitulo}</p>
          ) : null}
        </div>
        {acoes}
      </header>
      {children}
    </div>
  );
}
