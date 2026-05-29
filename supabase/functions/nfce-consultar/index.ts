// deno-lint-ignore-file no-explicit-any
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { consultarNfce } from '../_shared/nuvemFiscal.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Método não suportado.' }, 405);

  try {
    const { pedido_id } = await req.json();
    if (!pedido_id) return jsonResponse({ error: 'pedido_id é obrigatório.' }, 400);

    const admin = getSupabaseAdmin();
    const { data: pedido, error } = await admin
      .from('pedidos')
      .select('id, nfce_ref, nfce_status')
      .eq('id', pedido_id)
      .single();
    if (error || !pedido) return jsonResponse({ error: 'Pedido não encontrado.' }, 404);
    if (!pedido.nfce_ref) return jsonResponse({ error: 'Pedido sem referência fiscal.' }, 400);

    const resp = await consultarNfce(pedido.nfce_ref as string);

    await admin
      .from('pedidos')
      .update({
        nfce_status: resp.status,
        nfce_chave: resp.chave,
        nfce_protocolo: resp.protocolo,
        nfce_qrcode: resp.qrcode,
        nfce_xml_url: resp.xml_url,
        nfce_danfe_url: resp.danfe_url,
        nfce_mensagem: resp.mensagem,
      })
      .eq('id', pedido_id);

    return jsonResponse(resp);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erro interno.' }, 500);
  }
});
