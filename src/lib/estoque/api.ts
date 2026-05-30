import { supabase } from '@/lib/supabase';
import type {
  EstoqueDeposito,
  EstoqueLote,
  EstoqueMovimento,
  EstoqueMovimentoTipo,
  EstoqueSaldo,
  ResumoEstoque,
} from '@/types/estoque';

export async function listarDepositos() {
  const { data, error } = await supabase
    .from('estoque_depositos')
    .select('id, codigo, nome, descricao, ativo')
    .eq('ativo', true)
    .order('codigo');

  return { depositos: (data ?? []) as EstoqueDeposito[], error };
}

export async function listarSaldos(depositoId?: string, apenasCriticos = false) {
  let q = supabase
    .from('estoque_saldos')
    .select(
      'id, deposito_id, produto_id, quantidade, updated_at, produtos ( nome, sku, estoque_minimo ), estoque_depositos ( codigo, nome )',
    )
    .order('updated_at', { ascending: false })
    .limit(200);

  if (depositoId) q = q.eq('deposito_id', depositoId);

  const { data, error } = await q;
  let saldos = (data ?? []) as EstoqueSaldo[];

  if (apenasCriticos) {
    saldos = saldos.filter((s) => {
      const min = s.produtos?.estoque_minimo;
      if (min == null) return false;
      return Number(s.quantidade) < Number(min);
    });
  }

  return { saldos, error };
}

export async function listarMovimentos(limite = 80) {
  const { data, error } = await supabase
    .from('estoque_movimentos')
    .select(
      'id, deposito_id, produto_id, lote_id, tipo, quantidade, saldo_anterior, saldo_posterior, documento_ref, pedido_id, observacoes, created_at, produtos ( nome, sku ), estoque_depositos ( codigo, nome )',
    )
    .order('created_at', { ascending: false })
    .limit(limite);

  return { movimentos: (data ?? []) as EstoqueMovimento[], error };
}

export async function registrarMovimento(payload: {
  deposito_id: string;
  produto_id: string;
  tipo: EstoqueMovimentoTipo;
  quantidade: number;
  documento_ref?: string | null;
  observacoes?: string | null;
  pedido_id?: string | null;
}) {
  const qtd = Math.round(payload.quantidade * 1000) / 1000;
  if (qtd <= 0) return { error: new Error('Quantidade deve ser maior que zero.') };

  const { error } = await supabase.from('estoque_movimentos').insert({
    deposito_id: payload.deposito_id,
    produto_id: payload.produto_id,
    tipo: payload.tipo,
    quantidade: qtd,
    documento_ref: payload.documento_ref?.trim() || null,
    observacoes: payload.observacoes?.trim() || null,
    pedido_id: payload.pedido_id ?? null,
  } as never);

  return { error };
}

export async function listarLotes(limite = 100) {
  const { data, error } = await supabase
    .from('estoque_lotes')
    .select(
      'id, deposito_id, produto_id, codigo_lote, data_validade, quantidade, created_at, produtos ( nome, sku ), estoque_depositos ( codigo, nome )',
    )
    .order('data_validade', { ascending: true, nullsFirst: false })
    .limit(limite);

  return { lotes: (data ?? []) as EstoqueLote[], error };
}

export async function salvarLote(payload: {
  deposito_id: string;
  produto_id: string;
  codigo_lote: string;
  quantidade: number;
  data_validade?: string | null;
}) {
  const qtd = Math.round(payload.quantidade * 1000) / 1000;
  const { error } = await supabase.from('estoque_lotes').upsert(
    {
      deposito_id: payload.deposito_id,
      produto_id: payload.produto_id,
      codigo_lote: payload.codigo_lote.trim(),
      quantidade: qtd,
      data_validade: payload.data_validade || null,
    } as never,
    { onConflict: 'deposito_id,produto_id,codigo_lote' },
  );
  return { error };
}

export async function resumoEstoque(): Promise<{
  resumo: ResumoEstoque;
  error: Error | null;
}> {
  const hoje = new Date().toISOString().slice(0, 10);
  const em30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const [saldosRes, movRes, lotesRes] = await Promise.all([
    supabase
      .from('estoque_saldos')
      .select('quantidade, produtos ( estoque_minimo )')
      .gt('quantidade', 0),
    supabase
      .from('estoque_movimentos')
      .select('id')
      .gte('created_at', `${hoje}T00:00:00`),
    supabase
      .from('estoque_lotes')
      .select('id')
      .gt('quantidade', 0)
      .lte('data_validade', em30),
  ]);

  if (saldosRes.error) {
    return {
      resumo: { produtos_com_saldo: 0, produtos_criticos: 0, lotes_vencendo: 0, movimentos_hoje: 0, total_unidades: 0 },
      error: saldosRes.error,
    };
  }

  const saldos = (saldosRes.data ?? []) as {
    quantidade: number;
    produtos: { estoque_minimo: number | null } | null;
  }[];

  const criticos = saldos.filter((s) => {
    const min = s.produtos?.estoque_minimo;
    return min != null && Number(s.quantidade) < Number(min);
  });

  return {
    resumo: {
      produtos_com_saldo: saldos.length,
      produtos_criticos: criticos.length,
      lotes_vencendo: lotesRes.data?.length ?? 0,
      movimentos_hoje: movRes.data?.length ?? 0,
      total_unidades: saldos.reduce((acc, s) => acc + Number(s.quantidade), 0),
    },
    error: null,
  };
}

export async function listarProdutosEstoque() {
  const { data, error } = await supabase
    .from('produtos')
    .select('id, nome, sku, estoque_minimo, controla_lote, controla_validade')
    .eq('ativo', true)
    .order('nome')
    .limit(300);

  return { produtos: data ?? [], error };
}
