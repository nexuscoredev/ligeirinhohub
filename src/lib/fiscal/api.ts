import { supabase } from '@/lib/supabase';
import type { NfceStatus } from '@/lib/pdv/types';
import { NFCE_STATUS_LABEL } from '@/lib/pdv/types';
import type {
  FiscalAmbiente,
  NotaFiscal,
  NotaFiscalLinha,
  ResumoFiscal,
  SerieFiscal,
} from '@/types/fiscal';

export async function listarSeriesFiscais(modelo?: '55' | '65') {
  let q = supabase
    .from('series_fiscais')
    .select('id, modelo, serie, numero_atual, ambiente, descricao, ativo')
    .order('modelo')
    .order('serie');

  if (modelo) q = q.eq('modelo', modelo);

  const { data, error } = await q;
  return { series: (data ?? []) as SerieFiscal[], error };
}

export async function salvarSerieFiscal(payload: {
  id?: string;
  modelo: '55' | '65';
  serie: string;
  numero_atual: number;
  ambiente: FiscalAmbiente;
  descricao?: string | null;
  ativo?: boolean;
}) {
  const row = {
    modelo: payload.modelo,
    serie: payload.serie.trim(),
    numero_atual: payload.numero_atual,
    ambiente: payload.ambiente,
    descricao: payload.descricao?.trim() || null,
    ativo: payload.ativo ?? true,
  };

  if (payload.id) {
    const { error } = await supabase.from('series_fiscais').update(row as never).eq('id', payload.id);
    return { error };
  }

  const { error } = await supabase.from('series_fiscais').insert(row as never);
  return { error };
}

export async function listarNotasFiscaisNfe(limite = 80) {
  const { data, error } = await supabase
    .from('notas_fiscais')
    .select(
      'id, pedido_id, pessoa_id, modelo, serie, numero, chave_acesso, status, valor_total, xml_url, pdf_url, protocolo, motivo_rejeicao, emitida_em, created_at, pessoas ( nome, nome_fantasia ), pedidos ( numero )',
    )
    .order('created_at', { ascending: false })
    .limit(limite);

  return { notas: (data ?? []) as NotaFiscal[], error };
}

export async function listarNotasUnificadas(limite = 100): Promise<{
  linhas: NotaFiscalLinha[];
  error: Error | null;
}> {
  const [nfeRes, pdvRes] = await Promise.all([
    listarNotasFiscaisNfe(limite),
    supabase
      .from('pedidos')
      .select(
        'id, numero, valor_pedido, created_at, nfce_status, nfce_numero, nfce_serie, nfce_chave, nfce_mensagem, nfce_emitido_em, clientes ( nome, nome_fantasia )',
      )
      .neq('nfce_status', 'nao_emitida')
      .order('created_at', { ascending: false })
      .limit(limite),
  ]);

  if (nfeRes.error) return { linhas: [], error: nfeRes.error };
  if (pdvRes.error) return { linhas: [], error: pdvRes.error };

  const linhasNfe: NotaFiscalLinha[] = nfeRes.notas.map((n) => ({
    id: n.id,
    origem: 'nfe',
    pedido_numero: n.pedidos?.numero ?? null,
    modelo: n.modelo,
    numero: String(n.numero),
    serie: n.serie,
    chave: n.chave_acesso,
    status: n.status,
    valor: n.valor_total,
    emitida_em: n.emitida_em ?? n.created_at,
    cliente: n.pessoas?.nome_fantasia ?? n.pessoas?.nome ?? null,
    mensagem: n.motivo_rejeicao,
  }));

  const linhasPdv: NotaFiscalLinha[] = (pdvRes.data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const clientes = r.clientes as { nome: string; nome_fantasia: string | null } | null;
    const status = String(r.nfce_status ?? 'nao_emitida');
    return {
      id: String(r.id),
      origem: 'pdv_nfce',
      pedido_numero: Number(r.numero),
      modelo: '65',
      numero: (r.nfce_numero as string | null) ?? null,
      serie: (r.nfce_serie as string | null) ?? null,
      chave: (r.nfce_chave as string | null) ?? null,
      status,
      valor: Number(r.valor_pedido) || 0,
      emitida_em: (r.nfce_emitido_em as string | null) ?? String(r.created_at),
      cliente: clientes?.nome_fantasia ?? clientes?.nome ?? null,
      mensagem: (r.nfce_mensagem as string | null) ?? null,
    };
  });

  const linhas = [...linhasNfe, ...linhasPdv].sort((a, b) => {
    const da = a.emitida_em ? new Date(a.emitida_em).getTime() : 0;
    const db = b.emitida_em ? new Date(b.emitida_em).getTime() : 0;
    return db - da;
  });

  return { linhas: linhas.slice(0, limite), error: null };
}

