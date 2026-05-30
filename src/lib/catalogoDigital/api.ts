import { listarTabelasPreco } from '@/lib/negociacao/api';
import { criarPedido } from '@/lib/pedidos/api';
import { supabase } from '@/lib/supabase';
import type {
  CarrinhoCatalogoItem,
  ProdutoCatalogoAdmin,
  ProdutoCatalogoDigital,
} from '@/types/catalogoDigital';

export async function listarCatalogoDigital(tabelaCodigo = 'PADRAO'): Promise<{
  produtos: ProdutoCatalogoDigital[];
  error: Error | null;
}> {
  const { data, error } = await supabase.rpc('gf_catalogo_produtos', {
    p_tabela_codigo: tabelaCodigo,
  } as never);

  if (error) return { produtos: [], error };

  const produtos = ((data ?? []) as ProdutoCatalogoDigital[]).map((p) => ({
    ...p,
    preco: Number(p.preco),
    categoria_ordem: Number(p.categoria_ordem),
    ordem_catalogo: Number(p.ordem_catalogo),
  }));

  return { produtos, error: null };
}

export async function resolverCodigoTabelaCliente(tabelaPrecoCliente: string | null): Promise<string> {
  const codigo = tabelaPrecoCliente?.trim() || 'padrao';
  const { tabelas } = await listarTabelasPreco();
  const match = tabelas.find((t) => t.codigo.toLowerCase() === codigo.toLowerCase());
  if (match) return match.codigo;
  const padrao = tabelas.find((t) => t.padrao);
  return padrao?.codigo ?? 'PADRAO';
}

export async function listarProdutosConfigCatalogo(tabelaPrecoId: string): Promise<{
  produtos: ProdutoCatalogoAdmin[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from('produtos')
    .select(
      'id, sku, nome, visivel_catalogo, ordem_catalogo, preco_base, categorias_produto ( nome ), tabelas_preco_itens!left ( preco, tabela_preco_id )',
    )
    .eq('ativo', true)
    .order('ordem_catalogo')
    .order('nome')
    .limit(400);

  if (error) return { produtos: [], error };

  const produtos = ((data ?? []) as Array<{
    id: string;
    sku: string | null;
    nome: string;
    visivel_catalogo: boolean;
    ordem_catalogo: number;
    preco_base: number;
    categorias_produto: { nome: string } | null;
    tabelas_preco_itens: { preco: number; tabela_preco_id: string }[] | null;
  }>).map((p) => {
    const itemTabela = (p.tabelas_preco_itens ?? []).find(
      (i) => i.tabela_preco_id === tabelaPrecoId,
    );
    return {
      id: p.id,
      sku: p.sku,
      nome: p.nome,
      visivel_catalogo: p.visivel_catalogo,
      ordem_catalogo: p.ordem_catalogo,
      preco_base: Number(p.preco_base),
      preco_tabela: itemTabela ? Number(itemTabela.preco) : null,
      categoria_nome: p.categorias_produto?.nome ?? '—',
    };
  });

  return { produtos, error: null };
}

export async function atualizarProdutoCatalogo(
  produtoId: string,
  patch: { visivel_catalogo?: boolean; ordem_catalogo?: number },
) {
  const row: Record<string, unknown> = {};
  if (patch.visivel_catalogo != null) row.visivel_catalogo = patch.visivel_catalogo;
  if (patch.ordem_catalogo != null) row.ordem_catalogo = patch.ordem_catalogo;

  const { error } = await supabase.from('produtos').update(row as never).eq('id', produtoId);
  return { error };
}

export async function salvarPrecoCatalogoTabela(
  tabelaPrecoId: string,
  produtoId: string,
  preco: number,
) {
  const valor = Math.round(preco * 100) / 100;
  if (valor < 0) return { error: new Error('Preço inválido.') };

  const { error } = await supabase.from('tabelas_preco_itens').upsert(
    {
      tabela_preco_id: tabelaPrecoId,
      produto_id: produtoId,
      preco: valor,
    } as never,
    { onConflict: 'tabela_preco_id,produto_id' },
  );

  return { error };
}

export async function criarPedidoCatalogoDigital(input: {
  clienteId: string;
  itens: CarrinhoCatalogoItem[];
  usuarioId: string;
  observacoes?: string;
  comoOrcamento?: boolean;
}) {
  const linhas = input.itens.map((i) => ({
    sku: i.sku,
    nome: i.nome,
    qty: i.qty,
    preco_unitario: i.preco,
    categoria_ordem: i.categoria_ordem,
  }));

  return criarPedido({
    clienteId: input.clienteId,
    origem: 'catalogo',
    modalidade: 'entrega',
    itens: linhas,
    usuarioId: input.usuarioId,
    observacoes: input.observacoes,
    comoOrcamento: input.comoOrcamento,
  });
}

export function agruparCatalogoPorCategoria(produtos: ProdutoCatalogoDigital[]) {
  const mapa = new Map<
    string,
    { slug: string; nome: string; ordem: number; produtos: ProdutoCatalogoDigital[] }
  >();

  for (const p of produtos) {
    const atual = mapa.get(p.categoria_slug);
    if (atual) {
      atual.produtos.push(p);
    } else {
      mapa.set(p.categoria_slug, {
        slug: p.categoria_slug,
        nome: p.categoria_nome,
        ordem: p.categoria_ordem,
        produtos: [p],
      });
    }
  }

  return [...mapa.values()].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome));
}
