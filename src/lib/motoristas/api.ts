import { supabase } from '@/lib/supabase';
import type { Motorista } from '@/types/motoristas';

export async function listarMotoristasCadastrados() {
  const { data, error } = await supabase
    .from('motoristas')
    .select('*')
    .order('ativo', { ascending: false })
    .order('nome');

  return { motoristas: (data ?? []) as Motorista[], error };
}

export async function criarMotorista(input: {
  nome: string;
  telefone?: string | null;
  placa?: string | null;
}) {
  const nome = input.nome.trim();
  if (!nome) return { motorista: null, error: new Error('Informe o nome.') };

  const { data, error } = await supabase
    .from('motoristas')
    .insert({
      nome,
      telefone: input.telefone?.trim() || null,
      placa: input.placa?.trim() || null,
      ativo: true,
    } as never)
    .select('*')
    .single();

  return { motorista: (data ?? null) as Motorista | null, error };
}

export async function importarMotoristas(linhas: Array<{ nome: string; telefone?: string; placa?: string }>) {
  const payload = linhas
    .map((l) => ({
      nome: l.nome.trim(),
      telefone: l.telefone?.trim() || null,
      placa: l.placa?.trim() || null,
      ativo: true,
    }))
    .filter((l) => l.nome.length > 0);

  if (payload.length === 0) {
    return { inseridos: 0, error: new Error('Nenhum motorista válido para importar.') };
  }

  const { error } = await supabase.from('motoristas').insert(payload as never);
  return { inseridos: payload.length, error };
}