export async function resumoFiscal(): Promise<{ resumo: ResumoFiscal; error: Error | null }> {
  const { linhas, error } = await listarNotasUnificadas(500);
  if (error) {
    return {
      resumo: { emitidas: 0, autorizadas: 0, rejeitadas: 0, canceladas: 0, nfce_pdv: 0, nfe_hub: 0 },
      error,
    };
  }

  const autorizadas = linhas.filter((l) => l.status === 'autorizada').length;
  const rejeitadas = linhas.filter((l) => l.status === 'rejeitada').length;
  const canceladas = linhas.filter((l) => l.status === 'cancelada').length;

  return {
    resumo: {
      emitidas: linhas.length,
      autorizadas,
      rejeitadas,
      canceladas,
      nfce_pdv: linhas.filter((l) => l.origem === 'pdv_nfce').length,
      nfe_hub: linhas.filter((l) => l.origem === 'nfe').length,
    },
    error: null,
  };
}

export function rotuloStatusFiscal(status: string): string {
  if (status in NFCE_STATUS_LABEL) {
    return NFCE_STATUS_LABEL[status as NfceStatus];
  }
  const map: Record<string, string> = {
    rascunho: 'Rascunho',
    processando: 'Processando',
    autorizada: 'Autorizada',
    rejeitada: 'Rejeitada',
    cancelada: 'Cancelada',
    inutilizada: 'Inutilizada',
  };
  return map[status] ?? status;
}

export async function listarPedidosParaEmissaoNfe() {
  const { data, error } = await supabase
    .from('pedidos')
    .select(
      'id, numero, valor_pedido, status, tipo_documento, clientes ( nome, nome_fantasia ), operacoes_fiscais ( descricao )',
    )
    .eq('tipo_documento', 'nfe')
    .not('status', 'eq', 'orcamento')
    .order('created_at', { ascending: false })
    .limit(40);

  return { pedidos: data ?? [], error };
}

export async function emitirNfePedido(pedidoId: string): Promise<{
  nota: NotaFiscal | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('nfe-emitir', {
      body: { pedido_id: pedidoId },
    });

    if (error) {
      return { nota: null, error: new Error(error.message || 'Falha ao emitir NF-e.') };
    }

    const resp = data as { nota_id?: string; error?: string; mensagem?: string };
    if (resp.error) {
      return { nota: null, error: new Error(resp.mensagem ?? resp.error) };
    }

    if (!resp.nota_id) {
      return { nota: null, error: new Error(resp.mensagem ?? 'Resposta inválida da emissão.') };
    }

    const { data: nota, error: e2 } = await supabase
      .from('notas_fiscais')
      .select(
        'id, pedido_id, pessoa_id, modelo, serie, numero, chave_acesso, status, valor_total, xml_url, pdf_url, protocolo, motivo_rejeicao, emitida_em, created_at',
      )
      .eq('id', resp.nota_id)
      .single();

    if (e2) return { nota: null, error: e2 };
    return { nota: nota as NotaFiscal, error: null };
  } catch (e) {
    return {
      nota: null,
      error: e instanceof Error ? e : new Error('Edge Function nfe-emitir indisponível.'),
    };
  }
}
