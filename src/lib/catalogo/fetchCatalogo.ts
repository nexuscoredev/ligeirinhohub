import { nomeCategoriaExibicao, ordemSeparacaoCategoria } from '@/lib/catalogo/categoriaOrdem';
import type {
  CatalogoLegado,
  CategoriaCatalogoLegado,
  ProdutoCatalogoView,
} from '@/lib/catalogo/types';

const CATALOGO_URL =
  import.meta.env.VITE_CATALOGO_LEGADO_URL ??
  '/data/catalogo.json';

let cache: CatalogoLegado | null = null;
let cacheEm: number | null = null;
const CACHE_MS = 5 * 60 * 1000;

export async function fetchCatalogoLegado(force = false): Promise<CatalogoLegado> {
  const agora = Date.now();
  if (!force && cache && cacheEm && agora - cacheEm < CACHE_MS) {
    return cache;
  }

  const res = await fetch(CATALOGO_URL, { cache: 'default' });
  if (!res.ok) {
    throw new Error(`Catálogo indisponível (${res.status})`);
  }
  const data = (await res.json()) as CatalogoLegado;
  cache = data;
  cacheEm = agora;
  return data;
}

export function flattenCatalogo(catalogo: CatalogoLegado): ProdutoCatalogoView[] {
  const itens: ProdutoCatalogoView[] = [];
  catalogo.categories.forEach((cat: CategoriaCatalogoLegado, idx) => {
    const ordem = ordemSeparacaoCategoria(cat.id, idx);
    const catNome = nomeCategoriaExibicao(cat.name);
    cat.products.forEach((p) => {
      itens.push({
        sku: p.id,
        nome: p.name,
        preco_base: p.price,
        imagem_url: p.image,
        categoria_slug: cat.id,
        categoria_nome: catNome,
        categoria_ordem: ordem,
      });
    });
  });
  return itens.sort((a, b) =>
    a.categoria_ordem !== b.categoria_ordem
      ? a.categoria_ordem - b.categoria_ordem
      : a.nome.localeCompare(b.nome, 'pt-BR'),
  );
}

export function agruparPorCategoria(catalogo: CatalogoLegado) {
  return catalogo.categories.map((cat, idx) => ({
    slug: cat.id,
    nome: nomeCategoriaExibicao(cat.name),
    ordem: ordemSeparacaoCategoria(cat.id, idx),
    produtos: cat.products,
    total: cat.products.length,
  }));
}
