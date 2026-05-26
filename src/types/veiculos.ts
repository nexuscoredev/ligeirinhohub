export interface Veiculo {
  id: string;
  nome: string;
  placa: string | null;
  tipo: string | null;
  capacidade_kg: number | null;
  ativo: boolean;
  created_at: string;
}

