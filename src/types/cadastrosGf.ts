export type GfMotivoTipo = 'cancelamento' | 'devolucao' | 'ocorrencia' | 'desconto';

export type GfFormaPagamentoTipo =
  | 'dinheiro'
  | 'pix'
  | 'cartao_debito'
  | 'cartao_credito'
  | 'boleto'
  | 'prazo';

export type GfTipoPessoa = 'cliente' | 'fornecedor' | 'vendedor' | 'transportadora';

export type GfTipoContaNatureza = 'receita' | 'despesa';

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

export interface Pessoa {
  id: string;
  tipos: GfTipoPessoa[];
  nome: string;
  nome_fantasia: string | null;
  cpf_cnpj: string | null;
  email: string | null;
  telefone: string | null;
  tabela_preco: string;
  dia_vencimento_semana: number | null;
  bloqueado_pedido: boolean;
  inadimplente: boolean;
  limite_credito: number | null;
  observacoes: string | null;
  ativo: boolean;
}

export interface TipoConta {
  id: string;
  codigo: string;
  nome: string;
  natureza: GfTipoContaNatureza;
  ativo: boolean;
}

export interface ContaBancaria {
  id: string;
  banco_codigo: string;
  agencia: string;
  conta: string;
  titular: string;
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

export const TIPO_PESSOA_LABEL: Record<GfTipoPessoa, string> = {
  cliente: 'Cliente',
  fornecedor: 'Fornecedor',
  vendedor: 'Vendedor',
  transportadora: 'Transportadora',
};

export const TIPO_CONTA_NATUREZA_LABEL: Record<GfTipoContaNatureza, string> = {
  receita: 'Receita',
  despesa: 'Despesa',
};

export const TIPOS_PESSOA: GfTipoPessoa[] = [
  'cliente',
  'fornecedor',
  'vendedor',
  'transportadora',
];
