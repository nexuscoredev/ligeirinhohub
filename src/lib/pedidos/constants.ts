import type { PedidoOrigem, PedidoStatus } from '@/types/pedidos';

export const STATUS_LABEL: Record<PedidoStatus, string> = {
  orcamento: 'Orçamento',
  aguardando_separacao: 'Aguardando separação',
  em_separacao: 'Em separação',
  separacao_pausada: 'Separação pausada',
  separado: 'Separado',
  aguardando_retirada: 'Aguardando retirada',
  aguardando_entrega: 'Aguardando entrega',
  em_rota: 'Em rota',
  retirado: 'Retirado',
  entregue: 'Entregue',
  concluido: 'Concluído',
  com_ocorrencia: 'Com ocorrência',
  refazer_separacao: 'Refazer separação',
};

export const ORIGEM_LABEL: Record<PedidoOrigem, string> = {
  whatsapp: 'WhatsApp',
  kaena: 'Kaena',
  balcao: 'Balcão',
  totem: 'Totem',
  app: 'App',
  hub: 'Hub',
};

/** Status visíveis na fila de separação */
export const STATUS_FILA: PedidoStatus[] = [
  'refazer_separacao',
  'aguardando_separacao',
  'separacao_pausada',
  'em_separacao',
];

export const STATUS_POS_SEPARACAO: PedidoStatus[] = [
  'separado',
  'aguardando_retirada',
  'aguardando_entrega',
  'em_rota',
  'com_ocorrencia',
];

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
