import { supabase } from '@/lib/supabase';
import { ordenarItensSeparacao } from '@/lib/pedidos/ordenarItens';
import { qtyParaStatus } from '@/lib/pedidos/itemStatusSeparacao';
import type {
  Cliente,
  ItemStatusSeparacao,
  Pedido,
  PedidoItem,
  PedidoModalidade,
  PedidoOcorrencia,
  PedidoOrigem,
  PedidoStatus,
  Produto,
} from '@/types/pedidos';

const PEDIDO_SELECT = `
  *,
  clientes ( nome, nome_fantasia, bloqueado_pedido, inadimplente ),
  usuarios:separador_id ( nome )
`;

export async function listarFilaPedidos(filtroOrigem?: PedidoOrigem | 'todos') {
  let q = supabase
    .from('pedidos')
    .select(PEDIDO_SELECT)
    .in('status', [
      'refazer_separacao',
      'aguardando_separacao',
      'separacao_pausada',
      'em_separacao',
    ] as PedidoStatus[])
    .order('prioridade', { ascending: false })
    .order('aceito_em', { ascending: true, nullsFirst: false });

  if (filtroOrigem && filtroOrigem !== 'todos') {
    q = q.eq('origem', filtroOrigem);
  }

  const { data, error } = await q;
  return { pedidos: (data ?? []) as Pedido[], error };
}

export async function buscarPedidoCompleto(id: string) {
  const { data: pedido, error: e1 } = await supabase
    .from('pedidos')
    .select(PEDIDO_SELECT)
    .eq('id', id)
    .single();

  if (e1 || !pedido) return { pedido: null, itens: [], ocorrencias: [], error: e1 };

  const { data: itens, error: e2 } = await supabase
    .from('pedido_itens')
    .select('*, produtos ( nome, sku, imagem_url )')
    .eq('pedido_id', id);

  const { data: ocorrencias } = await supabase
    .from('pedido_ocorrencias')
    .select('*')
    .eq('pedido_id', id)
    .order('created_at', { ascending: false });

  return {
    pedido: pedido as Pedido,
    itens: ordenarItensSeparacao((itens ?? []) as PedidoItem[]),
    ocorrencias: (ocorrencias ?? []) as PedidoOcorrencia[],
    error: e2,
  };
}

export async function registrarEvento(
  pedidoId: string,
  acao: string,
  usuarioId: string | undefined,
  detalhes?: Record<string, unknown>,
) {
  await supabase.from('pedido_eventos').insert({
    pedido_id: pedidoId,
    usuario_id: usuarioId ?? null,
    acao,
    detalhes: detalhes ?? null,
  } as never);
}

export async function iniciarSeparacao(pedidoId: string, usuarioId: string) {
  const { data: ativo } = await supabase
    .from('pedidos')
    .select('id, numero')
    .eq('status', 'em_separacao')
    .neq('id', pedidoId)
    .maybeSingle();

  const outro = ativo as { numero: number } | null;
  if (outro) {
    return {
      error: new Error(
        `Finalize ou pause o pedido #${outro.numero} antes de iniciar outro.`,
      ),
    };
  }

  const { error } = await supabase
    .from('pedidos')
    .update({
      status: 'em_separacao',
      separador_id: usuarioId,
      separacao_iniciada_em: new Date().toISOString(),
      separacao_pausada_em: null,
    } as never)
    .eq('id', pedidoId)
    .in('status', ['aguardando_separacao', 'refazer_separacao', 'separacao_pausada']);

  if (!error) {
    await registrarEvento(pedidoId, 'iniciar_separacao', usuarioId);
  }
  return { error };
}

export async function pausarSeparacao(pedidoId: string, usuarioId: string) {
  const { error } = await supabase
    .from('pedidos')
    .update({
      status: 'separacao_pausada',
      separacao_pausada_em: new Date().toISOString(),
    } as never)
    .eq('id', pedidoId)
    .eq('status', 'em_separacao');

  if (!error) await registrarEvento(pedidoId, 'pausar_separacao', usuarioId);
  return { error };
}

