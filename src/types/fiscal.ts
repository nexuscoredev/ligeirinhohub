export type NotaFiscalStatus =
  | 'rascunho'
  | 'processando'
  | 'autorizada'
  | 'rejeitada'
  | 'cancelada'
  | 'inutilizada';

export type FiscalAmbiente = 'homologacao' | 'producao';

export interface SerieFiscal {
  id: string;
  modelo: '55' | '65';
  serie: string;
  numero_atual: number;
  ambiente: FiscalAmbiente;
  descricao: string | null;
  ativo: boolean;
}

export interface NotaFiscal {
  id: string;
  pedido_id: string | null;
  pessoa_id: string | null;
  modelo: '55' | '65';
  serie: string;
  numero: number;
  chave_acesso: string | null;
  status: NotaFiscalStatus;
  valor_total: number;
  xml_url: string | null;
  pdf_url: string | null;
  protocolo: string | null;
  motivo_rejeicao: string | null;
  emitida_em: string | null;
  created_at: string;
  pessoas?: { nome: string; nome_fantasia: string | null } | null;
  pedidos?: { numero: number } | null;
}

/** Linha unificada: NFC-e (PDV) ou NF-e (notas_fiscais) */
export interface NotaFiscalLinha {
  id: string;
  origem: 'pdv_nfce' | 'nfe';
  pedido_numero: number | null;
  modelo: '55' | '65';
  numero: string | null;
  serie: string | null;
  chave: string | null;
  status: string;
  valor: number;
  emitida_em: string | null;
  cliente: string | null;
  mensagem: string | null;
}

export interface ResumoFiscal {
  emitidas: number;
  autorizadas: number;
  rejeitadas: number;
  canceladas: number;
  nfce_pdv: number;
  nfe_hub: number;
}

export const NOTA_STATUS_LABEL: Record<NotaFiscalStatus, string> = {
  rascunho: 'Rascunho',
  processando: 'Processando',
  autorizada: 'Autorizada',
  rejeitada: 'Rejeitada',
  cancelada: 'Cancelada',
  inutilizada: 'Inutilizada',
};

export const MODELO_LABEL: Record<'55' | '65', string> = {
  '55': 'NF-e',
  '65': 'NFC-e',
};
