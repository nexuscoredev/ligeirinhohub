import { imagemCatalogoUrl } from '@/lib/catalogo/imagemUrl';
import type { ProdutoCatalogoView } from '@/lib/catalogo/types';
import type { MarketingCreatorState, ProdutoArte, TipoProdutoArte } from '@/lib/marketing/creator/types';

export function tipoProdutoFromCategoria(
  categoriaSlug: string,
  categoriaNome: string,
  nomeProduto = '',
): TipoProdutoArte {
  const s = `${categoriaSlug} ${categoriaNome} ${nomeProduto}`.toLowerCase();
  if (/cerveja|chopp|beer|lager|pilsen/.test(s)) return 'cerveja';
  if (/whisk|wisk|bourbon|scotch/.test(s)) return 'whisky';
  if (/energ|monster|red bull|reign/.test(s)) return 'energetico';
  if (/refrig|cola|coca|pepsi|guar/.test(s)) return 'refrigerante';
  if (/agua|água|mineral|coco/.test(s)) return 'agua';
  if (/vinho|wine|espumante|champ/.test(s)) return 'vinho';
  if (/vodka|gin|rum|tequila|destil|cacha/.test(s)) return 'destilado';
  return 'outro';
}

export function produtoArteFromCatalogo(p: ProdutoCatalogoView): ProdutoArte {
  return {
    id: crypto.randomUUID(),
    sku: p.sku,
    nome: p.nome,
    descricao: p.categoria_nome,
    tipo: tipoProdutoFromCategoria(p.categoria_slug, p.categoria_nome, p.nome),
    quantidade: 1,
    preco_base: p.preco_base,
    imagem_url: p.imagem_url,
    categoria_nome: p.categoria_nome,
    fromCatalogo: true,
  };
}

export function formatarPrecoArte(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Imagem do upload manual ou do primeiro produto do catálogo */
export function imagemProdutoArte(estado: MarketingCreatorState): string | null {
  if (estado.imagemProduto) return estado.imagemProduto;
  const url = estado.produtos.find((p) => p.imagem_url)?.imagem_url ?? null;
  return imagemCatalogoUrl(url);
}

export function skuJaNaArte(produtos: ProdutoArte[], sku: string): boolean {
  return produtos.some((p) => p.sku === sku);
}
