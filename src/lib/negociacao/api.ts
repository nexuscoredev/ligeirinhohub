import { supabase } from '@/lib/supabase';
import { registrarEvento } from '@/lib/pedidos/api';
import type {
  FamiliaProduto,
  GfTipoDocumento,
  NegociacaoCabecalho,
  NegociacaoItem,
  OperacaoFiscal,
  TabelaPreco,
} from '@/types/negociacao';
import type { PedidoStatus } from '@/types/pedidos';

const NEGOCIACAO_SELECT = `
  id, numero, cliente_id, status,
  operacao_fiscal_id, vendedor_id, tabela_preco_id, tipo_documento,
  desconto_total, frete_valor, valor_pedido, observacoes, created_at,
  clientes ( nome, nome_fantasia, bloqueado_pedido, inadimplente ),
  operacoes_fiscais ( codigo, descricao ),
  tabelas_preco ( codigo, nome )
`;

export async function listarOperacoesFiscais() {
  const { data, error } = await supabase
    .from('operacoes_fiscais')
    .select('id, codigo, descricao, cfop_dentro_uf, cfop_fora_uf, ativo')
    .eq('ativo', true)
    .order('codigo');
  return { operacoes: (data ?? []) as OperacaoFiscal[], error };
}

export async function listarTabelasPreco() {
  const { data, error } = await supabase
    .from('tabelas_preco')
    .select('id, codigo, nome, padrao, ativo')
    .eq('ativo', true)
    .order('nome');
  return { tabelas: (data ?? []) as TabelaPreco[], error };
}

export async function listarFamiliasProduto() {
  const { data, error } = await supabase
    .from('familias_produto')
    .select('id, nome, ordem, ativo')
    .eq('ativo', true)
    .order('ordem');
  return { familias: (data ?? []) as FamiliaProduto[], error };
}

export async function salvarOperacaoFiscal(payload: {
  id?: string;
  codigo: string;
  descricao: string;
  cfop_dentro_uf?: string | null;
  cfop_fora_uf?: string | null;
  ativo?: boolean;
}) {
  const row = {
    codigo: payload.codigo.trim().toUpperCase(),
    descricao: payload.descricao.trim(),
    cfop_dentro_uf: payload.cfop_dentro_uf?.trim() || null,
    cfop_fora_uf: payload.cfop_fora_uf?.trim() || null,
    ativo: payload.ativo ?? true,
  };
  if (payload.id) {
    const { error } = await supabase.from('operacoes_fiscais').update(row as never).eq('id', payload.id);
    return { error };
  }
  const { error } = await supabase.from('operacoes_fiscais').insert(row as never);
  return { error };
}

export async function salvarTabelaPreco(payload: {
  id?: string;
  codigo: string;
  nome: string;
  padrao?: boolean;
  ativo?: boolean;
}) {
  const row = {
    codigo: payload.codigo.trim().toUpperCase(),
    nome: payload.nome.trim(),
    padrao: Boolean(payload.padrao),
    ativo: payload.ativo ?? true,
  };
  if (payload.id) {
    const { error } = await supabase.from('tabelas_preco').update(row as never).eq('id', payload.id);
    return { error };
  }
  const { error } = await supabase.from('tabelas_preco').insert(row as never);
  return { error };
}

export async function listarVendedores() {
  const { data, error } = await supabase
    .from('pessoas')
    .select('id, nome, nome_fantasia')
    .contains('tipos', ['vendedor'])
    .eq('ativo', true)
    .order('nome');
  return { vendedores: data ?? [], error };
}

export async function resolverPrecoProduto(tabelaPrecoId: string | null, produtoId: string) {
  if (tabelaPrecoId) {
    const { data } = await supabase
      .from('tabelas_preco_itens')
      .select('preco')
      .eq('tabela_preco_id', tabelaPrecoId)
      .eq('produto_id', produtoId)
      .maybeSingle();
    const precoTabela = (data as { preco: number } | null)?.preco;
    if (precoTabela != null) return precoTabela;
  }

  const { data: produto } = await supabase
    .from('produtos')
    .select('preco_base')
    .eq('id', produtoId)
    .maybeSingle();

  return Number((produto as { preco_base: number } | null)?.preco_base ?? 0);
}

