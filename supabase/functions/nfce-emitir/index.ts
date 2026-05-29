// deno-lint-ignore-file no-explicit-any
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { emitirNfce, montarPayloadNfce } from '../_shared/nuvemFiscal.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Método não suportado.' }, 405);

  try {
    const { pedido_id } = await req.json();
    if (!pedido_id) return jsonResponse({ error: 'pedido_id é obrigatório.' }, 400);

    const admin = getSupabaseAdmin();

    const { data: pedido, error: ePed } = await admin
      .from('pedidos')
      .select('id, numero, valor_pedido, cpf_consumidor, pagamento_split, nfce_status')
      .eq('id', pedido_id)
      .single();
    if (ePed || !pedido) return jsonResponse({ error: 'Pedido não encontrado.' }, 404);

    if (pedido.nfce_status === 'autorizada') {
      return jsonResponse({ error: 'NFC-e já autorizada para este pedido.' }, 409);
    }

    const { data: itens, error: eItens } = await admin
      .from('pedido_itens')
      .select('nome_snapshot, qty_pedida, preco_unitario, produtos ( sku )')
      .eq('pedido_id', pedido_id);
    if (eItens) return jsonResponse({ error: 'Falha ao carregar itens.' }, 500);

    await admin.from('pedidos').update({ nfce_status: 'processando' }).eq('id', pedido_id);

    const payload = montarPayloadNfce(pedido as any, (itens ?? []) as any[]);
    const resp = await emitirNfce(payload);

    await admin
      .from('pedidos')
      .update({
        nfce_status: resp.status,
        nfce_chave: resp.chave,
        nfce_numero: resp.numero,
        nfce_serie: resp.serie,
        nfce_protocolo: resp.protocolo,
        nfce_qrcode: resp.qrcode,
        nfce_xml_url: resp.xml_url,
        nfce_danfe_url: resp.danfe_url,
        nfce_mensagem: resp.mensagem,
        nfce_ref: resp.id,
        nfce_emitido_em: resp.status === 'autorizada' ? new Date().toISOString() : null,
      })
      .eq('id', pedido_id);

    return jsonResponse(resp, resp.status === 'autorizada' ? 200 : 422);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erro interno.' }, 500);
  }
});
