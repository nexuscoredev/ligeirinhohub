import { imagemCatalogoUrl } from '@/lib/catalogo/imagemUrl';
import type { ProdutoCatalogoView } from '@/lib/catalogo/types';

export function mapaImagensCatalogo(
  catalogo: ProdutoCatalogoView[],
): Map<string, string | null> {
  const map = new Map<string, string | null>();
  for (const p of catalogo) {
    map.set(p.sku, imagemCatalogoUrl(p.imagem_url));
  }
  return map;
}

export function imagemPromocaoSku(
  sku: string,
  mapa: Map<string, string | null>,
): string | null {
  return mapa.get(sku) ?? null;
}
