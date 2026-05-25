import type { PedidoItem } from '@/types/pedidos';

/** Ordem Denis: tipo (categoria) depois alfabético */
export function ordenarItensSeparacao(itens: PedidoItem[]): PedidoItem[] {
  return [...itens].sort((a, b) => {
    if (a.categoria_ordem !== b.categoria_ordem) {
      return a.categoria_ordem - b.categoria_ordem;
    }
    return a.nome_snapshot.localeCompare(b.nome_snapshot, 'pt-BR');
  });
}

export function agruparItensPorCategoria(
  itens: PedidoItem[],
): { categoria: string; itens: PedidoItem[] }[] {
  const ordenados = ordenarItensSeparacao(itens);
  const grupos: { categoria: string; itens: PedidoItem[] }[] = [];

  for (const item of ordenados) {
    const cat = categoriaLabel(item.categoria_ordem);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.categoria === cat) {
      ultimo.itens.push(item);
    } else {
      grupos.push({ categoria: cat, itens: [item] });
    }
  }
  return grupos;
}

function categoriaLabel(ordem: number): string {
  const map: Record<number, string> = {
    10: 'Cerveja',
    20: 'Whisky',
    30: 'Vodka',
    40: 'Refrigerante',
    50: 'Água',
    60: 'Energético',
    99: 'Outros',
  };
  return map[ordem] ?? 'Demais';
}
