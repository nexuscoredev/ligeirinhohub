import { registrarEvento } from '@/lib/pedidos/api';
import { supabase } from '@/lib/supabase';
import type { FormaPagamento, PagamentoSplitLinha } from '@/types/pedidos';

export type FormaPagamentoTotem = FormaPagamento;

export const FORMAS_PAGAMENTO_TOTEM: { id: FormaPagamentoTotem; label: string }[] = [
  { id: 'dinheiro', label: 'Dinheiro' },
  { id: 'pix', label: 'PIX' },
  { id: 'cartao_debito', label: 'Cartão débito' },
  { id: 'cartao_credito', label: 'Cartão crédito' },
];

export type PagamentoSplitItem = PagamentoSplitLinha;

export interface ItemPedidoTotem {
  sku: string;
  nome: string;
  preco_unitario: number;
  qty: number;
  categoria_ordem: number;
}

export interface CriarPedidoTotemInput {
  itens: ItemPedidoTotem[];
  pagamentoSplit: PagamentoSplitItem[];
  usuarioId: string;
}

const CLIENTE_TOTEM_NOME = 'Totem — Varejo Loja';

export async function criarPedidoTotem(input: CriarPedidoTotemInput) {
  const { itens, pagamentoSplit, usuarioId } = input;

  if (!itens.length) {
    return { pedido: null, error: new Error('Carrinho vazio.'), skusFaltando: [] as string[] };
  }

  const { data: cliente, error: eCliente } = await supabase
    .from('clientes')
    .select('id')
    .eq('nome', CLIENTE_TOTEM_NOME)
    .maybeSingle();

  if (eCliente || !cliente) {
    return {
      pedido: null,
      error: new Error(
        eCliente?.message ??
          `Cliente "${CLIENTE_TOTEM_NOME}" não encontrado. Aplique a migration do totem.`,
      ),
      skusFaltando: [] as string[],
    };
  }

  const skus = [...new Set(itens.map((i) => i.sku))];
  const { data: produtos, error: eProd } = await supabase
    .from('produtos')
    .select('id, sku, nome, ativo')
    .in('sku', skus);

  if (eProd) {
    return { pedido: null, error: eProd, skusFaltando: [] as string[] };
  }

  type ProdutoSkuRow = { id: string; sku: string; ativo: boolean };
  const listaProdutos = (produtos ?? []) as ProdutoSkuRow[];
  const porSku = new Map(listaProdutos.map((p) => [p.sku, p]));
  const skusFaltando = skus.filter((s) => !porSku.has(s));
  const skusInativos = skus.filter((s) => {
    const p = porSku.get(s);
    return p && !p.ativo;
  });

  if (skusFaltando.length) {
    return {
      pedido: null,
      error: new Error(
        `Produto(s) não cadastrado(s): ${skusFaltando.join(', ')}. Sincronize o catálogo em Admin → Produtos.`,
      ),
      skusFaltando,
    };
  }

  if (skusInativos.length) {
    return {
      pedido: null,
      error: new Error(`Produto(s) indisponível(is): ${skusInativos.join(', ')}.`),
      skusFaltando: skusInativos,
    };
  }

  const agora = new Date().toISOString();
  const clienteId = (cliente as { id: string }).id;

  const { data: pedido, error: ePedido } = await supabase
    .from('pedidos')
    .insert({
      cliente_id: clienteId,
      status: 'aguardando_separacao',
      origem: 'totem',
      modalidade: 'retirada',
      aceito_em: agora,
      pagamento_split: pagamentoSplit,
      observacoes: 'Pedido totem — pagamento definido pelo cliente no autoatendimento.',
    } as never)
    .select('id, numero')
    .single();

  if (ePedido || !pedido) {
    return {
      pedido: null,
      error: ePedido ?? new Error('Não foi possível criar o pedido.'),
      skusFaltando: [] as string[],
    };
  }

  const pedidoRow = pedido as { id: string; numero: number };
  const rows = itens.map((item) => ({
    pedido_id: pedidoRow.id,
    produto_id: porSku.get(item.sku)!.id,
    nome_snapshot: item.nome,
    categoria_ordem: item.categoria_ordem,
    qty_pedida: item.qty,
    preco_unitario: item.preco_unitario,
  }));

  const { error: eItens } = await supabase.from('pedido_itens').insert(rows as never);
  if (eItens) {
    return { pedido: null, error: eItens, skusFaltando: [] as string[] };
  }

  await supabase.rpc('recalcular_totais_pedido', { p_pedido_id: pedidoRow.id } as never);
  await registrarEvento(pedidoRow.id, 'criar_pedido_totem', usuarioId, {
    pagamento_split: pagamentoSplit,
  });

  return { pedido: pedidoRow, error: null, skusFaltando: [] as string[] };
}
