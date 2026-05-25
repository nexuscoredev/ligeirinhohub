import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigurado } from '@/lib/supabase';

const CATALOGO_URL =
  import.meta.env.VITE_CATALOGO_LEGADO_URL ?? '/data/catalogo.json';

export interface StatusSistema {
  id: string;
  nome: string;
  label: string;
  ok: boolean;
}

export async function verificarSupabase(): Promise<StatusSistema> {
  if (!supabaseConfigurado) {
    return {
      id: 'supabase',
      nome: 'Supabase',
      label: 'não configurado',
      ok: false,
    };
  }

  try {
    const { error: dbError } = await supabase.from('usuarios').select('id').limit(1);
    if (dbError) {
      return {
        id: 'supabase',
        nome: 'Supabase',
        label: 'indisponível',
        ok: false,
      };
    }
    return {
      id: 'supabase',
      nome: 'Supabase',
      label: 'conectado',
      ok: true,
    };
  } catch {
    return {
      id: 'supabase',
      nome: 'Supabase',
      label: 'indisponível',
      ok: false,
    };
  }
}

export function verificarSessaoAuth(session: Session | null): StatusSistema {
  const ok = Boolean(session?.access_token);
  return {
    id: 'auth',
    nome: 'Sessão Auth',
    label: ok ? 'ativa' : 'inativa',
    ok,
  };
}

export async function verificarCatalogoLegado(): Promise<StatusSistema> {
  const nome = 'Catálogo legado';
  try {
    const res = await fetch(CATALOGO_URL, { cache: 'no-store' });
    if (!res.ok) {
      return {
        id: 'catalogo',
        nome,
        label: `erro ${res.status}`,
        ok: false,
      };
    }
    return {
      id: 'catalogo',
      nome,
      label: 'disponível',
      ok: true,
    };
  } catch {
    return {
      id: 'catalogo',
      nome,
      label: 'indisponível',
      ok: false,
    };
  }
}

export function urlCatalogoExibicao(): string {
  return CATALOGO_URL;
}

export async function carregarStatusSistemas(
  session: Session | null,
): Promise<StatusSistema[]> {
  const [supabase, catalogo] = await Promise.all([
    verificarSupabase(),
    verificarCatalogoLegado(),
  ]);
  return [supabase, verificarSessaoAuth(session), catalogo];
}
