import { supabase } from '@/lib/supabase';
import { FORMAS_PAGAMENTO } from '@/lib/pedidos/constants';
import { parsePagamentoSplit } from '@/lib/pdv/api';
import type {
  CaixaMovimento,
  CaixaMovimentoTipo,
  CaixaTurno,
  ResumoPorForma,
} from '@/lib/pdv/types';

function resumoVazio(): ResumoPorForma {
  return { dinheiro: 0, pix: 0, cartao_debito: 0, cartao_credito: 0 };
}

export async function buscarTurnoAberto(operadorId: string) {
  const { data, error } = await supabase
    .from('caixa_turnos')
    .select('*')
    .eq('operador_id', operadorId)
    .eq('status', 'aberto')
    .order('aberto_em', { ascending: false })
    .limit(1)
    .maybeSingle();
  return { turno: (data as CaixaTurno | null) ?? null, error };
}

export async function abrirCaixa(
  operadorId: string,
  caixaNumero: number,
  valorAbertura: number,
) {
  const { turno: existente } = await buscarTurnoAberto(operadorId);
  if (existente) {
    return { turno: existente, error: null };
  }

  const { data, error } = await supabase
    .from('caixa_turnos')
    .insert({
      operador_id: operadorId,
      caixa_numero: caixaNumero,
      valor_abertura: valorAbertura,
      status: 'aberto',
    } as never)
    .select('*')
    .single();

  if (error || !data) return { turno: null, error };

  const turno = data as CaixaTurno;
  if (valorAbertura > 0) {
    await supabase.from('caixa_movimentos').insert({
      turno_id: turno.id,
      tipo: 'abertura',
      valor: valorAbertura,
      usuario_id: operadorId,
    } as never);
  }
  return { turno, error: null };
}

export async function registrarMovimento(
  turnoId: string,
  tipo: Extract<CaixaMovimentoTipo, 'sangria' | 'suprimento' | 'retirada'>,
  valor: number,
  motivo: string,
  usuarioId: string,
) {
  const { error } = await supabase.from('caixa_movimentos').insert({
    turno_id: turnoId,
    tipo,
    valor,
    motivo: motivo || null,
    usuario_id: usuarioId,
  } as never);
  return { error };
}

export async function listarMovimentos(turnoId: string) {
  const { data, error } = await supabase
    .from('caixa_movimentos')
    .select('*')
    .eq('turno_id', turnoId)
    .order('created_at', { ascending: true });
  return { movimentos: (data ?? []) as CaixaMovimento[], error };
}

export interface ApuracaoTurno {
  vendasPorForma: ResumoPorForma;
  totalVendas: number;
  qtdVendas: number;
  suprimentos: number;
  sangrias: number;
  /** Saldo esperado em dinheiro na gaveta. */
  saldoDinheiro: number;
}

/** Apura vendas e movimentos de um turno (Leitura X / fechamento). */
export async function apurarTurno(turnoId: string): Promise<{
  apuracao: ApuracaoTurno;
  error: Error | null;
}> {
  const vendasPorForma = resumoVazio();
  let totalVendas = 0;
  let qtdVendas = 0;

  const { data: pedidos, error: ePed } = await supabase
    .from('pedidos')
    .select('valor_pedido, pagamento_split, nfce_status')
    .eq('caixa_turno_id', turnoId);

  if (ePed) {
    return {
      apuracao: {
        vendasPorForma,
        totalVendas: 0,
        qtdVendas: 0,
        suprimentos: 0,
        sangrias: 0,
        saldoDinheiro: 0,
      },
      error: ePed,
    };
  }

  for (const row of (pedidos ?? []) as Record<string, unknown>[]) {
    if (row.nfce_status === 'cancelada') continue;
    qtdVendas += 1;
    totalVendas += Number(row.valor_pedido) || 0;
    const split = parsePagamentoSplit(row.pagamento_split) ?? [];
    for (const l of split) {
      if (FORMAS_PAGAMENTO.includes(l.forma)) {
        vendasPorForma[l.forma] += Number(l.valor) || 0;
      }
    }
  }

  const { data: movs, error: eMov } = await supabase
    .from('caixa_movimentos')
    .select('tipo, valor')
    .eq('turno_id', turnoId);

  if (eMov) {
    return {
      apuracao: {
        vendasPorForma,
        totalVendas,
        qtdVendas,
        suprimentos: 0,
        sangrias: 0,
        saldoDinheiro: 0,
      },
      error: eMov,
    };
  }

  let abertura = 0;
  let suprimentos = 0;
  let sangrias = 0;
  for (const m of (movs ?? []) as Record<string, unknown>[]) {
    const v = Number(m.valor) || 0;
    if (m.tipo === 'abertura') abertura += v;
    else if (m.tipo === 'suprimento') suprimentos += v;
    else if (m.tipo === 'sangria' || m.tipo === 'retirada') sangrias += v;
  }

  const saldoDinheiro =
    Math.round((abertura + suprimentos + vendasPorForma.dinheiro - sangrias) * 100) / 100;

  return {
    apuracao: {
      vendasPorForma,
      totalVendas,
      qtdVendas,
      suprimentos,
      sangrias,
      saldoDinheiro,
    },
    error: null,
  };
}

export async function fecharCaixa(
  turnoId: string,
  valorInformado: number,
  valorApurado: number,
  observacoes: string,
  usuarioId: string,
) {
  const { error } = await supabase
    .from('caixa_turnos')
    .update({
      status: 'fechado',
      valor_fechamento_informado: valorInformado,
      valor_fechamento_apurado: valorApurado,
      fechado_em: new Date().toISOString(),
      observacoes: observacoes || null,
    } as never)
    .eq('id', turnoId)
    .eq('status', 'aberto');

  if (!error) {
    await supabase.from('caixa_movimentos').insert({
      turno_id: turnoId,
      tipo: 'fechamento',
      valor: valorInformado,
      motivo: observacoes || null,
      usuario_id: usuarioId,
    } as never);
  }
  return { error };
}
