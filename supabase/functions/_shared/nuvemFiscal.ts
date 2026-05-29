// deno-lint-ignore-file no-explicit-any
// Integração com o provedor fiscal Nuvem Fiscal (NFC-e modelo 65).
// Docs: https://dev.nuvemfiscal.com.br/docs/api
//
// Segredos esperados (supabase secrets set ...):
//   NUVEM_FISCAL_CLIENT_ID, NUVEM_FISCAL_CLIENT_SECRET
//   NFCE_AMBIENTE = "homologacao" | "producao"
//   EMITENTE_CPF_CNPJ        (CNPJ do emitente, só dígitos)
//   EMITENTE_CRT             (1=Simples Nacional, 3=Regime Normal) — default 1
//   NFCE_SERIE               (default 1)
//   NFCE_CUF                 (código UF IBGE, ex.: 35 = SP)
//   EMITENTE_CMUN            (código município IBGE do emitente)
//   NFCE_CFOP_PADRAO         (default 5102)
//   NFCE_NCM_PADRAO          (default 22030000)
//   NFCE_CSOSN_PADRAO        (default 102)
//   NFCE_ORIGEM_PADRAO       (default 0)
//
// Observação: o certificado A1 e o CSC/idCSC NFC-e devem estar cadastrados na
// empresa dentro da Nuvem Fiscal (uma vez), via painel ou API /empresas.

const AUTH_URL = 'https://auth.nuvemfiscal.com.br/oauth/token';

function baseUrl(): string {
  // A Nuvem Fiscal usa o mesmo host; o ambiente (homologação/produção) é
  // definido no corpo da nota (tpAmb).
  return Deno.env.get('NUVEM_FISCAL_BASE_URL') ?? 'https://api.nuvemfiscal.com.br';
}

function tpAmb(): number {
  return (Deno.env.get('NFCE_AMBIENTE') ?? 'homologacao') === 'producao' ? 1 : 2;
}

let cachedToken: { token: string; exp: number } | null = null;

export async function getToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.exp > now + 30_000) return cachedToken.token;

  const clientId = Deno.env.get('NUVEM_FISCAL_CLIENT_ID');
  const clientSecret = Deno.env.get('NUVEM_FISCAL_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error('NUVEM_FISCAL_CLIENT_ID / NUVEM_FISCAL_CLIENT_SECRET não configurados.');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'nfce',
  });

  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    throw new Error(`Falha ao autenticar na Nuvem Fiscal (${res.status}).`);
  }
  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    exp: now + (Number(data.expires_in) || 3600) * 1000,
  };
  return cachedToken.token;
}

const FORMA_PARA_TPAG: Record<string, string> = {
  dinheiro: '01',
  cartao_credito: '03',
  cartao_debito: '04',
  pix: '17',
};

interface PedidoFiscal {
  numero: number;
  valor_pedido: number;
  cpf_consumidor: string | null;
  pagamento_split: { forma: string; valor: number }[] | null;
}

interface ItemFiscal {
  nome_snapshot: string;
  qty_pedida: number;
  preco_unitario: number;
  produtos?: { sku: string | null } | null;
}

