import { supabase } from '@/lib/supabase';
import type { CargoHub, Usuario } from '@/types/database';

export function isHubAdmin(cargo: CargoHub): boolean {
  return cargo === 'Desenvolvedor' || cargo === 'Administrador' || cargo === 'CEO';
}

export async function listarUsuarios() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('nome');

  return { usuarios: (data ?? []) as Usuario[], error };
}

export async function atualizarUsuario(
  id: string,
  patch: Pick<Usuario, 'nome' | 'cargo' | 'ativo' | 'paginas_permitidas'>,
) {
  const { error } = await supabase
    .from('usuarios')
    .update(patch as never)
    .eq('id', id);

  return { error };
}
