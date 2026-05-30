import { resumoEstoque } from '@/lib/estoque/api';
import { resumoFinanceiro } from '@/lib/financeiro/api';
import { resumoFiscal } from '@/lib/fiscal/api';
import { formatarMoeda } from '@/lib/pedidos/constants';
import { supabase } from '@/lib/supabase';
import type {
  ResumoGerencial,
  VendaMensalFiscal,
  VendaPorHora,
} from '@/types/relatorios';

const STATUS_VENDA = ['concluido', 'entregue', 'retirado'] as const;

function inicioDoDiaIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function resumoVazio(): ResumoGerencial {
  return {
    vendas_hoje_qtd: 0,
    vendas_hoje_valor: 0,
    ticket_medio: 0,
    receber_aberto: 0,
    pagar_aberto: 0,
    receber_vencido: 0,
    pagar_vencido: 0,
    lotes_vencendo: 0,
    nfe_autorizadas: 0,
    nfce_autorizadas: 0,
    estoque_critico: 0,
    clientes_ativos: 0,
  };
}

export async function resumoGerencial(): Promise<{
  resumo: ResumoGerencial;
  error: Error | null;
}> {
  const hoje = inicioDoDiaIso();

  const [vendasRes, finRes, estRes, fisRes, clientesRes] = await Promise.all([
    supabase
      .from('pedidos')
      .select('valor_pedido')
      .in('status', [...STATUS_VENDA])
      .gte('created_at', hoje),
    resumoFinanceiro(),
    resumoEstoque(),
    resumoFiscal(),
    supabase
      .from('pessoas')
      .select('id', { count: 'exact', head: true })
      .eq('ativo', true)
      .contains('tipos', ['cliente']),
  ]);

  if (vendasRes.error) return { resumo: resumoVazio(), error: vendasRes.error };
  if (finRes.error) return { resumo: resumoVazio(), error: finRes.error };
  if (estRes.error) return { resumo: resumoVazio(), error: estRes.error };
  if (fisRes.error) return { resumo: resumoVazio(), error: fisRes.error };
  if (clientesRes.error) return { resumo: resumoVazio(), error: clientesRes.error };

  const vendas = (vendasRes.data ?? []) as { valor_pedido: number }[];
  const valorTotal = vendas.reduce((s, p) => s + Number(p.valor_pedido), 0);
  const qtd = vendas.length;

  return {
    resumo: {
      vendas_hoje_qtd: qtd,
      vendas_hoje_valor: Math.round(valorTotal * 100) / 100,
      ticket_medio: qtd ? Math.round((valorTotal / qtd) * 100) / 100 : 0,
      receber_aberto: finRes.resumo.receber_aberto,
      pagar_aberto: finRes.resumo.pagar_aberto,
      receber_vencido: finRes.resumo.receber_vencido,
      pagar_vencido: finRes.resumo.pagar_vencido,
      lotes_vencendo: estRes.resumo.lotes_vencendo,
      nfe_autorizadas: fisRes.resumo.nfe_hub,
      nfce_autorizadas: fisRes.resumo.nfce_pdv,
      estoque_critico: estRes.resumo.produtos_criticos,
      clientes_ativos: clientesRes.count ?? 0,
    },
    error: null,
  };
}

export async function vendasPorHora(data?: string): Promise<{
  linhas: VendaPorHora[];
  error: Error | null;
}> {
  const pData = data ?? new Date().toISOString().slice(0, 10);
  const { data: rows, error } = await supabase.rpc('gf_relatorio_vendas_por_hora', {
    p_data: pData,
  } as never);

  if (error) return { linhas: [], error };

  const mapa = new Map<number, VendaPorHora>();
  for (const row of (rows ?? []) as VendaPorHora[]) {
    mapa.set(row.hora, {
      hora: row.hora,
      quantidade: Number(row.quantidade),
      valor_total: Number(row.valor_total),
    });
  }

  const linhas: VendaPorHora[] = [];
  for (let h = 0; h < 24; h += 1) {
    linhas.push(
      mapa.get(h) ?? { hora: h, quantidade: 0, valor_total: 0 },
    );
  }

  return { linhas, error: null };
}

export async function vendasMensaisFiscal(meses = 12): Promise<{
  linhas: VendaMensalFiscal[];
  error: Error | null;
}> {
  const { data, error } = await supabase.rpc('gf_relatorio_vendas_mensais_fiscal', {
    p_meses: meses,
  } as never);

  if (error) return { linhas: [], error };

  const linhas = ((data ?? []) as VendaMensalFiscal[]).map((r) => ({
    mes: String(r.mes).slice(0, 10),
    nfe_quantidade: Number(r.nfe_quantidade),
    nfe_valor: Number(r.nfe_valor),
    nfce_quantidade: Number(r.nfce_quantidade),
    nfce_valor: Number(r.nfce_valor),
  }));

  return { linhas, error: null };
}

export function formatarMesCurto(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

export function formatarHora(hora: number): string {
  return `${String(hora).padStart(2, '0')}h`;
}

export { formatarMoeda };