export async function listarNegociacoes(limite = 80) {
  const { data, error } = await supabase
    .from('pedidos')
    .select(NEGOCIACAO_SELECT)
    .or('operacao_fiscal_id.not.is.null,tipo_documento.not.is.null')
    .order('created_at', { ascending: false })
    .limit(limite);

  return { negociacoes: (data ?? []) as NegociacaoCabecalho[], error };
}

export async function buscarNegociacao(pedidoId: string) {
  const { data: cab, error: e1 } = await supabase
    .from('pedidos')
    .select(NEGOCIACAO_SELECT)
    .eq('id', pedidoId)
    .single();

  if (e1 || !cab) return { negociacao: null, itens: [] as NegociacaoItem[], error: e1 };

  const { data: itens, error: e2 } = await supabase
    .from('pedido_itens')
    .select('id, pedido_id, produto_id, nome_snapshot, qty_pedida, preco_unitario, produtos ( sku, ncm )')
    .eq('pedido_id', pedidoId)
    .order('nome_snapshot');

  return {
    negociacao: cab as NegociacaoCabecalho,
    itens: (itens ?? []) as NegociacaoItem[],
    error: e2,
  };
}

export async function criarNegociacao(input: {
  clienteId: string;
  operacaoFiscalId: string;
  vendedorId?: string | null;
  tabelaPrecoId?: string | null;
  tipoDocumento: GfTipoDocumento;
  observacoes?: string;
  usuarioId: string;
}) {
  const { data: cliente, error: eCliente } = await supabase
    .from('clientes')
    .select('id, bloqueado_pedido, inadimplente')
    .eq('id', input.clienteId)
    .eq('ativo', true)
    .maybeSingle();

  if (eCliente || !cliente) {
    return { negociacao: null, error: eCliente ?? new Error('Cliente não encontrado.') };
  }

  let tabelaId = input.tabelaPrecoId ?? null;
  if (!tabelaId) {
    const { data: padrao } = await supabase
      .from('tabelas_preco')
      .select('id')
      .eq('padrao', true)
      .eq('ativo', true)
      .maybeSingle();
    tabelaId = (padrao as { id: string } | null)?.id ?? null;
  }

  const status: PedidoStatus =
    input.tipoDocumento === 'orcamento' ? 'orcamento' : 'orcamento';

  const { data, error } = await supabase
    .from('pedidos')
    .insert({
      cliente_id: input.clienteId,
      status,
      origem: 'hub',
      modalidade: 'entrega',
      operacao_fiscal_id: input.operacaoFiscalId,
      vendedor_id: input.vendedorId ?? null,
      tabela_preco_id: tabelaId,
      tipo_documento: input.tipoDocumento,
      observacoes: input.observacoes?.trim() || null,
    } as never)
    .select(NEGOCIACAO_SELECT)
    .single();

  if (!error && data) {
    await registrarEvento((data as NegociacaoCabecalho).id, 'criar_negociacao', input.usuarioId);
  }

  return { negociacao: (data ?? null) as NegociacaoCabecalho | null, error };
}

export async function atualizarNegociacao(
  pedidoId: string,
  patch: {
    operacaoFiscalId?: string;
    vendedorId?: string | null;
    tabelaPrecoId?: string | null;
    tipoDocumento?: GfTipoDocumento;
    descontoTotal?: number;
    freteValor?: number;
    observacoes?: string | null;
  },
) {
  const row: Record<string, unknown> = {};
  if (patch.operacaoFiscalId !== undefined) row.operacao_fiscal_id = patch.operacaoFiscalId;
  if (patch.vendedorId !== undefined) row.vendedor_id = patch.vendedorId;
  if (patch.tabelaPrecoId !== undefined) row.tabela_preco_id = patch.tabelaPrecoId;
  if (patch.tipoDocumento !== undefined) row.tipo_documento = patch.tipoDocumento;
  if (patch.descontoTotal !== undefined) row.desconto_total = patch.descontoTotal;
  if (patch.freteValor !== undefined) row.frete_valor = patch.freteValor;
  if (patch.observacoes !== undefined) row.observacoes = patch.observacoes;

  const { error } = await supabase.from('pedidos').update(row as never).eq('id', pedidoId);
  return { error };
}

