export interface Novidade {
  id: string;
  data: string;
  titulo: string;
  itens: string[];
  area?: string;
}

/** Mais recente primeiro — atualize ao lançar mudanças visíveis ao usuário. */
export const NOVIDADES: Novidade[] = [
  {
    id: '2026-05-26-temas',
    data: '2026-05-26',
    titulo: 'Tema claro e escuro',
    area: 'Hub',
    itens: [
      'Alternância entre tema escuro (padrão) e claro',
      'Preferência salva no navegador',
      'Controle no menu lateral e no login',
    ],
  },
  {
    id: '2026-05-26-produtos-paginacao',
    data: '2026-05-26',
    titulo: 'Produtos mais rápidos no celular',
    area: 'Admin',
    itens: [
      'Lista carrega 30 itens por vez',
      'Botão “Mostrar mais itens” para ver o restante do catálogo',
    ],
  },
  {
    id: '2026-05-26-marketing-imagens',
    data: '2026-05-26',
    titulo: 'Promoções com foto do produto',
    area: 'Marketing',
    itens: [
      'Cards de promoção exibem imagem do catálogo',
      'Preview da TV com foto grande e layout renovado',
    ],
  },
  {
    id: '2026-05-26-operacional-cadastros',
    data: '2026-05-26',
    titulo: 'Cadastros e operação',
    area: 'Operação',
    itens: [
      'Criar pedido direto na fila operacional',
      'Clientes, motoristas e veículos: criar e importar base',
      'Motoristas inativos visíveis com badge de status',
    ],
  },
  {
    id: '2026-05-26-mobile-hub',
    data: '2026-05-26',
    titulo: 'Experiência mobile e tablet',
    area: 'Hub',
    itens: [
      'Menu em gaveta com barra superior',
      'Cards de apps mais compactos na tela Bem-vindo',
      'Correções de layout e scroll horizontal',
    ],
  },
  {
    id: '2026-05-25-dashboard-perfil',
    data: '2026-05-25',
    titulo: 'Painel e perfil',
    area: 'Hub',
    itens: [
      'Seção renomeada para “Aplicativos”',
      'Card de perfil com nome e cargo no menu',
      'KPI de produtos alinhado ao catálogo legado',
    ],
  },
];

export const NOVIDADES_LIDAS_KEY = 'ligeirinho-hub-novidades-lidas';
export const NOVIDADES_PROMPT_KEY = 'ligeirinho-hub-novidades-prompt';

export function idNovidadeMaisRecente(): string {
  return NOVIDADES[0]?.id ?? '';
}

export function temNovidadesNaoLidas(): boolean {
  const recente = idNovidadeMaisRecente();
  if (!recente) return false;
  try {
    return localStorage.getItem(NOVIDADES_LIDAS_KEY) !== recente;
  } catch {
    return false;
  }
}

export function marcarNovidadesComoLidas() {
  const recente = idNovidadeMaisRecente();
  if (!recente) return;
  try {
    localStorage.setItem(NOVIDADES_LIDAS_KEY, recente);
  } catch {
    /* ignore */
  }
}

/** Garante que a notificação automática apareça só 1x por atualização neste navegador. */
export function deveExibirPromptNovidades(): boolean {
  const recente = idNovidadeMaisRecente();
  if (!recente) return false;
  if (!temNovidadesNaoLidas()) return false;
  try {
    return localStorage.getItem(NOVIDADES_PROMPT_KEY) !== recente;
  } catch {
    return false;
  }
}

export function marcarPromptNovidadesExibido() {
  const recente = idNovidadeMaisRecente();
  if (!recente) return;
  try {
    localStorage.setItem(NOVIDADES_PROMPT_KEY, recente);
  } catch {
    /* ignore */
  }
}

export function formatarDataNovidade(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const data = new Date(y, m - 1, d);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
