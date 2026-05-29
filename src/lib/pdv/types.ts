import type { FormaPagamento } from '@/types/pedidos';

/** Produto no PDV — mesma base do Admin → Produtos (`catalogo.json`). */
export interface ProdutoPdv {
  /** Identificador de catálogo (SKU Anota) — usado na UI antes do sync no banco. */
  id: string;
  sku: string;
  nome: string;
  preco_base: number;
  imagem_url: string | null;
  categoria_slug: string;
  categoria_nome: string;
  categoria_ordem: number;
  /** Código para leitor/busca (SKU do catálogo). */
  codigo_barras: string | null;
  unidade: string;
  preco_atacado: number | null;
}

/** Linha do cupom de venda em construção. */
export interface LinhaVenda {
  /** Sequência visível (ITEM 1, 2, 3...) */
  seq: number;
  sku: string;
  codigo: string;
  produto_id: string;
  descricao: string;
  unidade: string;
  preco_unitario: number;
  categoria_ordem: number;
  qty: number;
}

export type NfceStatus =
  | 'nao_emitida'
  | 'processando'
  | 'autorizada'
  | 'rejeitada'
  | 'cancelada'
  | 'contingencia';

export const NFCE_STATUS_LABEL: Record<NfceStatus, string> = {
  nao_emitida: 'Não emitida',
  processando: 'Processando',
  autorizada: 'Autorizada',
  rejeitada: 'Rejeitada',
  cancelada: 'Cancelada',
  contingencia: 'Contingência',
};

export type CaixaTurnoStatus = 'aberto' | 'fechado';

export type CaixaMovimentoTipo =
  | 'abertura'
  | 'suprimento'
  | 'sangria'
  | 'retirada'
  | 'fechamento';

export const CAIXA_MOVIMENTO_LABEL: Record<CaixaMovimentoTipo, string> = {
  abertura: 'Abertura',
  suprimento: 'Suprimento (entrada)',
  sangria: 'Sangria (retirada)',
  retirada: 'Retirada',
  fechamento: 'Fechamento',
};

export interface CaixaTurno {
  id: string;
  caixa_numero: number;
  operador_id: string;
  status: CaixaTurnoStatus;
  valor_abertura: number;
  valor_fechamento_informado: number | null;
  valor_fechamento_apurado: number | null;
  aberto_em: string;
  fechado_em: string | null;
  observacoes: string | null;
}

export interface CaixaMovimento {
  id: string;
  turno_id: string;
  tipo: CaixaMovimentoTipo;
  valor: number;
  motivo: string | null;
  usuario_id: string | null;
  created_at: string;
}

/** Resumo de venda apurado por forma de pagamento (Leitura X / Resumo diário). */
export type ResumoPorForma = Record<FormaPagamento, number>;
