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
