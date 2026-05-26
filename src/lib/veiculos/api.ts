import { supabase } from '@/lib/supabase';
import type { Veiculo } from '@/types/veiculos';

export async function listarVeiculos() {
  const { data, error } = await supabase
    .from('veiculos')
    .select('*')
    .eq('ativo', true)
    .order('nome');

  return { veiculos: (data ?? []) as Veiculo[], error };
}

export async function criarVeiculo(input: {
  nome: string;
  placa?: string | null;
  tipo?: string | null;
  capacidadeKg?: number | null;
}) {
  const nome = input.nome.trim();
  if (!nome) return { veiculo: null, error: new Error('Informe o nome do veículo.') };

  const { data, error } = await supabase
    .from('veiculos')
    .insert({
      nome,
      placa: input.placa?.trim() || null,
      tipo: input.tipo?.trim() || null,
      capacidade_kg:
        input.capacidadeKg == null || Number.isNaN(Number(input.capacidadeKg))
          ? null
          : Number(input.capacidadeKg),
      ativo: true,
    } as never)
    .select('*')
    .single();

  return { veiculo: (data ?? null) as Veiculo | null, error };
}

export async function importarVeiculos(
  linhas: Array<{ nome: string; placa?: string; tipo?: string; capacidade_kg?: number | string }>,
) {
  const payload = linhas
    .map((l) => ({
      nome: l.nome.trim(),
      placa: l.placa?.trim() || null,
      tipo: l.tipo?.trim() || null,
      capacidade_kg:
        l.capacidade_kg == null || l.capacidade_kg === ''
          ? null
          : Number(l.capacidade_kg),
      ativo: true,
    }))
    .filter((l) => l.nome.length > 0);

  if (payload.length === 0) {
    return { inseridos: 0, error: new Error('Nenhum veículo válido para importar.') };
  }

  const { error } = await supabase.from('veiculos').insert(payload as never);
  return { inseridos: payload.length, error };
}

