export type ContaFinanceiraNatureza = 'receber' | 'pagar';

export type ContaFinanceiraStatus =
  | 'aberta'
  | 'parcial'
  | 'paga'
  | 'vencida'
  | 'cancelada';

export type ComissaoStatus = 'pendente' | 'paga' | 'cancelada';

export type ValeDescontoStatus = 'ativo' | 'utilizado' | 'expirado' | 'cancelado';

export interface ContaFinanceira {
  id: string;
  natureza: ContaFinanceiraNatureza;
  tipo_conta_id: string | null;
  pessoa_id: string | null;
  pedido_id: string | null;
  descricao: string;
  documento_ref: string | null;
  valor_original: number;
  valor_saldo: number;
  data_emissao: string;
  data_vencimento: string;
  status: ContaFinanceiraStatus;
  forma_pagamento_id: string | null;
  conta_bancaria_id: string | null;
  observacoes: string | null;
  created_at: string;
  pessoas?: { nome: string; nome_fantasia: string | null } | null;
  pedidos?: { numero: number } | null;
  tipos_conta?: { nome: string } | null;
}

export interface Comissao {
  id: string;
  vendedor_pessoa_id: string | null;
  pedido_id: string | null;
  descricao: string;
  percentual: number | null;
  valor: number;
  status: ComissaoStatus;
  data_referencia: string;
  pago_em: string | null;
  created_at: string;
  pessoas?: { nome: string; nome_fantasia: string | null } | null;
  pedidos?: { numero: number } | null;
}

export interface ValeDesconto {
  id: string;
  pessoa_id: string | null;
  codigo: string | null;
  descricao: string;
  valor_original: number;
  saldo: number;
  validade: string | null;
  status: ValeDescontoStatus;
  created_at: string;
  pessoas?: { nome: string; nome_fantasia: string | null } | null;
}

export interface ResumoFinanceiro {
  receber_aberto: number;
  receber_vencido: number;
  pagar_aberto: number;
  pagar_vencido: number;
  comissoes_pendentes: number;
  vales_ativos: number;
  qtd_receber_vencidas: number;
  qtd_pagar_vencidas: number;
}

export const CONTA_STATUS_LABEL: Record<ContaFinanceiraStatus, string> = {
  aberta: 'Aberta',
  parcial: 'Parcial',
  paga: 'Paga',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
};

export const COMISSAO_STATUS_LABEL: Record<ComissaoStatus, string> = {
  pendente: 'Pendente',
  paga: 'Paga',
  cancelada: 'Cancelada',
};

export const VALE_STATUS_LABEL: Record<ValeDescontoStatus, string> = {
  ativo: 'Ativo',
  utilizado: 'Utilizado',
  expirado: 'Expirado',
  cancelado: 'Cancelado',
};
