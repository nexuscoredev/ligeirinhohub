/** Formato do export JSON do Gestão Fácil → HUB (scripts/migracao-gf/data/export-gf.json) */

export interface ExportGf {
  versao: string;
  exportado_em?: string;
  empresa_config?: EmpresaGf[];
  formas_pagamento?: FormaPagamentoGf[];
  tipos_conta?: TipoContaGf[];
  motivos?: MotivoGf[];
  operacoes_fiscais?: OperacaoFiscalGf[];
  familias_produto?: FamiliaProdutoGf[];
  categorias_produto?: CategoriaProdutoGf[];
  produtos?: ProdutoGf[];
  pessoas?: PessoaGf[];
  tabelas_preco?: TabelaPrecoGf[];
  tabelas_preco_itens?: TabelaPrecoItemGf[];
  series_fiscais?: SerieFiscalGf[];
  estoque_saldos?: EstoqueSaldoGf[];
  pedidos_abertos?: PedidoAbertoGf[];
  notas_fiscais?: NotaFiscalGf[];
  contas_abertas?: ContaAbertaGf[];
}

export interface LegacyRow {
  legacy_gf_id: string;
}

export interface EmpresaGf extends LegacyRow {
  razao_social: string;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  inscricao_estadual?: string | null;
  regime_tributario?: 'simples' | 'presumido' | 'real';
  endereco?: Record<string, unknown>;
  certificado_fiscal_ref?: string | null;
}

export interface FormaPagamentoGf extends LegacyRow {
  codigo: string;
  nome: string;
  tipo: string;
  gera_conta_receber?: boolean;
  dias_prazo?: number;
  ativo?: boolean;
}

export interface TipoContaGf extends LegacyRow {
  codigo: string;
  nome: string;
  natureza: 'receita' | 'despesa';
  ativo?: boolean;
}

export interface MotivoGf extends LegacyRow {
  codigo: string;
  descricao: string;
  tipo: string;
  ativo?: boolean;
}

export interface OperacaoFiscalGf extends LegacyRow {
  codigo: string;
  descricao: string;
  cfop_dentro_uf?: string | null;
  cfop_fora_uf?: string | null;
  ativo?: boolean;
}

export interface FamiliaProdutoGf extends LegacyRow {
  nome: string;
  ordem?: number;
  ativo?: boolean;
}

export interface CategoriaProdutoGf extends LegacyRow {
  nome: string;
  slug: string;
  ordem_separacao?: number;
}

export interface ProdutoGf extends LegacyRow {
  categoria_legacy_gf_id: string;
  nome: string;
  sku?: string | null;
  preco_base?: number;
  imagem_url?: string | null;
  ncm?: string | null;
  ean?: string | null;
  ativo?: boolean;
}

export interface PessoaGf extends LegacyRow {
  tipos: Array<'cliente' | 'fornecedor' | 'vendedor' | 'transportadora'>;
  nome: string;
  nome_fantasia?: string | null;
  cpf_cnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  tabela_preco?: string;
  ativo?: boolean;
}

export interface TabelaPrecoGf extends LegacyRow {
  codigo: string;
  nome: string;
  padrao?: boolean;
  ativo?: boolean;
}

export interface TabelaPrecoItemGf {
  tabela_legacy_gf_id: string;
  produto_legacy_gf_id: string;
  preco: number;
}

export interface SerieFiscalGf extends LegacyRow {
  modelo: '55' | '65';
  serie: string;
  numero_atual?: number;
  ambiente?: 'homologacao' | 'producao';
  ativo?: boolean;
}

export interface EstoqueSaldoGf {
  deposito_legacy_gf_id?: string;
  produto_legacy_gf_id: string;
  quantidade: number;
}

export interface PedidoAbertoGf extends LegacyRow {
  cliente_legacy_gf_id: string;
  status?: string;
  origem?: string;
  modalidade?: string;
  valor_pedido?: number;
  itens?: Array<{
    produto_legacy_gf_id: string;
    nome: string;
    qty: number;
    preco_unitario: number;
  }>;
}

export interface NotaFiscalGf extends LegacyRow {
  modelo?: string;
  serie: string;
  numero: number;
  status?: string;
  valor_total?: number;
  chave_acesso?: string | null;
}

export interface ContaAbertaGf extends LegacyRow {
  natureza: 'receber' | 'pagar';
  descricao: string;
  valor_saldo: number;
  data_vencimento: string;
  pessoa_legacy_gf_id?: string | null;
}

export interface ResultadoEtapa {
  etapa: string;
  ok: number;
  erros: string[];
}

export type ModoMigracao = 'dry_run' | 'apply';
