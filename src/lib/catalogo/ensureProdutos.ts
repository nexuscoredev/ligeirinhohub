import { fetchCatalogoLegado, flattenCatalogo } from '@/lib/catalogo/fetchCatalogo';
import { supabase } from '@/lib/supabase';

/**
 * Garante que SKUs do catálogo da loja existem em `produtos` antes de criar pedido.
 * Evita exigir sync manual em Admin para cada item novo.
 */
export async function ensureProdutosPorSkus(
  skus: string[],
): Promise<{ error: Error | null }> {
  const unique = [...new Set(skus.filter(Boolean))];
  if (!unique.length) return { error: null };

  const { data: existentes, error: eExist } = await supabase
    .from('produtos')
    .select('sku')
    .in('sku', unique);

  if (eExist) return { error: eExist };

  const jaTem = new Set(
    ((existentes ?? []) as { sku: string }[]).map((r) => r.sku),
  );
  const faltando = unique.filter((s) => !jaTem.has(s));
  if (!faltando.length) return { error: null };

  const catalogo = await fetchCatalogoLegado();
  const flat = flattenCatalogo(catalogo);
  const porSku = new Map(flat.map((p) => [p.sku, p]));

  for (const sku of faltando) {
    if (!porSku.has(sku)) {
      return {
        error: new Error(`SKU "${sku}" não está no catálogo da loja.`),
      };
    }
  }

  const slugs = [
    ...new Set(faltando.map((s) => porSku.get(s)!.categoria_slug)),
  ];

  const catRows = slugs.map((slug) => {
    const ref = flat.find((p) => p.categoria_slug === slug)!;
    return {
      nome: ref.categoria_nome,
      slug,
      ordem_separacao: ref.categoria_ordem,
    };
  });

  const { data: catsDb, error: catErr } = await supabase
    .from('categorias_produto')
    .upsert(catRows as never, { onConflict: 'slug' })
    .select('id, slug');

  if (catErr) return { error: catErr };

  const slugParaId = new Map(
    ((catsDb ?? []) as { id: string; slug: string }[]).map((c) => [c.slug, c.id]),
  );

  const rows = faltando
    .map((sku) => {
      const p = porSku.get(sku)!;
      const categoria_id = slugParaId.get(p.categoria_slug);
      if (!categoria_id) return null;
      return {
        categoria_id,
        nome: p.nome,
        sku: p.sku,
        preco_base: p.preco_base,
        imagem_url: p.imagem_url,
        ativo: true,
      };
    })
    .filter(Boolean);

  if (rows.length !== faltando.length) {
    return { error: new Error('Categoria do produto não encontrada no sistema.') };
  }

  const { error: prodErr } = await supabase
    .from('produtos')
    .upsert(rows as never, { onConflict: 'sku' });

  return { error: prodErr ?? null };
}
