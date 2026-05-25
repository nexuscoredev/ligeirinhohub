import { supabase } from '@/lib/supabase';
import { ordenarItensSeparacao } from '@/lib/pedidos/ordenarItens';
import type {
  Cliente,
  Pedido,
  PedidoItem,
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

export async function atualizarItemSeparado(
  itemId: string,
  qtySeparada: number,
  pedidoId: string,
) {
  const { error } = await supabase
    .from('pedido_itens')
    .update({
      qty_separada: qtySeparada,
      separado_ok: true,
    } as never)
    .eq('id', itemId);

  if (!error) {
    await supabase.rpc(
      'recalcular_totais_pedido',
      { p_pedido_id: pedidoId } as never,
    );
  }
  return { error };
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
