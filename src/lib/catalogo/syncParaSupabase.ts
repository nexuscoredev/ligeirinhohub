import { fetchCatalogoLegado } from '@/lib/catalogo/fetchCatalogo';
import { nomeCategoriaExibicao, ordemSeparacaoCategoria } from '@/lib/catalogo/categoriaOrdem';
import { supabase } from '@/lib/supabase';

const LOTE_PRODUTOS = 25;

export interface ResultadoSyncCatalogo {
  categorias: number;
  produtosInseridos: number;
  produtosAtualizados: number;
  erros: string[];
}

/**
 * Sincroniza catálogo legado → Supabase em poucas requisições (não dispara centenas de inserts).
 * Só deve ser chamado por ação explícita do admin.
 */
export async function syncCatalogoParaSupabase(
  onProgress?: (msg: string) => void,
): Promise<ResultadoSyncCatalogo> {
  const resultado: ResultadoSyncCatalogo = {
    categorias: 0,
    produtosInseridos: 0,
    produtosAtualizados: 0,
    erros: [],
  };

  onProgress?.('Lendo catálogo…');
  const catalogo = await fetchCatalogoLegado(true);

  const catRows = catalogo.categories.map((cat, idx) => ({
    nome: nomeCategoriaExibicao(cat.name),
    slug: cat.id,
    ordem_separacao: ordemSeparacaoCategoria(cat.id, idx),
  }));

  onProgress?.(`Gravando ${catRows.length} categorias…`);
  const { data: catsDb, error: catErr } = await supabase
    .from('categorias_produto')
    .upsert(catRows as never, { onConflict: 'slug' })
    .select('id, slug');

  if (catErr) {
    resultado.erros.push(catErr.message);
    return resultado;
  }

  const slugParaId = new Map(
    (catsDb as { id: string; slug: string }[]).map((c) => [c.slug, c.id]),
  );
  resultado.categorias = slugParaId.size;

  const todosProdutos = catalogo.categories.flatMap((cat) =>
    cat.products.map((p) => ({
      categoria_id: slugParaId.get(cat.id),
      nome: p.name.trim(),
      sku: p.id,
      preco_base: p.price,
      imagem_url: p.image,
      ativo: true,
    })),
  ).filter((r) => r.categoria_id);

  const skus = todosProdutos.map((p) => p.sku);
  const existentes = new Set<string>();

  for (let i = 0; i < skus.length; i += 100) {
    const lote = skus.slice(i, i + 100);
    const { data } = await supabase.from('produtos').select('sku').in('sku', lote);
    (data as { sku: string }[] | null)?.forEach((r) => existentes.add(r.sku));
  }

  for (let i = 0; i < todosProdutos.length; i += LOTE_PRODUTOS) {
    const lote = todosProdutos.slice(i, i + LOTE_PRODUTOS);
    onProgress?.(
      `Produtos ${Math.min(i + LOTE_PRODUTOS, todosProdutos.length)} / ${todosProdutos.length}…`,
    );

    for (const p of lote) {
      if (existentes.has(p.sku)) resultado.produtosAtualizados += 1;
      else {
        resultado.produtosInseridos += 1;
        existentes.add(p.sku);
      }
    }

    const { error } = await supabase
      .from('produtos')
      .upsert(lote as never, { onConflict: 'sku' });

    if (error) {
      resultado.erros.push(error.message);
      break;
    }
  }

  onProgress?.('Concluído.');
  return resultado;
}
