export type FiscalAmbienteConfig = 'homologacao' | 'producao';

export interface EmpresaConfig {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  inscricao_estadual: string | null;
  regime_tributario: 'simples' | 'presumido' | 'real';
  endereco: Record<string, unknown>;
  certificado_fiscal_ref: string | null;
  fiscal_ambiente: FiscalAmbienteConfig;
  envio_xml_habilitado: boolean;
  envio_xml_destino: string | null;
  envio_xml_email: string | null;
  ativo: boolean;
}

export interface CaixaConfig {
  id: string;
  numero: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}
