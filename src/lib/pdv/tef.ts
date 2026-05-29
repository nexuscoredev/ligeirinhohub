import type { FormaPagamento } from '@/types/pedidos';

/**
 * Cliente TEF para pagamento com cartão via agente local.
 *
 * Navegador não acessa o pinpad diretamente. O padrão para PDV web é um
 * "agente TEF" rodando na máquina do caixa, exposto em loopback
 * (ex.: http://127.0.0.1:PORTA), compatível com PayGo Integrado / SiTef.
 *
 * Configure a URL do agente em `VITE_TEF_AGENTE_URL`. Quando não houver
 * agente (ou em ambiente https que bloqueie mixed-content), o cliente cai
 * em "modo manual" — a confirmação do cartão é feita pelo operador.
 */

const AGENTE_URL = import.meta.env.VITE_TEF_AGENTE_URL as string | undefined;

export type ResultadoTef =
  | { ok: true; modo: 'tef'; nsu: string; bandeira: string | null; autorizacao: string | null }
  | { ok: true; modo: 'manual' }
  | { ok: false; cancelado: boolean; mensagem: string };

const FORMA_PARA_TEF: Partial<Record<FormaPagamento, 'credito' | 'debito'>> = {
  cartao_credito: 'credito',
  cartao_debito: 'debito',
};

export function tefConfigurado(): boolean {
  return Boolean(AGENTE_URL);
}

export function exigeTef(forma: FormaPagamento): boolean {
  return forma === 'cartao_credito' || forma === 'cartao_debito';
}

async function chamarAgente(path: string, body: unknown): Promise<Response> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 120_000);
  try {
    return await fetch(`${AGENTE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
}

/** Inicia uma transação de cartão no pinpad via agente local. */
export async function iniciarPagamentoTef(
  forma: FormaPagamento,
  valor: number,
  parcelas = 1,
): Promise<ResultadoTef> {
  if (!AGENTE_URL) return { ok: true, modo: 'manual' };
  const tipo = FORMA_PARA_TEF[forma];
  if (!tipo) return { ok: true, modo: 'manual' };

  try {
    const res = await chamarAgente('/tef/pagamento', {
      tipo,
      valor: Math.round(valor * 100),
      parcelas,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        cancelado: data?.cancelado ?? false,
        mensagem: data?.mensagem ?? `Falha no TEF (${res.status}).`,
      };
    }
    return {
      ok: true,
      modo: 'tef',
      nsu: data?.nsu ?? '',
      bandeira: data?.bandeira ?? null,
      autorizacao: data?.autorizacao ?? null,
    };
  } catch (e) {
    return {
      ok: false,
      cancelado: false,
      mensagem:
        e instanceof Error && e.name === 'AbortError'
          ? 'Tempo esgotado aguardando o pinpad.'
          : 'Agente TEF não respondeu (verifique se está em execução).',
    };
  }
}

/** Cancela a última operação TEF (estorno/desfazimento). */
export async function cancelarOperacaoTef(): Promise<{ ok: boolean; mensagem: string }> {
  if (!AGENTE_URL) return { ok: true, mensagem: 'Sem agente TEF — nada a cancelar.' };
  try {
    const res = await chamarAgente('/tef/cancelamento', {});
    const data = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      mensagem: data?.mensagem ?? (res.ok ? 'Operação TEF cancelada.' : 'Falha ao cancelar TEF.'),
    };
  } catch {
    return { ok: false, mensagem: 'Agente TEF não respondeu.' };
  }
}

/** Solicita abertura da gaveta de dinheiro pelo agente local (se houver). */
export async function abrirGaveta(): Promise<{ ok: boolean; mensagem: string }> {
  if (!AGENTE_URL) return { ok: false, mensagem: 'Sem agente local para abrir a gaveta.' };
  try {
    const res = await chamarAgente('/gaveta/abrir', {});
    return {
      ok: res.ok,
      mensagem: res.ok ? 'Gaveta aberta.' : 'Falha ao abrir a gaveta.',
    };
  } catch {
    return { ok: false, mensagem: 'Agente local não respondeu.' };
  }
}
