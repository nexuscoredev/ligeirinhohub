import { supabase } from '@/lib/supabase';
import type { CaixaConfig, EmpresaConfig, FiscalAmbienteConfig } from '@/types/config';

const SELECT_EMPRESA =
  'id, razao_social, nome_fantasia, cnpj, inscricao_estadual, regime_tributario, endereco, certificado_fiscal_ref, fiscal_ambiente, envio_xml_habilitado, envio_xml_destino, envio_xml_email, ativo';

export async function buscarEmpresaConfig(): Promise<{
  empresa: EmpresaConfig | null;
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from('empresa_config')
    .select(SELECT_EMPRESA)
    .eq('ativo', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) return { empresa: null, error };
  return { empresa: (data as EmpresaConfig | null) ?? null, error: null };
}

export async function salvarEmpresaConfig(payload: {
  id?: string;
  razao_social: string;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  inscricao_estadual?: string | null;
  regime_tributario: EmpresaConfig['regime_tributario'];
  certificado_fiscal_ref?: string | null;
  fiscal_ambiente?: FiscalAmbienteConfig;
  envio_xml_habilitado?: boolean;
  envio_xml_destino?: string | null;
  envio_xml_email?: string | null;
}) {
  const row = {
    razao_social: payload.razao_social.trim(),
    nome_fantasia: payload.nome_fantasia?.trim() || null,
    cnpj: payload.cnpj?.replace(/\D/g, '') || null,
    inscricao_estadual: payload.inscricao_estadual?.trim() || null,
    regime_tributario: payload.regime_tributario,
    certificado_fiscal_ref: payload.certificado_fiscal_ref?.trim() || null,
    fiscal_ambiente: payload.fiscal_ambiente ?? 'homologacao',
    envio_xml_habilitado: payload.envio_xml_habilitado ?? false,
    envio_xml_destino: payload.envio_xml_destino?.trim() || null,
    envio_xml_email: payload.envio_xml_email?.trim() || null,
    ativo: true,
  };

  if (payload.id) {
    const { error } = await supabase.from('empresa_config').update(row as never).eq('id', payload.id);
    return { error };
  }

  const { data, error } = await supabase
    .from('empresa_config')
    .insert(row as never)
    .select(SELECT_EMPRESA)
    .single();

  return { empresa: (data as EmpresaConfig | null) ?? null, error };
}

export async function listarCaixasConfig() {
  const { data, error } = await supabase
    .from('caixas_config')
    .select('id, numero, nome, descricao, ativo')
    .order('numero');

  return { caixas: (data ?? []) as CaixaConfig[], error };
}

export async function salvarCaixaConfig(payload: {
  id?: string;
  numero: number;
  nome: string;
  descricao?: string | null;
  ativo?: boolean;
}) {
  const row = {
    numero: payload.numero,
    nome: payload.nome.trim(),
    descricao: payload.descricao?.trim() || null,
    ativo: payload.ativo ?? true,
  };

  if (payload.id) {
    const { error } = await supabase.from('caixas_config').update(row as never).eq('id', payload.id);
    return { error };
  }

  const { error } = await supabase.from('caixas_config').insert(row as never);
  return { error };
}

export async function salvarEnvioXml(payload: {
  id: string;
  envio_xml_habilitado: boolean;
  envio_xml_destino?: string | null;
  envio_xml_email?: string | null;
  certificado_fiscal_ref?: string | null;
  fiscal_ambiente?: FiscalAmbienteConfig;
}) {
  const { error } = await supabase
    .from('empresa_config')
    .update({
      envio_xml_habilitado: payload.envio_xml_habilitado,
      envio_xml_destino: payload.envio_xml_destino?.trim() || null,
      envio_xml_email: payload.envio_xml_email?.trim() || null,
      certificado_fiscal_ref: payload.certificado_fiscal_ref?.trim() || null,
      fiscal_ambiente: payload.fiscal_ambiente ?? 'homologacao',
    } as never)
    .eq('id', payload.id);

  return { error };
}
