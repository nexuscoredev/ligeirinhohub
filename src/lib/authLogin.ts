import { supabase } from '@/lib/supabase';

/** Converte o nome de usuário digitado no e-mail técnico do Supabase Auth */
export async function emailParaLogin(usuario: string): Promise<string | null> {
  const login = usuario.trim();
  if (!login) return null;

  const { data, error } = await supabase.rpc('resolve_login_email', {
    p_login: login,
  } as never);

  if (error) {
    console.error('resolve_login_email:', error.message);
    return null;
  }

  const email = data as string | null;
  return typeof email === 'string' && email.length > 0 ? email : null;
}