export async function retomarSeparacao(pedidoId: string, usuarioId: string) {
  const { error } = await supabase
    .from('pedidos')
    .update({
      status: 'em_separacao',
      separacao_pausada_em: null,
    } as never)
    .eq('id', pedidoId)
    .eq('status', 'separacao_pausada');

  if (!error) await registrarEvento(pedidoId, 'retomar_separacao', usuarioId);
  return { error };
}

export async function atualizarStatusItemSeparado(
  item: PedidoItem,
  status: ItemStatusSeparacao,
  pedidoId: string,
) {
  const { qty_separada, separado_ok } = qtyParaStatus(status, Number(item.qty_pedida));

  const { error } = await supabase
    .from('pedido_itens')
    .update({
      status_separacao: status,
      qty_separada,
      separado_ok,
    } as never)
    .eq('id', item.id);

  if (!error) {
    await supabase.rpc(
      'recalcular_totais_pedido',
      { p_pedido_id: pedidoId } as never,
    );
  }
  return { error };
}

export async function atualizarQtyItemSeparado(
  item: Pick<PedidoItem, 'id' | 'qty_pedida'>,
  qtySeparada: number,
  pedidoId: string,
) {
  const qtyPedida = Number(item.qty_pedida);
  const qty = Math.max(0, Math.min(qtyPedida, Number(qtySeparada)));
  const status: ItemStatusSeparacao = qty === 0 ? 'indisponivel' : 'separado';
  const separado_ok = qty === qtyPedida;

  const { error } = await supabase
    .from('pedido_itens')
    .update({
      status_separacao: status,
      qty_separada: qty,
      separado_ok,
    } as never)
    .eq('id', item.id);

  if (!error) {
    await supabase.rpc('recalcular_totais_pedido', { p_pedido_id: pedidoId } as never);
  }
  return { error };
}

export async function registrarObservacaoSeparacao(input: {
  pedidoId: string;
  usuarioId: string;
  observacao: string;
  itens?: Array<{ sku?: string | null; nome: string; pedida: number; separada: number; faltou: number }>;
}) {
  const texto = input.observacao.trim();
  if (!texto) return { error: null as Error | null };

  await registrarEvento(input.pedidoId, 'observacao_separacao', input.usuarioId, {
    observacao: texto,
    itens: input.itens ?? null,
  });

  return { error: null as Error | null };
}

export async function concluirSeparacao(pedidoId: string, usuarioId: string) {
  const { error } = await supabase.rpc(
    'concluir_separacao_pedido',
    { p_pedido_id: pedidoId } as never,
  );
  if (!error) await registrarEvento(pedidoId, 'concluir_separacao', usuarioId);
  return { error };
}

export async function aceitarOrcamento(pedidoId: string, usuarioId: string) {
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('cliente_id, clientes ( bloqueado_pedido, inadimplente )')
    .eq('id', pedidoId)
    .single();

  const row = pedido as { clientes?: { bloqueado_pedido?: boolean; inadimplente?: boolean } } | null;
  const cliente = row?.clientes as {
    bloqueado_pedido?: boolean;
    inadimplente?: boolean;
  } | null;

  if (cliente?.bloqueado_pedido || cliente?.inadimplente) {
    return { error: new Error('Cliente bloqueado — não é possível aceitar o pedido.') };
  }

  const { error } = await supabase
    .from('pedidos')
    .update({
      status: 'aguardando_separacao',
      aceito_em: new Date().toISOString(),
    } as never)
    .eq('id', pedidoId)
    .eq('status', 'orcamento');

  if (!error) await registrarEvento(pedidoId, 'aceitar_orcamento', usuarioId);
  return { error };
}

export async function listarPedidosGeral() {
  const { data, error } = await supabase
    .from('pedidos')
    .select(PEDIDO_SELECT)
    .order('created_at', { ascending: false })
    .limit(80);
  return { pedidos: (data ?? []) as Pedido[], error };
}

