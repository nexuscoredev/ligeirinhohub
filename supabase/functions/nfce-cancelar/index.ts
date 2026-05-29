// deno-lint-ignore-file no-explicit-any
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { cancelarNfce } from '../_shared/nuvemFiscal.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Método não suportado.' }, 405);

  try {
    const { pedido_id, justificativa } = await req.json();
    if (!pedido_id) return jsonResponse({ error: 'pedido_id é obrigatório.' }, 400);
    if (!justificativa || String(justificativa).trim().length < 15) {
      return jsonResponse(
        { error: 'A justificativa de cancelamento deve ter ao menos 15 caracteres.' },
        400,
      );
    }

    const admin = getSupabaseAdmin();
    const { data: pedido, error } = await admin
      .from('pedidos')
      .select('id, nfce_ref, nfce_status')
      .eq('id', pedido_id)
      .single();
    if (error || !pedido) return jsonResponse({ error: 'Pedido não encontrado.' }, 404);
    if (pedido.nfce_status !== 'autorizada') {
      return jsonResponse({ error: 'Só é possível cancelar NFC-e autorizada.' }, 409);
    }
    if (!pedido.nfce_ref) return jsonResponse({ error: 'Pedido sem referência fiscal.' }, 400);

    const resp = await cancelarNfce(pedido.nfce_ref as string, String(justificativa).trim());

    await admin
      .from('pedidos')
      .update({
        nfce_status: resp.status,
        nfce_mensagem: resp.mensagem,
      })
      .eq('id', pedido_id);

    return jsonResponse(resp);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erro interno.' }, 500);
  }
});
