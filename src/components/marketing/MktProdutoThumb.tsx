interface MktProdutoThumbProps {
  src: string | null;
  nome: string;
  size?: 'sm' | 'md' | 'lg' | 'tv';
}

export function MktProdutoThumb({ src, nome, size = 'md' }: MktProdutoThumbProps) {
  return (
    <div className={`mkt-thumb mkt-thumb--${size}`}>
      {src ? (
        <img src={src} alt="" loading="lazy" decoding="async" />
      ) : (
        <span className="mkt-thumb__placeholder" title={nome} aria-hidden>
          🍺
        </span>
      )}
    </div>
  );
}
