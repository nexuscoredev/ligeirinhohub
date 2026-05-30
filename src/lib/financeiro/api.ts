import { supabase } from '@/lib/supabase';
import type {
  Comissao,
  ComissaoStatus,
  ContaFinanceira,
  ContaFinanceiraNatureza,
  ContaFinanceiraStatus,
  ResumoFinanceiro,
  ValeDesconto,
  ValeDescontoStatus,
} from '@/types/financeiro';

const SELECT_CONTA =
  'id, natureza, tipo_conta_id, pessoa_id, pedido_id, descricao, documento_ref, valor_original, valor_saldo, data_emissao, data_vencimento, status, forma_pagamento_id, conta_bancaria_id, observacoes, created_at, pessoas ( nome, nome_fantasia ), pedidos ( numero ), tipos_conta ( nome )';

export async function marcarContasVencidas() {
  const { data, error } = await supabase.rpc('gf_marcar_contas_vencidas');
  return { atualizadas: (data as number | null) ?? 0, error };
}

export async function listarContasFinanceiras(
  natureza: ContaFinanceiraNatureza,
  limite = 100,
) {
  await marcarContasVencidas();

  const { data, error } = await supabase
    .from('contas_financeiras')
    .select(SELECT_CONTA)
    .eq('natureza', natureza)
    .neq('status', 'cancelada')
    .order('data_vencimento', { ascending: true })
    .limit(limite);

  return { contas: (data ?? []) as ContaFinanceira[], error };
}

export async function salvarContaFinanceira(payload: {
  id?: string;
  natureza: ContaFinanceiraNatureza;
  descricao: string;
  valor_original: number;
  data_vencimento: string;
  data_emissao?: string;
  pessoa_id?: string | null;
  pedido_id?: string | null;
  tipo_conta_id?: string | null;
  documento_ref?: string | null;
  observacoes?: string | null;
}) {
  const valor = Math.round(payload.valor_original * 100) / 100;
  if (valor <= 0) {
    return { error: new Error('Valor deve ser maior que zero.') };
  }

  const row = {
    natureza: payload.natureza,
    descricao: payload.descricao.trim(),
    valor_original: valor,
    valor_saldo: valor,
    data_emissao: payload.data_emissao ?? new Date().toISOString().slice(0, 10),
    data_vencimento: payload.data_vencimento,
    pessoa_id: payload.pessoa_id ?? null,
    pedido_id: payload.pedido_id ?? null,
    tipo_conta_id: payload.tipo_conta_id ?? null,
    documento_ref: payload.documento_ref?.trim() || null,
    observacoes: payload.observacoes?.trim() || null,
    status: 'aberta' as ContaFinanceiraStatus,
  };

  if (payload.id) {
    const { error } = await supabase
      .from('contas_financeiras')
      .update({
        descricao: row.descricao,
        data_vencimento: row.data_vencimento,
        tipo_conta_id: row.tipo_conta_id,
        documento_ref: row.documento_ref,
        observacoes: row.observacoes,
      } as never)
      .eq('id', payload.id);
    return { error };
  }

  const { error } = await supabase.from('contas_financeiras').insert(row as never);
  return { error };
}

export async function registrarBaixaConta(payload: {
  conta_financeira_id: string;
  valor: number;
  data_baixa?: string;
  forma_pagamento_id?: string | null;
  conta_bancaria_id?: string | null;
  observacoes?: string | null;
}) {
  const valor = Math.round(payload.valor * 100) / 100;
  if (valor <= 0) {
    return { error: new Error('Valor da baixa deve ser maior que zero.') };
  }

  const { error } = await supabase.from('contas_financeiras_baixas').insert({
    conta_financeira_id: payload.conta_financeira_id,
    valor,
    data_baixa: payload.data_baixa ?? new Date().toISOString().slice(0, 10),
    forma_pagamento_id: payload.forma_pagamento_id ?? null,
    conta_bancaria_id: payload.conta_bancaria_id ?? null,
    observacoes: payload.observacoes?.trim() || null,
  } as never);

  return { error };
}

export async function cancelarContaFinanceira(id: string) {
  const { error } = await supabase
    .from('contas_financeiras')
    .update({ status: 'cancelada', valor_saldo: 0 } as never)
    .eq('id', id);
  return { error };
}

