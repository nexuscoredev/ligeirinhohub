export interface Motorista {
  id: string;
  nome: string;
  telefone: string | null;
  placa: string | null;
  ativo: boolean;
  usuario_id: string | null;
  created_at: string;
}