export interface LinhaNovoPedido {
  sku: string;
  nome: string;
  preco_unitario: number;
  categoria_ordem: number;
  qty: number;
}

export async function criarPedido(input: {
  clienteId: string;
  origem: PedidoOrigem;
  modalidade: PedidoModalidade;
  itens: LinhaNovoPedido[];
  usuarioId: string;
  comoOrcamento?: boolean;
  observacoes?: string;
}) {
  const {
    clienteId,
    origem,
    modalidade,
    itens,
    usuarioId,
    comoOrcamento = false,
    observacoes,
  } = input;

  if (!itens.length) {
    return { pedido: null, error: new Error('Adicione pelo menos um item ao pedido.') };
  }

  const { data: cliente, error: eCliente } = await supabase
    .from('clientes')
    .select('id, nome, bloqueado_pedido, inadimplente')
    .eq('id', clienteId)
    .eq('ativo', true)
    .maybeSingle();

  if (eCliente) return { pedido: null, error: eCliente };
  if (!cliente) {
    return { pedido: null, error: new Error('Cliente não encontrado ou inativo.') };
  }

  const clienteRow = cliente as {
    nome: string;
    bloqueado_pedido: boolean;
    inadimplente: boolean;
  };

  if (
    !comoOrcamento &&
    (clienteRow.bloqueado_pedido || clienteRow.inadimplente)
  ) {
    return {
      pedido: null,
      error: new Error(
        `Cliente "${clienteRow.nome}" está bloqueado ou inadimplente — use orçamento ou regularize o cadastro.`,
      ),
    };
  }

  const skus = [...new Set(itens.map((i) => i.sku))];
  const { data: produtosDb, error: eProd } = await supabase
    .from('produtos')
    .select('id, sku, nome, categorias_produto ( ordem_separacao )')
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
        error: new Error(
          `Produto SKU "${item.sku}" (${item.nome}) não cadastrado. Sincronize em Admin → Produtos.`,
        ),
      };
    }
  }

  const status: PedidoStatus = comoOrcamento ? 'orcamento' : 'aguardando_separacao';
  const agora = comoOrcamento ? null : new Date().toISOString();

  const { data: pedidoCriado, error: ePedido } = await supabase
    .from('pedidos')
    .insert({
      cliente_id: clienteId,
      status,
      origem,
      modalidade,
      aceito_em: agora,
      observacoes: observacoes?.trim() || null,
    } as never)
    .select('id, numero')
    .single();

  if (ePedido || !pedidoCriado) {
    return {
      pedido: null,
      error: ePedido ?? new Error('Não foi possível criar o pedido.'),
    };
  }

  const pedido = pedidoCriado as { id: string; numero: number };
  const linhasInsert = itens.map((item) => {
    const prod = porSku.get(item.sku)!;
    const catOrdem =
      prod.categorias_produto?.ordem_separacao ?? item.categoria_ordem;
    return {
      pedido_id: pedido.id,
      produto_id: prod.id,
      nome_snapshot: item.nome,
      categoria_ordem: catOrdem,
      qty_pedida: item.qty,
      preco_unitario: item.preco_unitario,
    };
  });

  const { error: eItens } = await supabase
    .from('pedido_itens')
    .insert(linhasInsert as never);

  if (eItens) {
    return { pedido: null, error: eItens };
  }

  await supabase.rpc('recalcular_totais_pedido', { p_pedido_id: pedido.id } as never);
  await registrarEvento(pedido.id, 'criar_pedido', usuarioId, {
    origem,
    modalidade,
    status,
    itens: itens.length,
  });

  return { pedido, error: null };
}

export async function listarClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('ativo', true)
    .order('nome');
  return { clientes: (data ?? []) as Cliente[], error };
}

