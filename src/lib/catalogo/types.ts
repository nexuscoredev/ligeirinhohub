/** Formato de https://ligeirinhobebidas.vercel.app/data/catalogo.json */
export interface ProdutoCatalogoLegado {
  id: string;
  name: string;
  price: number;
  priceLabel?: string;
  description: string | null;
  adultOnly?: boolean;
  image: string | null;
}

export interface CategoriaCatalogoLegado {
  id: string;
  name: string;
  products: ProdutoCatalogoLegado[];
}

export interface CatalogoLegado {
  source?: string;
  exportedAt?: string;
  storeName?: string;
  totalProducts: number;
  categories: CategoriaCatalogoLegado[];
}

export interface ProdutoCatalogoView {
  sku: string;
  nome: string;
  preco_base: number;
  imagem_url: string | null;
  categoria_slug: string;
  categoria_nome: string;
  categoria_ordem: number;
}

/** Produto unificado: catálogo da loja + metadados operacionais do Supabase. */
export interface ProdutoSistema extends ProdutoCatalogoView {
  /** UUID em `produtos` — null se ainda não sincronizado no banco. */
  produto_id: string | null;
  codigo_barras: string | null;
  unidade: string;
  preco_atacado: number | null;
}