/** Monta o payload de NFC-e a partir do pedido e itens. */
export function montarPayloadNfce(pedido: PedidoFiscal, itens: ItemFiscal[]) {
  const cnpj = (Deno.env.get('EMITENTE_CPF_CNPJ') ?? '').replace(/\D/g, '');
  const serie = Number(Deno.env.get('NFCE_SERIE') ?? '1');
  const cUF = Number(Deno.env.get('NFCE_CUF') ?? '35');
  const cMun = Number(Deno.env.get('EMITENTE_CMUN') ?? '0');
  const crt = Number(Deno.env.get('EMITENTE_CRT') ?? '1');
  const cfop = Deno.env.get('NFCE_CFOP_PADRAO') ?? '5102';
  const ncm = Deno.env.get('NFCE_NCM_PADRAO') ?? '22030000';
  const csosn = Deno.env.get('NFCE_CSOSN_PADRAO') ?? '102';
  const origem = Deno.env.get('NFCE_ORIGEM_PADRAO') ?? '0';

  const det = itens.map((it, idx) => {
    const qtd = Number(it.qty_pedida) || 0;
    const vUn = Number(it.preco_unitario) || 0;
    const vProd = Math.round(qtd * vUn * 100) / 100;
    const icms =
      crt === 1
        ? { ICMSSN102: { orig: origem, CSOSN: csosn } }
        : { ICMS00: { orig: origem, CST: '00', modBC: 3, vBC: vProd, pICMS: 0, vICMS: 0 } };
    return {
      nItem: idx + 1,
      prod: {
        cProd: it.produtos?.sku ?? String(idx + 1),
        cEAN: 'SEM GTIN',
        xProd: it.nome_snapshot,
        NCM: ncm,
        CFOP: cfop,
        uCom: 'UN',
        qCom: qtd,
        vUnCom: vUn,
        vProd,
        cEANTrib: 'SEM GTIN',
        uTrib: 'UN',
        qTrib: qtd,
        vUnTrib: vUn,
        indTot: 1,
      },
      imposto: { ICMS: icms },
    };
  });

  const vTotal = Math.round((Number(pedido.valor_pedido) || 0) * 100) / 100;

  const detPag = (pedido.pagamento_split ?? []).map((p) => ({
    tPag: FORMA_PARA_TPAG[p.forma] ?? '99',
    vPag: Math.round((Number(p.valor) || 0) * 100) / 100,
  }));
  if (detPag.length === 0) detPag.push({ tPag: '01', vPag: vTotal });

  const dest =
    pedido.cpf_consumidor && pedido.cpf_consumidor.replace(/\D/g, '').length === 11
      ? { CPF: pedido.cpf_consumidor.replace(/\D/g, '') }
      : undefined;

  return {
    infNFe: {
      versao: '4.00',
      ide: {
        cUF,
        natOp: 'VENDA AO CONSUMIDOR',
        mod: 65,
        serie,
        nNF: pedido.numero,
        dhEmi: new Date().toISOString(),
        tpNF: 1,
        idDest: 1,
        cMunFG: cMun,
        tpImp: 4,
        tpEmis: 1,
        tpAmb: tpAmb(),
        finNFe: 1,
        indFinal: 1,
        indPres: 1,
      },
      emit: { CNPJ: cnpj },
      ...(dest ? { dest } : {}),
      det,
      total: {
        ICMSTot: {
          vBC: 0,
          vICMS: 0,
          vProd: vTotal,
          vNF: vTotal,
          vTotTrib: 0,
        },
      },
      transp: { modFrete: 9 },
      pag: { detPag },
    },
  };
}

interface RespostaNfce {
  status: string;
  chave: string | null;
  numero: string | null;
  serie: string | null;
  protocolo: string | null;
  qrcode: string | null;
  xml_url: string | null;
  danfe_url: string | null;
  mensagem: string | null;
  id?: string | null;
}

function mapStatus(autorizada: boolean, raw: string | undefined): string {
  if (autorizada) return 'autorizada';
  const s = (raw ?? '').toLowerCase();
  if (s.includes('cancel')) return 'cancelada';
  if (s.includes('process') || s.includes('pendente')) return 'processando';
  if (s.includes('conting')) return 'contingencia';
  return 'rejeitada';
}

function parseResposta(data: any): RespostaNfce {
  const aut = data?.autorizacao ?? data;
  const statusRaw: string = data?.status ?? aut?.status ?? '';
  const autorizada = statusRaw === 'autorizado' || statusRaw === 'autorizada';
  return {
    status: mapStatus(autorizada, statusRaw),
    chave: data?.chave ?? aut?.chave ?? null,
    numero: data?.numero != null ? String(data.numero) : null,
    serie: data?.serie != null ? String(data.serie) : null,
    protocolo: aut?.numero_protocolo ?? data?.protocolo ?? null,
    qrcode: data?.qrcode ?? aut?.qrcode ?? null,
    xml_url: data?.links?.find?.((l: any) => /xml/i.test(l?.rel ?? ''))?.href ?? null,
    danfe_url: data?.links?.find?.((l: any) => /pdf|danfe/i.test(l?.rel ?? ''))?.href ?? null,
    mensagem: data?.motivo ?? aut?.motivo_status ?? data?.message ?? null,
    id: data?.id ?? null,
  };
}

export async function emitirNfce(payload: unknown): Promise<RespostaNfce> {
  const token = await getToken();
  const res = await fetch(`${baseUrl()}/nfce`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      status: 'rejeitada',
      chave: null,
      numero: null,
      serie: null,
      protocolo: null,
      qrcode: null,
      xml_url: null,
      danfe_url: null,
      mensagem: data?.message ?? data?.error ?? `Erro ${res.status} na emissão.`,
      id: null,
    };
  }
  return parseResposta(data);
}

export async function consultarNfce(id: string): Promise<RespostaNfce> {
  const token = await getToken();
  const res = await fetch(`${baseUrl()}/nfce/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  return parseResposta(data);
}

export async function cancelarNfce(id: string, justificativa: string): Promise<RespostaNfce> {
  const token = await getToken();
  const res = await fetch(`${baseUrl()}/nfce/${id}/cancelamento`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ justificativa }),
  });
  const data = await res.json().catch(() => ({}));
  const parsed = parseResposta(data);
  if (res.ok) parsed.status = 'cancelada';
  return parsed;
}

export type { RespostaNfce };
