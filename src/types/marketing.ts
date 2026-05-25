export interface Promocao {
  id: string;
  produto_sku: string;
  produto_nome: string;
  preco_original: number;
  preco_promo: number;
  validade_inicio: string;
  validade_fim: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export type PromocaoInsert = Omit<
  Promocao,
  'id' | 'created_at' | 'updated_at'
>;

export type PromocaoUpdate = Partial<
  Omit<Promocao, 'id' | 'created_at' | 'updated_at'>
>;
