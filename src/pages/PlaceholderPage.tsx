import { PageShell } from '@/components/PageShell';

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
  const palavras = titulo.split(' ');
  const destaque = palavras.length > 1 ? palavras.pop() : titulo;
  const base =
    palavras.length > 0 ? `${palavras.join(' ')} ` : '';

  return (
    <PageShell
      comLogo
      tag="Em desenvolvimento"
      titulo={
        palavras.length > 0 ? (
          <>
            {base}
            <span>{destaque}</span>
          </>
        ) : (
          <>
            <span>{destaque}</span>
          </>
        )
      }
      subtitulo={descricao}
    >
      <div className="card" style={{ maxWidth: 520 }}>
        <p style={{ margin: '0 0 1rem', fontSize: '2rem' }} aria-hidden>
          {icone}
        </p>
        <p style={{ margin: 0, color: 'var(--hub-muted)' }}>
          Módulo previsto para a próxima etapa do roadmap (Fase 1). A estrutura de
          navegação e permissões já está pronta.
        </p>
      </div>
    </PageShell>
  );
}
