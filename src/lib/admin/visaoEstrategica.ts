/** Agrupamento executivo dos indicadores (ordem de exibição). */
export type BudgetEstrategico =
  | 'financeiro'
  | 'comercial'
  | 'operacao'
  | 'cadastros'
  | 'marketing';

export type KpiEstrategicoId =
  | 'receita30d'
  | 'pedidosHoje'
  | 'orcamentos'
  | 'emSeparacao'
  | 'produtos'
  | 'clientes'
  | 'promocoesAtivas'
  | 'suporteAberto';

export type KpiEstrategicoValores = Record<KpiEstrategicoId, string>;

export interface BudgetEstrategicoMeta {
  id: BudgetEstrategico;
  titulo: string;
  subtitulo: string;
  ordem: number;
}

export type DestinoIndicador =
  | { tipo: 'rota'; to: string }
  | { tipo: 'chat'; aba: 'solicitacoes' };

export interface IndicadorEstrategico {
  id: KpiEstrategicoId;
  budget: BudgetEstrategico;
  ordem: number;
  titulo: string;
  descricao: string;
  icone: string;
  destino: DestinoIndicador;
  /** Linha de destaque no topo (3 KPIs principais). */
  destaque?: boolean;
}

export const HUB_EVENTO_ABRIR_CHAT = 'hub:abrir-chat';

export const BUDGETS_ESTRATEGICOS: BudgetEstrategicoMeta[] = [
  {
    id: 'financeiro',
    titulo: 'Financeiro',
    subtitulo: 'Receita e volume de pedidos',
    ordem: 1,
  },
  {
    id: 'comercial',
    titulo: 'Comercial',
    subtitulo: 'Orçamentos e base de clientes',
    ordem: 2,
  },
  {
    id: 'operacao',
    titulo: 'Operação',
    subtitulo: 'Fila e execução na loja',
    ordem: 3,
  },
  {
    id: 'cadastros',
    titulo: 'Cadastros',
    subtitulo: 'Catálogo e cadastro mestre',
    ordem: 4,
  },
  {
    id: 'marketing',
    titulo: 'Marketing e suporte',
    subtitulo: 'Promoções e solicitações internas',
    ordem: 5,
  },
];

export const INDICADORES_ESTRATEGICOS: IndicadorEstrategico[] = [
  {
    id: 'receita30d',
    budget: 'financeiro',
    ordem: 1,
    titulo: 'Receita (30 dias)',
    descricao: 'Ver pedidos e histórico',
    icone: '💰',
    destino: { tipo: 'rota', to: '/pedidos' },
    destaque: true,
  },
  {
    id: 'pedidosHoje',
    budget: 'financeiro',
    ordem: 2,
    titulo: 'Pedidos hoje',
    descricao: 'Lista completa de pedidos',
    icone: '📦',
    destino: { tipo: 'rota', to: '/pedidos' },
    destaque: true,
  },
  {
    id: 'orcamentos',
    budget: 'comercial',
    ordem: 1,
    titulo: 'Orçamentos abertos',
    descricao: 'Aceitar e converter em pedido',
    icone: '📝',
    destino: { tipo: 'rota', to: '/pedidos' },
  },
  {
    id: 'clientes',
    budget: 'comercial',
    ordem: 2,
    titulo: 'Clientes ativos',
    descricao: 'Cadastro e situação comercial',
    icone: '👥',
    destino: { tipo: 'rota', to: '/clientes' },
  },
  {
    id: 'emSeparacao',
    budget: 'operacao',
    ordem: 1,
    titulo: 'Em separação',
    descricao: 'Fila operacional',
    icone: '⚡',
    destino: { tipo: 'rota', to: '/operacional' },
    destaque: true,
  },
  {
    id: 'produtos',
    budget: 'cadastros',
    ordem: 1,
    titulo: 'Produtos no catálogo',
    descricao: 'Preços, SKUs e categorias',
    icone: '🍺',
    destino: { tipo: 'rota', to: '/admin/produtos' },
  },
  {
    id: 'promocoesAtivas',
    budget: 'marketing',
    ordem: 1,
    titulo: 'Promoções ativas',
    descricao: 'Promoções do dia e TV',
    icone: '🏷️',
    destino: { tipo: 'rota', to: '/marketing/promocoes' },
  },
  {
    id: 'suporteAberto',
    budget: 'marketing',
    ordem: 2,
    titulo: 'Solicitações em aberto',
    descricao: 'Abrir chat → Solicitações',
    icone: '💬',
    destino: { tipo: 'chat', aba: 'solicitacoes' },
  },
];

export function indicadoresDestaque(): IndicadorEstrategico[] {
  return INDICADORES_ESTRATEGICOS.filter((i) => i.destaque).sort((a, b) => a.ordem - b.ordem);
}

export function indicadoresPorBudget(): Array<
  BudgetEstrategicoMeta & { itens: IndicadorEstrategico[] }
> {
  const budgets = [...BUDGETS_ESTRATEGICOS].sort((a, b) => a.ordem - b.ordem);
  const indicadores = [...INDICADORES_ESTRATEGICOS]
    .filter((i) => !i.destaque)
    .sort((a, b) => {
      const ba = budgets.findIndex((x) => x.id === a.budget);
      const bb = budgets.findIndex((x) => x.id === b.budget);
      if (ba !== bb) return ba - bb;
      return a.ordem - b.ordem;
    });

  return budgets
    .map((budget) => ({
      ...budget,
      itens: indicadores.filter((i) => i.budget === budget.id),
    }))
    .filter((g) => g.itens.length > 0);
}

export function abrirChatHub(aba: 'conversas' | 'pessoas' | 'solicitacoes' = 'solicitacoes') {
  window.dispatchEvent(
    new CustomEvent(HUB_EVENTO_ABRIR_CHAT, { detail: { aba } }),
  );
}

export const CARGOS_VISAO_ESTRATEGICA = ['CEO', 'Desenvolvedor'] as const;