export async function adicionarItemNegociacaoPorSku(input: {
  pedidoId: string;
  sku: string;
  qty: number;
  tabelaPrecoId: string | null;
}) {
  const { data: prodRow, error: eSku } = await supabase
    .from('produtos')
    .select('id')
    .eq('sku', input.sku)
    .eq('ativo', true)
    .maybeSingle();

  if (eSku) return { error: eSku };
  const produtoId = (prodRow as { id: string } | null)?.id;
  if (!produtoId) {
    return { error: new Error(`Produto SKU "${input.sku}" não cadastrado no sistema.`) };
  }

  return adicionarItemNegociacao({
    pedidoId: input.pedidoId,
    produtoId,
    qty: input.qty,
    tabelaPrecoId: input.tabelaPrecoId,
  });
}

export async function adicionarItemNegociacao(input: {
  pedidoId: string;
  produtoId: string;
  qty: number;
  tabelaPrecoId: string | null;
}) {
  const { data: produto, error: eProd } = await supabase
    .from('produtos')
    .select('id, nome, sku, categorias_produto ( ordem_separacao )')
    .eq('id', input.produtoId)
    .eq('ativo', true)
    .single();

  if (eProd || !produto) return { error: eProd ?? new Error('Produto não encontrado.') };

  const row = produto as {
    id: string;
    nome: string;
    categorias_produto?: { ordem_separacao: number };
  };

  const preco = await resolverPrecoProduto(input.tabelaPrecoId, row.id);

  const { error } = await supabase.from('pedido_itens').insert({
    pedido_id: input.pedidoId,
    produto_id: row.id,
    nome_snapshot: row.nome,
    categoria_ordem: row.categorias_produto?.ordem_separacao ?? 0,
    qty_pedida: input.qty,
    preco_unitario: preco,
  } as never);

  if (!error) {
    await supabase.rpc('recalcular_totais_pedido', { p_pedido_id: input.pedidoId } as never);
  }

  return { error };
}

export async function removerItemNegociacao(itemId: string, pedidoId: string) {
  const { error } = await supabase.from('pedido_itens').delete().eq('id', itemId);
  if (!error) {
    await supabase.rpc('recalcular_totais_pedido', { p_pedido_id: pedidoId } as never);
  }
  return { error };
}

export async function finalizarNegociacao(pedidoId: string, usuarioId: string) {
  const { data: pedido, error: e1 } = await supabase
    .from('pedidos')
    .select(
      'id, status, tipo_documento, clientes ( bloqueado_pedido, inadimplente )',
    )
    .eq('id', pedidoId)
    .single();

  if (e1 || !pedido) return { error: e1 ?? new Error('Negociação não encontrada.') };

  const row = pedido as {
    status: PedidoStatus;
    tipo_documento: GfTipoDocumento | null;
    clientes?: { bloqueado_pedido: boolean; inadimplente: boolean };
  };

  if (!['orcamento', 'aguardando_separacao'].includes(row.status)) {
    return { error: new Error('Esta negociação não pode mais ser finalizada.') };
  }

  const { count } = await supabase
    .from('pedido_itens')
    .select('id', { count: 'exact', head: true })
    .eq('pedido_id', pedidoId);

  if (!count) return { error: new Error('Adicione pelo menos um item.') };

  const tipo = row.tipo_documento ?? 'orcamento';
  const bloqueado =
    row.clientes?.bloqueado_pedido || row.clientes?.inadimplente;

  if (tipo !== 'orcamento' && bloqueado) {
    return {
      error: new Error(
        'Cliente bloqueado ou inadimplente — finalize como orçamento ou regularize o cadastro.',
      ),
    };
  }

  const novoStatus: PedidoStatus =
    tipo === 'orcamento' ? 'orcamento' : 'aguardando_separacao';

  const { error: e2 } = await supabase
    .from('pedidos')
    .update({
      status: novoStatus,
      aceito_em: novoStatus === 'aguardando_separacao' ? new Date().toISOString() : null,
    } as never)
    .eq('id', pedidoId);

  if (!e2) {
    await registrarEvento(pedidoId, 'finalizar_negociacao', usuarioId, { tipo, novoStatus });
  }

  return { error: e2 };
}
