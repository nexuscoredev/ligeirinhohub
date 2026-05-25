import { supabase } from '@/lib/supabase';
import { ordenarItensSeparacao } from '@/lib/pedidos/ordenarItens';
import { registrarEvento } from '@/lib/pedidos/api';
import type {
  FormaPagamento,
  PagamentoSplit,
  PagamentoSplitLinha,
  Pedido,
  PedidoItem,
} from '@/types/pedidos';

const PEDIDO_SELECT = `
  *,
  clientes ( nome, nome_fantasia, bloqueado_pedido, inadimplente ),
  usuarios:separador_id ( nome )
`;

const CLIENTE_BALCAO_NOME = 'Balcão — Varejo Loja';

export interface LinhaCarrinhoBalcao {
  sku: string;
  nome: string;
  preco_unitario: number;
  categoria_ordem: number;
  qty: number;
}

export function somaPagamentoSplit(split: PagamentoSplit): number {
  return split.reduce((acc, l) => acc + Number(l.valor), 0);
}

export function validarPagamentoSplit(
  split: PagamentoSplit,
  totalEsperado: number,
  tolerancia = 0.01,
): { ok: boolean; soma: number; mensagem?: string } {
  const linhasValidas = split.filter((l) => Number(l.valor) > 0);
  if (linhasValidas.length === 0) {
    return { ok: false, soma: 0, mensagem: 'Informe ao menos uma forma de pagamento.' };
  }
  const soma = somaPagamentoSplit(linhasValidas);
  if (Math.abs(soma - totalEsperado) > tolerancia) {
    return {
      ok: false,
      soma,
      mensagem: `A soma (${soma.toFixed(2)}) deve ser igual ao total (${totalEsperado.toFixed(2)}).`,
    };
  }
  return { ok: true, soma };
}

export function parsePagamentoSplit(raw: unknown): PagamentoSplit | null {
  if (!raw || !Array.isArray(raw)) return null;
  const linhas: PagamentoSplitLinha[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const forma = row.forma as FormaPagamento;
    const valor = Number(row.valor);
    if (
      !['dinheiro', 'pix', 'cartao_debito', 'cartao_credito'].includes(forma) ||
      !Number.isFinite(valor)
    ) {
      continue;
    }
    linhas.push({ forma, valor });
  }
  return linhas.length > 0 ? linhas : null;
}

async function buscarClientePorNome(nome: string) {
  const { data, error } = await supabase
    .from('clientes')
    .select('id')
    .eq('nome', nome)
    .eq('ativo', true)
    .maybeSingle();
  return { clienteId: (data as { id: string } | null)?.id ?? null, error };
}

export async function buscarPedidoPorNumero(numero: number) {
  const { data: pedido, error: e1 } = await supabase
    .from('pedidos')
    .select(PEDIDO_SELECT)
    .eq('numero', numero)
    .maybeSingle();

  if (e1) return { pedido: null, itens: [], error: e1 };
  if (!pedido) {
    return { pedido: null, itens: [], error: new Error(`Pedido #${numero} não encontrado.`) };
  }

  const pedidoRow = pedido as Pedido;
  const { data: itens, error: e2 } = await supabase
    .from('pedido_itens')
    .select('*, produtos ( nome, sku, imagem_url )')
    .eq('pedido_id', pedidoRow.id);

  return {
    pedido: pedidoRow,
    itens: ordenarItensSeparacao((itens ?? []) as PedidoItem[]),
    error: e2,
  };
}

export async function confirmarRecebimento(pedidoId: string, usuarioId: string) {
  const { data: pedido, error: e0 } = await supabase
    .from('pedidos')
    .select('id, numero, status, pagamento_recebido_em, origem')
    .eq('id', pedidoId)
    .single();

  if (e0 || !pedido) {
    return { error: e0 ?? new Error('Pedido não encontrado.') };
  }

  const row = pedido as {
    numero: number;
    status: string;
    pagamento_recebido_em: string | null;
    origem: string;
  };

  if (row.pagamento_recebido_em) {
    return {
      error: new Error(`Pedido #${row.numero} já teve pagamento confirmado no caixa.`),
    };
  }

  const statusTerminal = ['retirado', 'entregue', 'concluido'];
  if (statusTerminal.includes(row.status)) {
    return {
      error: new Error(
        `Pedido #${row.numero} está em status "${row.status}" — não é possível confirmar recebimento.`,
      ),
    };
  }

  const agora = new Date().toISOString();
  const update: Record<string, unknown> = { pagamento_recebido_em: agora };

  if (row.status === 'orcamento') {
    update.status = 'aguardando_separacao';
    update.aceito_em = agora;
  }

  const { error } = await supabase
    .from('pedidos')
    .update(update as never)
    .eq('id', pedidoId)
    .is('pagamento_recebido_em', null);

  if (!error) {
    await registrarEvento(pedidoId, 'confirmar_recebimento', usuarioId, {
      origem: row.origem,
    });
  }
  return { error };
}