export async function resumoFinanceiro(): Promise<{
  resumo: ResumoFinanceiro;
  error: Error | null;
}> {
  await marcarContasVencidas();

  const [receber, pagar, comissoes, vales] = await Promise.all([
    supabase
      .from('contas_financeiras')
      .select('valor_saldo, status')
      .eq('natureza', 'receber')
      .not('status', 'in', '("paga","cancelada")'),
    supabase
      .from('contas_financeiras')
      .select('valor_saldo, status')
      .eq('natureza', 'pagar')
      .not('status', 'in', '("paga","cancelada")'),
    supabase
      .from('comissoes')
      .select('valor')
      .eq('status', 'pendente'),
    supabase
      .from('vales_desconto')
      .select('saldo')
      .eq('status', 'ativo'),
  ]);

  if (receber.error) return { resumo: resumoVazio(), error: receber.error };
  if (pagar.error) return { resumo: resumoVazio(), error: pagar.error };

  const rowsReceber = (receber.data ?? []) as { valor_saldo: number; status: string }[];
  const rowsPagar = (pagar.data ?? []) as { valor_saldo: number; status: string }[];

  return {
    resumo: {
      receber_aberto: somaSaldo(rowsReceber),
      receber_vencido: somaSaldo(rowsReceber.filter((r) => r.status === 'vencida')),
      pagar_aberto: somaSaldo(rowsPagar),
      pagar_vencido: somaSaldo(rowsPagar.filter((r) => r.status === 'vencida')),
      comissoes_pendentes: ((comissoes.data ?? []) as { valor: number }[]).reduce(
        (s, r) => s + Number(r.valor),
        0,
      ),
      vales_ativos: ((vales.data ?? []) as { saldo: number }[]).reduce(
        (s, r) => s + Number(r.saldo),
        0,
      ),
      qtd_receber_vencidas: rowsReceber.filter((r) => r.status === 'vencida').length,
      qtd_pagar_vencidas: rowsPagar.filter((r) => r.status === 'vencida').length,
    },
    error: null,
  };
}

function somaSaldo(rows: { valor_saldo: number }[]) {
  return Math.round(rows.reduce((s, r) => s + Number(r.valor_saldo), 0) * 100) / 100;
}

function resumoVazio(): ResumoFinanceiro {
  return {
    receber_aberto: 0,
    receber_vencido: 0,
    pagar_aberto: 0,
    pagar_vencido: 0,
    comissoes_pendentes: 0,
    vales_ativos: 0,
    qtd_receber_vencidas: 0,
    qtd_pagar_vencidas: 0,
  };
}

export async function listarComissoes(limite = 80) {
  const { data, error } = await supabase
    .from('comissoes')
    .select(
      'id, vendedor_pessoa_id, pedido_id, descricao, percentual, valor, status, data_referencia, pago_em, created_at, pessoas ( nome, nome_fantasia ), pedidos ( numero )',
    )
    .order('created_at', { ascending: false })
    .limit(limite);

  return { comissoes: (data ?? []) as Comissao[], error };
}

export async function salvarComissao(payload: {
  id?: string;
  descricao: string;
  valor: number;
  vendedor_pessoa_id?: string | null;
  pedido_id?: string | null;
  percentual?: number | null;
  data_referencia?: string;
}) {
  const row = {
    descricao: payload.descricao.trim(),
    valor: Math.round(payload.valor * 100) / 100,
    vendedor_pessoa_id: payload.vendedor_pessoa_id ?? null,
    pedido_id: payload.pedido_id ?? null,
    percentual: payload.percentual ?? null,
    data_referencia: payload.data_referencia ?? new Date().toISOString().slice(0, 10),
  };

  if (payload.id) {
    const { error } = await supabase.from('comissoes').update(row as never).eq('id', payload.id);
    return { error };
  }

  const { error } = await supabase.from('comissoes').insert(row as never);
  return { error };
}

export async function atualizarStatusComissao(id: string, status: ComissaoStatus) {
  const patch: Record<string, unknown> = { status };
  if (status === 'paga') {
    patch.pago_em = new Date().toISOString().slice(0, 10);
  }
  const { error } = await supabase.from('comissoes').update(patch as never).eq('id', id);
  return { error };
}

export async function listarValesDesconto(limite = 80) {
  const { data, error } = await supabase
    .from('vales_desconto')
    .select(
      'id, pessoa_id, codigo, descricao, valor_original, saldo, validade, status, created_at, pessoas ( nome, nome_fantasia )',
    )
    .order('created_at', { ascending: false })
    .limit(limite);

  return { vales: (data ?? []) as ValeDesconto[], error };
}

export async function salvarValeDesconto(payload: {
  id?: string;
  descricao: string;
  valor_original: number;
  pessoa_id?: string | null;
  codigo?: string | null;
  validade?: string | null;
}) {
  const valor = Math.round(payload.valor_original * 100) / 100;
  const row = {
    descricao: payload.descricao.trim(),
    valor_original: valor,
    saldo: valor,
    pessoa_id: payload.pessoa_id ?? null,
    codigo: payload.codigo?.trim() || null,
    validade: payload.validade || null,
    status: 'ativo' as ValeDescontoStatus,
  };

  if (payload.id) {
    const { error } = await supabase
      .from('vales_desconto')
      .update({
        descricao: row.descricao,
        codigo: row.codigo,
        validade: row.validade,
        pessoa_id: row.pessoa_id,
      } as never)
      .eq('id', payload.id);
    return { error };
  }

  const { error } = await supabase.from('vales_desconto').insert(row as never);
  return { error };
}

export async function listarTurnosCaixaRecentes(limite = 15) {
  const { data, error } = await supabase
    .from('caixa_turnos')
    .select(
      'id, caixa_numero, status, valor_abertura, valor_fechamento_informado, valor_fechamento_apurado, aberto_em, fechado_em, operador_id',
    )
    .order('aberto_em', { ascending: false })
    .limit(limite);

  return { turnos: data ?? [], error };
}

export async function listarPessoasResumo() {
  const { data, error } = await supabase
    .from('pessoas')
    .select('id, nome, nome_fantasia')
    .eq('ativo', true)
    .order('nome')
    .limit(200);

  return { pessoas: data ?? [], error };
}
