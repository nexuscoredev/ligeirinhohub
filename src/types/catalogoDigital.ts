export interface ProdutoCatalogoDigital {
  produto_id: string;
  sku: string | null;
  nome: string;
  imagem_url: string | null;
  categoria_nome: string;
  categoria_slug: string;
  categoria_ordem: number;
  preco: number;
  ordem_catalogo: number;
}

export interface ProdutoCatalogoAdmin {
  id: string;
  sku: string | null;
  nome: string;
  visivel_catalogo: boolean;
  ordem_catalogo: number;
  preco_base: number;
  preco_tabela: number | null;
  categoria_nome: string;
}

export interface CarrinhoCatalogoItem {
  produto_id: string;
  sku: string;
  nome: string;
  preco: number;
  qty: number;
  categoria_ordem: number;
  imagem_url: string | null;
}
