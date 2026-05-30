import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function criarClienteAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Defina SUPABASE_URL (ou VITE_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY no ambiente.',
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function resolverMapa(
  supabase: SupabaseClient,
  entidade: string,
  legacyId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('gf_migracao_map')
    .select('hub_id')
    .eq('entidade', entidade)
    .eq('legacy_gf_id', legacyId)
    .maybeSingle();

  return (data as { hub_id: string } | null)?.hub_id ?? null;
}

export async function registrarMapa(
  supabase: SupabaseClient,
  entidade: string,
  legacyId: string,
  hubId: string,
  apply: boolean,
) {
  if (!apply) return;
  await supabase.from('gf_migracao_map').upsert(
    { entidade, legacy_gf_id: legacyId, hub_id: hubId } as never,
    { onConflict: 'entidade,legacy_gf_id' },
  );
}

export async function registrarLote(
  supabase: SupabaseClient,
  etapa: string,
  modo: 'dry_run' | 'apply',
  ok: number,
  erros: string[],
) {
  if (modo === 'dry_run') return;
  await supabase.from('gf_migracao_lote').insert({
    etapa,
    modo,
    registros_ok: ok,
    registros_erro: erros.length,
    mensagens: erros.slice(0, 50),
  } as never);
}
