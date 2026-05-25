interface PlaceholderPageProps {
  titulo: string;
  descricao: string;
}

export function PlaceholderPage({ titulo, descricao }: PlaceholderPageProps) {
  return (
    <div>
      <h1 className="pagina-titulo">{titulo}</h1>
      <p className="pagina-subtitulo">{descricao}</p>
      <div className="card">
        <p>Módulo previsto para a próxima etapa de desenvolvimento.</p>
      </div>
    </div>
  );
}
