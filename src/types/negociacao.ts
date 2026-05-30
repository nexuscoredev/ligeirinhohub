import type { PedidoStatus } from '@/types/pedidos';

export type GfTipoDocumento = 'orcamento' | 'nfce' | 'nfe';

export interface OperacaoFiscal {
  id: string;
  codigo: string;
  descricao: string;
  cfop_dentro_uf: string | null;
  cfop_fora_uf: string | null;
  ativo: boolean;
}

export interface TabelaPreco {
  id: string;
  codigo: string;
  nome: string;
  padrao: boolean;
  ativo: boolean;
}

export interface FamiliaProduto {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
}

export interface NegociacaoCabecalho {
  id: string;
  numero: number;
  cliente_id: string;
  status: PedidoStatus;
  operacao_fiscal_id: string | null;
  vendedor_id: string | null;
  tabela_preco_id: string | null;
  tipo_documento: GfTipoDocumento | null;
  desconto_total: number;
  frete_valor: number;
  valor_pedido: number;
  observacoes: string | null;
  created_at: string;
  clientes?: {
    nome: string;
    nome_fantasia: string | null;
    bloqueado_pedido: boolean;
    inadimplente: boolean;
  };
  operacoes_fiscais?: Pick<OperacaoFiscal, 'codigo' | 'descricao'> | null;
  vendedor?: { nome: string; nome_fantasia: string | null } | null;
  tabelas_preco?: Pick<TabelaPreco, 'codigo' | 'nome'> | null;
}

export interface NegociacaoItem {
  id: string;
  pedido_id: string;
  produto_id: string;
  nome_snapshot: string;
  qty_pedida: number;
  preco_unitario: number;
  produtos?: { sku: string | null; ncm: string | null };
}

export const TIPO_DOCUMENTO_LABEL: Record<GfTipoDocumento, string> = {
  orcamento: 'Orçamento',
  nfce: 'NFC-e',
  nfe: 'NF-e',
};

export const TIPOS_DOCUMENTO: GfTipoDocumento[] = ['orcamento', 'nfce', 'nfe'];

export function totalNegociacao(
  itens: Pick<NegociacaoItem, 'qty_pedida' | 'preco_unitario'>[],
  desconto: number,
  frete: number,
): number {
  const subtotal = itens.reduce((acc, i) => acc + i.qty_pedida * i.preco_unitario, 0);
  return Math.max(0, subtotal - desconto + frete);
}
