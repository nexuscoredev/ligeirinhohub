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
    id: '2026-05-29-menu-aplicativos',
    data: '2026-05-29',
    titulo: 'Menu lateral mais claro',
    area: 'Hub',
    itens: [
      'Seção renomeada de “Apps instalados” para “Aplicativos”',
      'Badge com a quantidade de apps disponíveis para você',
    ],
  },
  {
    id: '2026-05-29-modulos-gestao-facil',
    data: '2026-05-29',
    titulo: 'Novos módulos nativos no Hub (Gestão Fácil)',
    area: 'Hub',
    itens: [
      'Ligeirinho Fiscal — emitir NF-e, acompanhar notas e gerenciar séries',
      'Negociações no Operacional — orçamentos e vendas com operação comercial',
      'Ligeirinho Financeiro — contas a receber/pagar, caixa, comissões e vales',
      'Ligeirinho Estoque — movimentos, entrada por XML, inventário e app de contagem',
      'Ligeirinho Catálogo — pedidos B2B com tabela de preço do cliente',
      'Scripts de migração de dados do Gestão Fácil para o Supabase',
    ],
  },
  {
    id: '2026-05-29-admin-gestao-facil',
    data: '2026-05-29',
    titulo: 'Admin — cadastros, relatórios e go-live',
    area: 'Admin',
    itens: [
      'Cadastro unificado de Pessoas (clientes, fornecedores, vendedores)',
      'Cadastros base — operações fiscais, tabelas de preço e auxiliares GF',
      'Relatórios gerenciais — vendas, fiscal e gráficos no painel admin',
      'Configuração avançada — caixas, empresa e parâmetros fiscais',
      'Checklist Go-live para descomissionar o Gestão Fácil com critérios de prontidão',
      'Permissões por cargo, incluindo acesso ao app Ligeirinho Fiscal',
    ],
  },
  {
    id: '2026-05-28-pdv-operador',
    data: '2026-05-28',
    titulo: 'Novo PDV — frente de caixa de operador',
    area: 'PDV',
    itens: [
      'Tela de venda com grid de itens, leitor de código e atalhos F1–F11',
      'Abertura e fechamento de caixa, sangria e suprimento',
      'Consulta de produtos (F2), menu de operações (F5) e notas emitidas (F11)',
      'Resumo diário e Leitura X por turno de caixa',
      'Mesma base de produtos do Admin → Produtos (catálogo da loja)',
      'Finalização em dinheiro ou outras formas, com comprovante para impressão',
    ],
  },
  {
    id: '2026-05-28-hub-melhorias',
    data: '2026-05-28',
    titulo: 'Hub e experiência geral',
    area: 'Hub',
    itens: [
      'Foto de perfil no canto superior direito (desktop e mobile)',
      'Aviso de nova versão do app — atualize sem limpar cache do navegador',
      'Tema claro mais natural, sem efeito de “negativo”',
      'Modais de criar pedido e criar cliente otimizados no desktop',
      'Painel de usuários do admin redesenhado',
    ],
  },
  {
    id: '2026-05-27-chat-melhorias',
    data: '2026-05-27',
    titulo: 'Chat interno aprimorado',
    area: 'Hub',
    itens: [
      'Avatares nas conversas e na lista de pessoas',
      'Busca em conversas, pessoas e solicitações',
      'Badge de não lidas no botão flutuante e nas abas',
      'Mobile: tela cheia com voltar à lista; Enter envia mensagem',
      'Separadores por dia e formulário de solicitação recolhível',
    ],
  },
  {
    id: '2026-05-27-visao-estrategica',
    data: '2026-05-27',
    titulo: 'Visão Estratégica reorganizada',
    area: 'Admin',
    itens: [
      'Indicadores agrupados por área: financeiro, comercial, operação, cadastros e marketing',
      'Cards clicáveis levam direto ao módulo (pedidos, fila, clientes, produtos, promoções)',
      'Orçamentos abertos no painel; solicitações abrem o chat em “Solicitações”',
      'Desenvolvedores (usuários mestres) também acessam esta visão, além do CEO',
    ],
  },
  {
    id: '2026-05-27-hub-ux',
    data: '2026-05-27',
    titulo: 'Hub mais claro e organizado',
    area: 'Hub',
    itens: [
      'Tema claro padronizado (laranja Hub, preços e alertas com melhor contraste)',
      'Página “Sobre o Ligeirinho Hub” ao clicar no logo no menu',
      'Meu perfil: foto, bio, telefone, tema e alteração de senha',
      'Resumo compacto na visão geral do admin (usuários, produtos, clientes)',
      'Cards do painel admin com título e ícone na mesma linha',
    ],
  },
  {
    id: '2026-05-27-chat',
    data: '2026-05-27',
    titulo: 'Chat interno em widget',
    area: 'Hub',
    itens: [
      'Chat flutuante no canto da tela (sem página dedicada)',
      'Redimensionável; tamanho lembrado no navegador',
      'Abas: conversas, pessoas e solicitações de suporte',
      'Aviso de novidades aparece só uma vez por atualização',
    ],
  },
  {
    id: '2026-05-27-apps',
    data: '2026-05-27',
    titulo: 'Identidade visual por app',
    area: 'Apps',
    itens: [
      'Botões dentro de cada app seguem a cor do app (ex.: roxo no Operacional)',
      'Toolbars mais compactas nas telas de motoristas e similares',
      'Totem e PDV no tema claro usam laranja Hub para preços e destaques',
    ],
  },
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
