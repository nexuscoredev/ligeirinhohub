import { agruparPorCategoria } from '@/lib/catalogo/fetchCatalogo';
import type { CatalogoLegado, ProdutoCatalogoLegado } from '@/lib/catalogo/types';

/** Padrões que indicam venda em caixa/fardo/pack — excluídos do totem (somente unidade). */
const PADROES_EXCLUSAO: RegExp[] = [
  /\bc\/\d+\b/i,
  /(?:^|[\s-])c-\d+(?:[\s-]|$)/i,
  /\bcx\b/i,
  /\bfardo\b/i,
  /\bpack\b/i,
  /\bcaixa\b/i,
];

export function produtoVendaUnidade(nome: string, sku?: string): boolean {
  const texto = `${nome} ${sku ?? ''}`;
  return !PADROES_EXCLUSAO.some((re) => re.test(texto));
}

export function filtrarProdutosUnidade(produtos: ProdutoCatalogoLegado[]): ProdutoCatalogoLegado[] {
  return produtos.filter((p) => produtoVendaUnidade(p.name, p.id));
}

export function filtrarCatalogoUnidade(catalogo: CatalogoLegado): CatalogoLegado {
  const categories = catalogo.categories
    .map((cat) => ({
      ...cat,
      products: filtrarProdutosUnidade(cat.products),
    }))
    .filter((cat) => cat.products.length > 0);

  return {
    ...catalogo,
    categories,
    totalProducts: categories.reduce((acc, cat) => acc + cat.products.length, 0),
  };
}

export function categoriasTotem(catalogo: CatalogoLegado) {
  return agruparPorCategoria(filtrarCatalogoUnidade(catalogo)).filter(
    (cat) => cat.produtos.length > 0,
  );
}
