import { useLocation } from 'react-router-dom';
import { AppPageHeader } from '@/components/AppPageHeader';
import { PageShell } from '@/components/PageShell';
import { appPorRota } from '@/lib/apps';

interface PlaceholderPageProps {
  titulo: string;
  descricao: string;
  icone?: string;
}

export function PlaceholderPage({
  titulo,
  descricao,
  icone = '🚧',
}: PlaceholderPageProps) {
  const { pathname } = useLocation();
  const contexto = appPorRota(pathname);

  if (contexto) {
    return (
      <AppPageHeader
        app={contexto.app}
        item={contexto.item}
        titulo={titulo}
        subtitulo={descricao}
      >
        <div className="card placeholder-card app-placeholder-card">
          <p className="placeholder-icone" aria-hidden>
            {icone}
          </p>
          <p className="placeholder-texto">
            Tela em construção dentro de{' '}
            <strong>{contexto.app.nome}</strong> — próxima etapa do roadmap
            (Fase 1).
          </p>
        </div>
      </AppPageHeader>
    );
  }

  return (
    <PageShell
      comLogo
      tag="Hub administrativo"
      titulo={titulo}
      subtitulo={descricao}
    >
      <div className="card placeholder-card">
        <p className="placeholder-icone" aria-hidden>
          {icone}
        </p>
        <p className="placeholder-texto">
          Módulo do painel administrativo — previsto para a próxima etapa do
          roadmap (Fase 1).
        </p>
      </div>
    </PageShell>
  );
}
