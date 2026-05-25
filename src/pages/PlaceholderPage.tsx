import { useLocation } from 'react-router-dom';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
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

  const tituloPagina = contexto ? (
    <>
      {titulo} <span>· {contexto.app.nome}</span>
    </>
  ) : (
    titulo
  );

  return (
    <PageShell
      comLogo
      tag={contexto ? contexto.app.nome : 'Em desenvolvimento'}
      titulo={tituloPagina}
      subtitulo={descricao}
    >
      {contexto ? (
        <AppBreadcrumb app={contexto.app} item={contexto.item} />
      ) : null}
      <div className="card placeholder-card">
        <p className="placeholder-icone" aria-hidden>
          {icone}
        </p>
        <p className="placeholder-texto">
          Módulo dentro de <strong>{contexto?.app.nome ?? 'app'}</strong> — previsto
          para a próxima etapa do roadmap (Fase 1).
        </p>
      </div>
    </PageShell>
  );
}
