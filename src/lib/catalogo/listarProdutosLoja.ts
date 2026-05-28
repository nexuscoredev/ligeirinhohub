import { fetchCatalogoLegado, flattenCatalogo } from '@/lib/catalogo/fetchCatalogo';
import type { ProdutoCatalogoView } from '@/lib/catalogo/types';

/** Produtos do catálogo publicado da loja (mesma base do Totem e Admin → Produtos). */
export async function listarProdutosLoja(): Promise<{
  produtos: ProdutoCatalogoView[];
  error: Error | null;
}> {
  try {
    const catalogo = await fetchCatalogoLegado();
    return { produtos: flattenCatalogo(catalogo), error: null };
  } catch (e) {
    return {
      produtos: [],
      error: e instanceof Error ? e : new Error('Não foi possível carregar o catálogo da loja.'),
    };
  }
}
