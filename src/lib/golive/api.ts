import { supabase } from '@/lib/supabase';
import type { CriterioGoLive, ResumoGoLive } from '@/types/golive';

export async function avaliarGoLive(): Promise<{
  resumo: ResumoGoLive;
  error: Error | null;
}> {
  const { data, error } = await supabase.rpc('gf_golive_avaliar');

  if (error) {
    return {
      resumo: { criterios: [], prontos: 0, total: 0, liberado: false },
      error,
    };
  }

  const criterios = ((data ?? []) as CriterioGoLive[]).map((c) => ({
    ...c,
    ok: Boolean(c.ok),
    automatico: Boolean(c.automatico),
    confirmado_manual: Boolean(c.confirmado_manual),
  }));

  const prontos = criterios.filter((c) => c.ok).length;
  const total = criterios.length;

  return {
    resumo: {
      criterios,
      prontos,
      total,
      liberado: prontos === total && total > 0,
    },
    error: null,
  };
}

export async function confirmarCriterioManual(
  criterio: string,
  confirmado: boolean,
  observacoes?: string,
) {
  const { error } = await supabase.rpc('gf_golive_confirmar', {
    p_criterio: criterio,
    p_confirmado: confirmado,
    p_observacoes: observacoes ?? null,
  } as never);

  return { error };
}

export async function sincronizarInadimplenciaGoLive() {
  const { data, error } = await supabase.rpc('gf_marcar_contas_vencidas');
  return { atualizadas: (data as number | null) ?? 0, error };
}
