export type PedidoStatus =
  | 'orcamento'
  | 'aguardando_separacao'
  | 'em_separacao'
  | 'separacao_pausada'
  | 'separado'
  | 'aguardando_retirada'
  | 'aguardando_entrega'
  | 'em_rota'
  | 'retirado'
  | 'entregue'
  | 'concluido'
  | 'com_ocorrencia'
  | 'refazer_separacao';

export type PedidoOrigem =
  | 'whatsapp'
  | 'cayena'
  | 'balcao'
  | 'totem'
  | 'app'
  | 'hub';

export type PedidoModalidade = 'retirada' | 'entrega';

export interface PagamentoSplitItem {
  forma: string;
  valor: number;
}

export type FormaPagamento =
  | 'dinheiro'
  | 'pix'
  | 'cartao_debito'
  | 'cartao_credito';

export interface PagamentoSplitLinha {
  forma: FormaPagamento;
  valor: number;
}

export type PagamentoSplit = PagamentoSplitLinha[];

export type ItemStatusSeparacao = 'pendente' | 'separado' | 'indisponivel';

export interface CategoriaProduto {
  id: string;
  nome: string;
  slug: string;
  ordem_separacao: number;
}

export interface Produto {
  id: string;
  categoria_id: string;
  nome: string;
  sku: string | null;
  imagem_url: string | null;
  preco_base: number;
  ativo: boolean;
  categorias_produto?: { nome: string; ordem_separacao: number };
}

export interface Cliente {
  id: string;
  nome: string;
  nome_fantasia: string | null;
  tabela_preco: string;
  dia_vencimento_semana: number | null;
  bloqueado_pedido: boolean;
  inadimplente: boolean;
  observacoes: string | null;
  ativo: boolean;
}

export interface Pedido {
  id: string;
  numero: number;
  cliente_id: string;
  status: PedidoStatus;
  origem: PedidoOrigem;
  modalidade: PedidoModalidade;
  prioridade: number;
  valor_pedido: number;
  valor_separado: number | null;
  aceito_em: string | null;
  separacao_iniciada_em: string | null;
  separacao_pausada_em: string | null;
  separado_em: string | null;
  separador_id: string | null;
  tem_ocorrencia: boolean;
  observacoes: string | null;
  pagamento_split: PagamentoSplit | null;
  pagamento_recebido_em: string | null;
  created_at: string;
  clientes?: Pick<Cliente, 'nome' | 'nome_fantasia' | 'bloqueado_pedido' | 'inadimplente'>;
  usuarios?: { nome: string } | null;
}

export interface PedidoItem {
  id: string;
  pedido_id: string;
  produto_id: string;
  nome_snapshot: string;
  categoria_ordem: number;
  qty_pedida: number;
  qty_separada: number | null;
  status_separacao?: ItemStatusSeparacao;
  preco_unitario: number;
  separado_ok: boolean;
  produtos?: Pick<Produto, 'imagem_url' | 'nome' | 'sku'> | null;
}

export interface PedidoOcorrencia {
  id: string;
  pedido_id: string;
  tipo: 'entrega' | 'separacao' | 'outro';
  descricao: string;
  alerta_imediato: boolean;
  resolvida: boolean;
  created_at: string;
}