export async function listarProdutos() {
  const { data, error } = await supabase
    .from('produtos')
    .select('*, categorias_produto ( nome, ordem_separacao )')
    .eq('ativo', true)
    .order('nome');
  return { produtos: (data ?? []) as Produto[], error };
}

export async function listarEntregasPendentes() {
  const { data, error } = await supabase
    .from('pedidos')
    .select(PEDIDO_SELECT)
    .in('status', [
      'aguardando_entrega',
      'em_rota',
      'com_ocorrencia',
    ] as PedidoStatus[])
    .order('separado_em', { ascending: true });
  return { pedidos: (data ?? []) as Pedido[], error };
}

export async function criarCliente(input: {
  nome: string;
  nomeFantasia?: string | null;
  tabelaPreco?: string | null;
  diaVencimentoSemana?: number | null;
  bloqueadoPedido?: boolean;
  inadimplente?: boolean;
  observacoes?: string | null;
}) {
  const nome = input.nome.trim();
  if (!nome) return { cliente: null, error: new Error('Informe o nome.') };

  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nome,
      nome_fantasia: input.nomeFantasia?.trim() || null,
      tabela_preco: input.tabelaPreco?.trim() || 'padrao',
      dia_vencimento_semana: input.diaVencimentoSemana ?? null,
      bloqueado_pedido: Boolean(input.bloqueadoPedido),
      inadimplente: Boolean(input.inadimplente),
      observacoes: input.observacoes?.trim() || null,
      ativo: true,
    } as never)
    .select('*')
    .single();

  return { cliente: (data ?? null) as Cliente | null, error };
}

export async function importarClientes(
  linhas: Array<{
    nome: string;
    nome_fantasia?: string;
    tabela_preco?: string;
    dia_vencimento_semana?: number | null;
    bloqueado_pedido?: boolean;
    inadimplente?: boolean;
    observacoes?: string;
  }>,
) {
  const payload = linhas
    .map((l) => ({
      nome: l.nome.trim(),
      nome_fantasia: l.nome_fantasia?.trim() || null,
      tabela_preco: l.tabela_preco?.trim() || 'padrao',
      dia_vencimento_semana:
        l.dia_vencimento_semana == null ? null : Number(l.dia_vencimento_semana),
      bloqueado_pedido: Boolean(l.bloqueado_pedido),
      inadimplente: Boolean(l.inadimplente),
      observacoes: l.observacoes?.trim() || null,
      ativo: true,
    }))
    .filter((l) => l.nome.length > 0);

  if (payload.length === 0) {
    return { inseridos: 0, error: new Error('Nenhum cliente válido para importar.') };
  }

  const { error } = await supabase.from('clientes').insert(payload as never);
  return { inseridos: payload.length, error };
}

export async function criarOcorrencia(
  pedidoId: string,
  descricao: string,
  tipo: 'entrega' | 'separacao' | 'outro',
  alerta: boolean,
  usuarioId: string,
) {
  const { error: e1 } = await supabase.from('pedido_ocorrencias').insert({
    pedido_id: pedidoId,
    descricao,
    tipo,
    alerta_imediato: alerta,
    criado_por: usuarioId,
  } as never);

  if (!e1) {
    await supabase
      .from('pedidos')
      .update({ tem_ocorrencia: true, status: 'com_ocorrencia' } as never)
      .eq('id', pedidoId);
    await registrarEvento(pedidoId, 'ocorrencia', usuarioId, { descricao });
  }
  return { error: e1 };
}

export async function registrarRetirada(
  pedidoId: string,
  nomeRetirante: string,
  usuarioId: string,
) {
  const { error } = await supabase
    .from('pedidos')
    .update({
      status: 'retirado',
      retirado_em: new Date().toISOString(),
      retirado_por_nome: nomeRetirante,
    } as never)
    .eq('id', pedidoId)
    .in('status', ['aguardando_retirada', 'separado']);

  if (!error) await registrarEvento(pedidoId, 'retirada', usuarioId, { nomeRetirante });
  return { error };
}
