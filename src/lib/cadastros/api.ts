import { supabase } from '@/lib/supabase';
import type { FormaPagamento, GfFormaPagamentoTipo, GfMotivoTipo, Motivo } from '@/types/cadastrosGf';

export async function listarMotivos() {
  const { data, error } = await supabase
    .from('motivos')
    .select('id, codigo, descricao, tipo, ativo')
    .order('codigo');

  return { motivos: (data ?? []) as Motivo[], error };
}

export async function salvarMotivo(payload: {
  id?: string;
  codigo: string;
  descricao: string;
  tipo: GfMotivoTipo;
  ativo: boolean;
}) {
  const row = {
    codigo: payload.codigo.trim().toUpperCase(),
    descricao: payload.descricao.trim(),
    tipo: payload.tipo,
    ativo: payload.ativo,
  };

  if (payload.id) {
    const { error } = await supabase.from('motivos').update(row as never).eq('id', payload.id);
    return { error };
  }

  const { error } = await supabase.from('motivos').insert(row as never);
  return { error };
}

export async function listarFormasPagamento() {
  const { data, error } = await supabase
    .from('formas_pagamento')
    .select('id, codigo, nome, tipo, gera_conta_receber, dias_prazo, ativo')
    .order('codigo');

  return { formas: (data ?? []) as FormaPagamento[], error };
}

export async function salvarFormaPagamento(payload: {
  id?: string;
  codigo: string;
  nome: string;
  tipo: GfFormaPagamentoTipo;
  gera_conta_receber: boolean;
  dias_prazo: number;
  ativo: boolean;
}) {
  const row = {
    codigo: payload.codigo.trim().toUpperCase(),
    nome: payload.nome.trim(),
    tipo: payload.tipo,
    gera_conta_receber: payload.gera_conta_receber,
    dias_prazo: payload.dias_prazo,
    ativo: payload.ativo,
  };

  if (payload.id) {
    const { error } = await supabase
      .from('formas_pagamento')
      .update(row as never)
      .eq('id', payload.id);
    return { error };
  }

  const { error } = await supabase.from('formas_pagamento').insert(row as never);
  return { error };
}
