export type EstoqueMovimentoTipo = 'entrada' | 'saida' | 'ajuste' | 'inventario';

export interface EstoqueDeposito {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export interface EstoqueSaldo {
  id: string;
  deposito_id: string;
  produto_id: string;
  quantidade: number;
  updated_at: string;
  produtos?: {
    nome: string;
    sku: string | null;
    estoque_minimo: number | null;
  } | null;
  estoque_depositos?: { codigo: string; nome: string } | null;
}

export interface EstoqueMovimento {
  id: string;
  deposito_id: string;
  produto_id: string;
  lote_id: string | null;
  tipo: EstoqueMovimentoTipo;
  quantidade: number;
  saldo_anterior: number | null;
  saldo_posterior: number | null;
  documento_ref: string | null;
  pedido_id: string | null;
  observacoes: string | null;
  created_at: string;
  produtos?: { nome: string; sku: string | null } | null;
  estoque_depositos?: { codigo: string; nome: string } | null;
}

export interface EstoqueLote {
  id: string;
  deposito_id: string;
  produto_id: string;
  codigo_lote: string;
  data_validade: string | null;
  quantidade: number;
  created_at: string;
  produtos?: { nome: string; sku: string | null } | null;
  estoque_depositos?: { codigo: string; nome: string } | null;
}

export interface ResumoEstoque {
  produtos_com_saldo: number;
  produtos_criticos: number;
  lotes_vencendo: number;
  movimentos_hoje: number;
  total_unidades: number;
}

export const MOVIMENTO_TIPO_LABEL: Record<EstoqueMovimentoTipo, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
  inventario: 'Inventário',
};
