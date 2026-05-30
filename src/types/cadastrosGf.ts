export type GfMotivoTipo = 'cancelamento' | 'devolucao' | 'ocorrencia' | 'desconto';

export type GfFormaPagamentoTipo =
  | 'dinheiro'
  | 'pix'
  | 'cartao_debito'
  | 'cartao_credito'
  | 'boleto'
  | 'prazo';

export interface Motivo {
  id: string;
  codigo: string;
  descricao: string;
  tipo: GfMotivoTipo;
  ativo: boolean;
}

export interface FormaPagamento {
  id: string;
  codigo: string;
  nome: string;
  tipo: GfFormaPagamentoTipo;
  gera_conta_receber: boolean;
  dias_prazo: number;
  ativo: boolean;
}

export const MOTIVO_TIPO_LABEL: Record<GfMotivoTipo, string> = {
  cancelamento: 'Cancelamento',
  devolucao: 'Devolução',
  ocorrencia: 'Ocorrência',
  desconto: 'Desconto',
};

export const FORMA_PAGAMENTO_TIPO_LABEL: Record<GfFormaPagamentoTipo, string> = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  cartao_debito: 'Cartão débito',
  cartao_credito: 'Cartão crédito',
  boleto: 'Boleto',
  prazo: 'Prazo',
};
