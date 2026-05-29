import { supabase } from '@/lib/supabase';
import type { NfceStatus } from '@/lib/pdv/types';

export interface NotaEmitida {
  id: string;
  numero: number;
  valor_pedido: number;
  created_at: string;
  nfce_status: NfceStatus;
  nfce_numero: string | null;
  nfce_chave: string | null;
  nfce_mensagem: string | null;
}

/** Vendas de PDV recentes (para a tela Notas Emitidas). */
export async function listarNotasEmitidas(limite = 60): Promise<{
  notas: NotaEmitida[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from('pedidos')
    .select(
      'id, numero, valor_pedido, created_at, nfce_status, nfce_numero, nfce_chave, nfce_mensagem',
    )
    .eq('origem', 'balcao')
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error) return { notas: [], error };

  const notas = (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      numero: Number(r.numero),
      valor_pedido: Number(r.valor_pedido) || 0,
      created_at: String(r.created_at),
      nfce_status: (r.nfce_status as NfceStatus) ?? 'nao_emitida',
      nfce_numero: (r.nfce_numero as string | null) ?? null,
      nfce_chave: (r.nfce_chave as string | null) ?? null,
      nfce_mensagem: (r.nfce_mensagem as string | null) ?? null,
    } satisfies NotaEmitida;
  });

  return { notas, error: null };
}
