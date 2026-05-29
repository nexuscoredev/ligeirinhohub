import { supabase } from '@/lib/supabase';
import type { NfceStatus } from '@/lib/pdv/types';

export interface ResultadoFiscal {
  status: NfceStatus;
  chave: string | null;
  numero: string | null;
  serie: string | null;
  protocolo: string | null;
  qrcode: string | null;
  xml_url: string | null;
  danfe_url: string | null;
  mensagem: string | null;
}

const FISCAL_DESABILITADO_MSG =
  'Emissão fiscal não configurada (Edge Function nfce-emitir indisponível). A venda foi registrada sem NFC-e.';

function normalizar(data: unknown): ResultadoFiscal {
  const d = (data ?? {}) as Partial<ResultadoFiscal>;
  return {
    status: (d.status as NfceStatus) ?? 'rejeitada',
    chave: d.chave ?? null,
    numero: d.numero ?? null,
    serie: d.serie ?? null,
    protocolo: d.protocolo ?? null,
    qrcode: d.qrcode ?? null,
    xml_url: d.xml_url ?? null,
    danfe_url: d.danfe_url ?? null,
    mensagem: d.mensagem ?? null,
  };
}

/**
 * Emite a NFC-e de um pedido chamando a Edge Function `nfce-emitir`,
 * que conversa com o provedor fiscal (Nuvem Fiscal). A própria função
 * persiste o resultado em `pedidos`; aqui só repassamos o retorno.
 *
 * Falha graciosamente quando a função não está implantada/configurada,
 * para não travar a operação do caixa.
 */
export async function emitirNfce(pedidoId: string): Promise<{
  resultado: ResultadoFiscal | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('nfce-emitir', {
      body: { pedido_id: pedidoId },
    });
    if (error) {
      return {
        resultado: { ...normalizar(null), status: 'nao_emitida', mensagem: FISCAL_DESABILITADO_MSG },
        error: new Error(error.message || FISCAL_DESABILITADO_MSG),
      };
    }
    return { resultado: normalizar(data), error: null };
  } catch (e) {
    return {
      resultado: { ...normalizar(null), status: 'nao_emitida', mensagem: FISCAL_DESABILITADO_MSG },
      error: e instanceof Error ? e : new Error(FISCAL_DESABILITADO_MSG),
    };
  }
}

export async function cancelarNfce(pedidoId: string, justificativa: string): Promise<{
  resultado: ResultadoFiscal | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('nfce-cancelar', {
      body: { pedido_id: pedidoId, justificativa },
    });
    if (error) return { resultado: null, error: new Error(error.message) };
    return { resultado: normalizar(data), error: null };
  } catch (e) {
    return { resultado: null, error: e instanceof Error ? e : new Error('Falha ao cancelar NFC-e.') };
  }
}

export async function consultarNfce(pedidoId: string): Promise<{
  resultado: ResultadoFiscal | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('nfce-consultar', {
      body: { pedido_id: pedidoId },
    });
    if (error) return { resultado: null, error: new Error(error.message) };
    return { resultado: normalizar(data), error: null };
  } catch (e) {
    return { resultado: null, error: e instanceof Error ? e : new Error('Falha ao consultar NFC-e.') };
  }
}
