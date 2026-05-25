import { promoVigente } from '@/lib/marketing/helpers';
import { supabase } from '@/lib/supabase';
import type { Promocao, PromocaoInsert, PromocaoUpdate } from '@/types/marketing';

export async function listarPromocoes() {
  const { data, error } = await supabase
    .from('promocoes')
    .select('*')
    .order('validade_fim', { ascending: true })
    .order('produto_nome', { ascending: true });
  return { promocoes: (data ?? []) as Promocao[], error };
}

export async function listarPromocoesAtivas(ref?: string) {
  const { promocoes, error } = await listarPromocoes();
  if (error) return { promocoes: [], error };
  return {
    promocoes: promocoes.filter((p) => promoVigente(p, ref)),
    error: null,
  };
}

export async function criarPromocao(payload: PromocaoInsert) {
  return supabase.from('promocoes').insert(payload as never).select().single();
}

export async function atualizarPromocao(id: string, payload: PromocaoUpdate) {
  return supabase
    .from('promocoes')
    .update(payload as never)
    .eq('id', id)
    .select()
    .single();
}

export async function excluirPromocao(id: string) {
  return supabase.from('promocoes').delete().eq('id', id);
}