export async function criarVendaBalcao(
  itens: LinhaCarrinhoBalcao[],
  pagamentoSplit: PagamentoSplit,
  usuarioId: string,
) {
  if (itens.length === 0) {
    return { pedido: null, error: new Error('Adicione itens ao carrinho.') };
  }

  const total = itens.reduce(
    (acc, i) => acc + i.preco_unitario * i.qty,
    0,
  );
  const validacao = validarPagamentoSplit(pagamentoSplit, total);
  if (!validacao.ok) {
    return { pedido: null, error: new Error(validacao.mensagem) };
  }

  const { clienteId, error: eCliente } = await buscarClientePorNome(CLIENTE_BALCAO_NOME);
  if (eCliente) return { pedido: null, error: eCliente };
  if (!clienteId) {
    return {
      pedido: null,
      error: new Error(
        `Cliente "${CLIENTE_BALCAO_NOME}" não encontrado. Execute a migration PDV.`,
      ),
    };
  }

  const skus = [...new Set(itens.map((i) => i.sku))];
  const { data: produtosDb, error: eProd } = await supabase
    .from('produtos')
    .select('id, sku, nome, categoria_id, categorias_produto ( ordem_separacao )')
    .in('sku', skus)
    .eq('ativo', true);

  if (eProd) return { pedido: null, error: eProd };

  const porSku = new Map(
    (produtosDb ?? []).map((p) => {
      const row = p as {
        id: string;
        sku: string;
        nome: string;
        categorias_produto?: { ordem_separacao: number };
      };
      return [row.sku, row];
    }),
  );

  for (const item of itens) {
    if (!porSku.has(item.sku)) {
      return {
        pedido: null,
        error: new Error(`Produto SKU "${item.sku}" (${item.nome}) não cadastrado no sistema.`),
      };
    }
  }

  const agora = new Date().toISOString();
  const splitLimpo = pagamentoSplit.filter((l) => Number(l.valor) > 0);

  const { data: pedidoCriado, error: ePedido } = await supabase
    .from('pedidos')
    .insert({
      cliente_id: clienteId,
      status: 'aguardando_separacao',
      origem: 'balcao',
      modalidade: 'retirada',
      valor_pedido: total,
      aceito_em: agora,
      pagamento_split: splitLimpo,
      pagamento_recebido_em: agora,
    } as never)
    .select(PEDIDO_SELECT)
    .single();

  if (ePedido || !pedidoCriado) {
    return { pedido: null, error: ePedido ?? new Error('Falha ao criar pedido.') };
  }

  const pedido = pedidoCriado as Pedido;
  const linhasInsert = itens.map((item) => {
    const prod = porSku.get(item.sku)!;
    const catOrdem =
      (prod as { categorias_produto?: { ordem_separacao: number } }).categorias_produto
        ?.ordem_separacao ?? item.categoria_ordem;
    return {
      pedido_id: pedido.id,
      produto_id: prod.id,
      nome_snapshot: item.nome,
      categoria_ordem: catOrdem,
      qty_pedida: item.qty,
      preco_unitario: item.preco_unitario,
    };
  });

  const { error: eItens } = await supabase.from('pedido_itens').insert(linhasInsert as never);

  if (eItens) {
    return { pedido: null, error: eItens };
  }

  await supabase.rpc('recalcular_totais_pedido', { p_pedido_id: pedido.id } as never);
  await registrarEvento(pedido.id, 'venda_balcao', usuarioId, {
    itens: itens.length,
    total,
  });

  const { pedido: atualizado, itens: itensPedido, error: eBusca } =
    await buscarPedidoPorNumero(pedido.numero);

  return {
    pedido: atualizado ?? pedido,
    itens: itensPedido,
    error: eBusca,
  };
}
