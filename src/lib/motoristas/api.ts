import { supabase } from '@/lib/supabase';
import type { Motorista } from '@/types/motoristas';

export async function listarMotoristasCadastrados() {
  const { data, error } = await supabase
    .from('motoristas')
    .select('*')
    .eq('ativo', true)
    .order('nome');

  return { motoristas: (data ?? []) as Motorista[], error };
}
