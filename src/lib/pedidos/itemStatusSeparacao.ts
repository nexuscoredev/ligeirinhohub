import type { ItemStatusSeparacao, PedidoItem } from '@/types/pedidos';

export const ITEM_STATUS_SEPARACAO_LABEL: Record<ItemStatusSeparacao, string> = {
  pendente: 'Pendente',
  separado: 'Separado',
  indisponivel: 'Não encontrado',
};

/** Texto longo para acessibilidade / tooltip */
export const ITEM_STATUS_SEPARACAO_HINT: Record<ItemStatusSeparacao, string> = {
  pendente: 'Ainda não conferido',
  separado: 'Item separado com sucesso',
  indisponivel: 'Produto não encontrado na loja',
};

export function statusItemFromRow(item: PedidoItem): ItemStatusSeparacao {
  if (item.status_separacao) return item.status_separacao;
  if (item.qty_separada === null || item.qty_separada === undefined) return 'pendente';
  if (Number(item.qty_separada) === 0) return 'indisponivel';
  return 'separado';
}

export function qtyParaStatus(
  status: ItemStatusSeparacao,
  qtyPedida: number,
): { qty_separada: number | null; separado_ok: boolean } {
  switch (status) {
    case 'separado':
      return { qty_separada: qtyPedida, separado_ok: true };
    case 'indisponivel':
      return { qty_separada: 0, separado_ok: false };
    default:
      return { qty_separada: null, separado_ok: false };
  }
}

export function valorItemSeparado(item: PedidoItem): number {
  const qty = item.qty_separada;
  if (qty === null || qty === undefined) return 0;
  return Number(qty) * Number(item.preco_unitario);
}

export function todosItensComStatusDefinido(itens: PedidoItem[]): boolean {
  return itens.every((i) => statusItemFromRow(i) !== 'pendente');
}
