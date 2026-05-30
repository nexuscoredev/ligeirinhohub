// deno-lint-ignore-file no-explicit-any
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { emitirNfe, montarPayloadNfe } from '../_shared/nuvemFiscal.ts';
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Método não suportado.' }, 405);

  try {
    const { pedido_id } = await req.json();
    if (!pedido_id) return jsonResponse({ error: 'pedido_id é obrigatório.' }, 400);

    const admin = getSupabaseAdmin();

    const { data: pedido, error: ePed } = await admin
      .from('pedidos')
      .select(
        'id, numero, valor_pedido, cliente_id, clientes ( nome, nome_fantasia, pessoa_id )',
      )
      .eq('id', pedido_id)
      .single();

    if (ePed || !pedido) return jsonResponse({ error: 'Pedido não encontrado.' }, 404);

    const { data: existente } = await admin
      .from('notas_fiscais')
      .select('id, status')
      .eq('pedido_id', pedido_id)
      .eq('status', 'autorizada')
      .maybeSingle();

    if (existente) {
      return jsonResponse({ error: 'NF-e já autorizada para este pedido.' }, 409);
    }

    const { data: itens, error: eItens } = await admin
      .from('pedido_itens')
      .select('nome_snapshot, qty_pedida, preco_unitario, produto_id, produtos ( sku, ncm )')
      .eq('pedido_id', pedido_id);

    if (eItens || !itens?.length) {
      return jsonResponse({ error: 'Pedido sem itens para emissão.' }, 400);
    }

    const ambiente = (Deno.env.get('NFCE_AMBIENTE') ?? 'homologacao') === 'producao'
      ? 'producao'
      : 'homologacao';

    const { data: serieRow, error: eSerie } = await admin
      .from('series_fiscais')
      .select('id, serie, numero_atual')
      .eq('modelo', '55')
      .eq('ambiente', ambiente)
      .eq('ativo', true)
      .order('serie')
      .limit(1)
      .maybeSingle();

    if (eSerie || !serieRow) {
      return jsonResponse({ error: 'Série NF-e não configurada (series_fiscais).' }, 500);
    }

    const proximoNumero = Number(serieRow.numero_atual) + 1;
    const cliente = (pedido as any).clientes;
    const pessoaId = cliente?.pessoa_id ?? null;

    const { data: notaInsert, error: eNota } = await admin
      .from('notas_fiscais')
      .insert({
        pedido_id,
        pessoa_id: pessoaId,
        modelo: '55',
        serie: serieRow.serie,
        numero: proximoNumero,
        status: 'processando',
        valor_total: pedido.valor_pedido,
        ambiente,
      })
      .select('id')
      .single();

    if (eNota || !notaInsert) {
      return jsonResponse({ error: 'Falha ao registrar nota fiscal.' }, 500);
    }

    const itensRows = (itens as any[]).map((it) => ({
      nota_fiscal_id: notaInsert.id,
      produto_id: it.produto_id,
      descricao: it.nome_snapshot,
      ncm: it.produtos?.ncm ?? null,
      cfop: null,
      cst: null,
      quantidade: it.qty_pedida,
      valor_unitario: it.preco_unitario,
      valor_total: Number(it.qty_pedida) * Number(it.preco_unitario),
    }));

    await admin.from('notas_fiscais_itens').insert(itensRows);

    let resp;
    try {
      const payload = montarPayloadNfe(
        pedido as any,
        itens as any[],
        { nome: cliente?.nome_fantasia ?? cliente?.nome },
      );
      payload.infNFe.ide.nNF = proximoNumero;
      payload.infNFe.ide.serie = Number(serieRow.serie);
      resp = await emitirNfe(payload);
    } catch (e) {
      resp = {
        status: 'rejeitada',
        chave: null,
        numero: String(proximoNumero),
        serie: serieRow.serie,
        protocolo: null,
        qrcode: null,
        xml_url: null,
        danfe_url: null,
        mensagem: e instanceof Error ? e.message : 'Nuvem Fiscal não configurada.',
        id: null,
      };
    }

    const statusMap: Record<string, string> = {
      autorizada: 'autorizada',
      rejeitada: 'rejeitada',
      processando: 'processando',
      cancelada: 'cancelada',
    };

    await admin
      .from('notas_fiscais')
      .update({
        status: statusMap[resp.status] ?? 'rejeitada',
        chave_acesso: resp.chave,
        protocolo: resp.protocolo,
        xml_url: resp.xml_url,
        pdf_url: resp.danfe_url,
        motivo_rejeicao: resp.status === 'autorizada' ? null : resp.mensagem,
        nuvem_fiscal_id: resp.id,
        emitida_em: resp.status === 'autorizada' ? new Date().toISOString() : null,
      })
      .eq('id', notaInsert.id);

    if (resp.status === 'autorizada') {
      await admin
        .from('series_fiscais')
        .update({ numero_atual: proximoNumero })
        .eq('id', serieRow.id);
    }

    return jsonResponse({
      nota_id: notaInsert.id,
      status: resp.status,
      mensagem: resp.mensagem,
      error: resp.status === 'autorizada' ? undefined : 'emissao_falhou',
    }, resp.status === 'autorizada' ? 200 : 422);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Erro interno.' }, 500);
  }
});
