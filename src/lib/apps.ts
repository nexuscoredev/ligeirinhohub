import type { CargoHub } from '@/types/database';
import { CARGOS_HUB } from '@/lib/cargos';

/** Identificador interno do app (não é app nativo — nomenclatura de produto) */
export type AppId =
  | 'hub'
  | 'pdv'
  | 'totem'
  | 'operacional'
  | 'marketing';

export interface ItemApp {
  rota: string;
  titulo: string;
  icone: string;
  prefixo: string;
}

export interface AppSistema {
  id: AppId;
  /** Nome exibido: ex. Ligeirinho Operacional */
  nome: string;
  icone: string;
  /** Sigla no ícone estilo App Store (ex.: PDV) */
  iconeLabel?: string;
  /** Rota principal ao abrir o app */
  rotaEntrada: string;
  /** Telas / módulos dentro do app */
  itens: ItemApp[];
  /** Tagline curta no menu e nos cards de lançamento */
  descricao?: string;
  /** Frase de impacto nos tiles grandes */
  tagline?: string;
  /** Cor de destaque do app (hex) — identidade visual */
  corAccent?: string;
  /** Mesh / aurora do app (CSS background) */
  gradient?: string;
}

/** Variáveis CSS inline para tematizar um app */
export function temaApp(app: AppSistema): Record<string, string> {
  const accent = app.corAccent ?? '#ff6b00';
  return {
    '--app-accent': accent,
    '--app-accent-soft': `${accent}26`,
    '--app-accent-border': `${accent}40`,
    '--app-accent-glow': `${accent}55`,
    '--app-gradient': app.gradient ?? `radial-gradient(ellipse 120% 80% at 85% 0%, ${accent}33 0%, transparent 55%)`,
  };
}

/** Páginas do painel administrativo (fora dos apps de operação) */
export const HUB_ADMIN_ITENS: ItemApp[] = [
  { rota: '/bem-vindo', titulo: 'Bem-vindo', icone: '👋', prefixo: '/bem-vindo' },
  { rota: '/perfil', titulo: 'Meu perfil', icone: '👤', prefixo: '/perfil' },
  { rota: '/admin', titulo: 'Visão geral', icone: '⚙️', prefixo: '/admin' },
  { rota: '/admin/produtos', titulo: 'Produtos', icone: '🍺', prefixo: '/admin/produtos' },
  { rota: '/admin/usuarios', titulo: 'Usuários', icone: '🔐', prefixo: '/admin/usuarios' },
  { rota: '/admin/sistemas', titulo: 'Sistemas', icone: '🔌', prefixo: '/admin/sistemas' },
];

export const APPS_SISTEMA: AppSistema[] = [
  {
    id: 'pdv',
    nome: 'Ligeirinho PDV',
    icone: '🛒',
    iconeLabel: 'PDV',
    tagline: 'Caixa rápido, venda sem atrito.',
    descricao: 'Vendas no balcão com caixa integrado.',
    corAccent: '#ff6b00',
    gradient:
      'radial-gradient(ellipse 100% 70% at 90% -10%, rgba(255,107,0,0.35) 0%, transparent 50%), radial-gradient(ellipse 60% 50% at 10% 100%, rgba(212,175,55,0.12) 0%, transparent 45%)',
    rotaEntrada: '/pdv',
    itens: [
      {
        rota: '/pdv',
        titulo: 'Painel do caixa',
        icone: '🛒',
        prefixo: '/pdv',
      },
    ],
  },
  {
    id: 'totem',
    nome: 'Ligeirinho Totem',
    icone: '📱',
    iconeLabel: 'TOTEM',
    tagline: 'Touch-first — unidade, split e retirada no caixa.',
    descricao: 'Autoatendimento: catálogo unitário, pagamento dividido e número para o caixa.',
    corAccent: '#64d2ff',
    gradient:
      'radial-gradient(ellipse 90% 65% at 88% 5%, rgba(100,210,255,0.32) 0%, transparent 52%), radial-gradient(ellipse 50% 40% at 5% 95%, rgba(100,210,255,0.08) 0%, transparent 40%)',
    rotaEntrada: '/totem',
    itens: [
      {
        rota: '/totem',
        titulo: 'Autoatendimento',
        icone: '📱',
        prefixo: '/totem',
      },
    ],
  },
  {
    id: 'operacional',
    nome: 'Ligeirinho Operacional',
    icone: '⚡',
    iconeLabel: 'OPS',
    tagline: 'Uma fila, do pedido à entrega.',
    descricao: 'Pedidos, fila, clientes e entregas.',
    corAccent: '#bf5af2',
    gradient:
      'radial-gradient(ellipse 95% 70% at 92% 0%, rgba(191,90,242,0.34) 0%, transparent 50%), radial-gradient(ellipse 55% 45% at 0% 80%, rgba(191,90,242,0.1) 0%, transparent 42%)',
    rotaEntrada: '/operacional',
    itens: [
      {
        rota: '/operacional',
        titulo: 'Fila operacional',
        icone: '⚡',
        prefixo: '/operacional',
      },
      {
        rota: '/pedidos',
        titulo: 'Pedidos',
        icone: '📦',
        prefixo: '/pedidos',
      },
      {
        rota: '/clientes',
        titulo: 'Clientes',
        icone: '👥',
        prefixo: '/clientes',
      },
      {
        rota: '/motorista',
        titulo: 'Motoristas',
        icone: '🚚',
        prefixo: '/motorista',
      },
      {
        rota: '/veiculos',
        titulo: 'Veículos',
        icone: '🚛',
        prefixo: '/veiculos',
      },
    ],
  },
  {
    id: 'marketing',
    nome: 'Ligeirinho Marketing',
    icone: '📺',
    iconeLabel: 'MKT',
    tagline: 'Promoções na TV e no WhatsApp, sem retrabalho.',
    descricao: 'Promoções do dia na TV da loja.',
    corAccent: '#ff9f0a',
    gradient:
      'radial-gradient(ellipse 95% 70% at 90% 0%, rgba(255,159,10,0.36) 0%, transparent 52%), radial-gradient(ellipse 55% 45% at 0% 85%, rgba(255,214,10,0.12) 0%, transparent 42%)',
    rotaEntrada: '/marketing',
    itens: [
      {
        rota: '/marketing',
        titulo: 'Painel',
        icone: '📺',
        prefixo: '/marketing',
      },
      {
        rota: '/marketing/criar',
        titulo: 'Criar arte',
        icone: '✨',
        prefixo: '/marketing/criar',
      },
      {
        rota: '/marketing/galeria',
        titulo: 'Galeria',
        icone: '🖼️',
        prefixo: '/marketing/galeria',
      },
      {
        rota: '/marketing/promocoes',
        titulo: 'Promoções do dia',
        icone: '🏷️',
        prefixo: '/marketing/promocoes',
      },
      {
        rota: '/marketing/tv',
        titulo: 'Preview TV',
        icone: '🖥️',
        prefixo: '/marketing/tv',
      },
    ],
  },
];

export const NOME_PLATAFORMA = 'Ligeirinho Hub';

/** Todas as rotas registradas (hub + apps) para permissões e menu */
export function todasRotasSistema(): ItemApp[] {
  return [...HUB_ADMIN_ITENS, ...APPS_SISTEMA.flatMap((app) => app.itens)];
}

/** Item de menu do app pela rota (fallback: primeiro item) */
export function itemAppPorRota(app: AppSistema, rota: string): ItemApp {
  return (
    app.itens.find((i) => i.rota === rota || rota.startsWith(`${i.prefixo}/`)) ??
    app.itens[0]
  );
}

export function appPorId(id: AppId): AppSistema | undefined {
  return APPS_SISTEMA.find((a) => a.id === id);
}

export function appPorRota(rota: string): {
  app: AppSistema;
  item: ItemApp;
} | null {
  for (const app of APPS_SISTEMA) {
    const item = app.itens.find(
      (i) => rota === i.rota || rota.startsWith(`${i.prefixo}/`),
    );
    if (item) return { app, item };
  }
  return null;
}

export function appTemSubmenu(app: AppSistema): boolean {
  return app.itens.length > 1;
}

export const HUB_CARGOS_POR_ROTA: Record<string, CargoHub[]> = {
  '/bem-vindo': CARGOS_HUB as unknown as CargoHub[],
  '/admin': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Financeiro',
    'Comercial',
    'Estoquista',
  ],
  '/admin/produtos': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Estoquista',
    'Comercial',
  ],
  '/admin/usuarios': ['Desenvolvedor', 'Administrador'],
  '/admin/sistemas': ['Desenvolvedor', 'Administrador'],
  '/admin/dashboard': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Financeiro',
    'Comercial',
  ],
  '/admin/estrategico': ['CEO', 'Desenvolvedor'],
  '/produtos': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Estoquista',
    'Comercial',
  ],
  '/usuarios': ['Desenvolvedor', 'Administrador'],
  '/pdv': ['Desenvolvedor', 'Administrador', 'Gerente', 'Caixa'],
  '/totem': ['Desenvolvedor', 'Administrador', 'Gerente'],
  '/operacional': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Estoquista',
    'Logistica',
  ],
  '/operacional/separar': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Estoquista',
    'Logistica',
  ],
  '/pedidos': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Caixa',
    'Estoquista',
    'Logistica',
  ],
  '/clientes': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Comercial',
    'Caixa',
    'Logistica',
  ],
  '/motorista': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Logistica',
  ],
  '/veiculos': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Logistica',
  ],
  '/marketing': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Comercial',
  ],
  '/marketing/criar': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Comercial',
  ],
  '/marketing/galeria': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Comercial',
  ],
  '/marketing/promocoes': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Comercial',
  ],
  '/marketing/tv': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Comercial',
  ],
};

export const ROTAS_PUBLICAS_AUTENTICADAS = ['/bem-vindo', '/perfil'];

export function rotaPermitidaParaCargo(rota: string, cargo: CargoHub): boolean {
  if (cargo === 'CEO') return true;
  const chave = Object.keys(HUB_CARGOS_POR_ROTA)
    .filter(
      (prefixo) => rota === prefixo || rota.startsWith(`${prefixo}/`),
    )
    .sort((a, b) => b.length - a.length)[0];
  if (!chave) return false;
  return HUB_CARGOS_POR_ROTA[chave]?.includes(cargo) ?? false;
}

export function paginaPermitida(
  rota: string,
  cargo: CargoHub,
  paginasPermitidas: string[] | null,
  email: string,
): boolean {
  if (ROTAS_PUBLICAS_AUTENTICADAS.includes(rota)) return true;
  if (!rotaPermitidaParaCargo(rota, cargo)) return false;

  if (cargo === 'Visualizador') {
    if (!paginasPermitidas?.length) return false;
    return paginasPermitidas.some(
      (p) => rota === p || rota.startsWith(`${p}/`),
    );
  }

  const bypass = import.meta.env.VITE_PAGINAS_BYPASS_EMAILS?.split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (bypass?.includes(email.toLowerCase())) return true;

  if (!paginasPermitidas?.length) return true;
  return paginasPermitidas.some(
    (p) => rota === p || rota.startsWith(`${p}/`),
  );
}

/** Item de hub admin visível no menu */
export function itemHubPermitido(
  item: ItemApp,
  cargo: CargoHub,
  paginasPermitidas: string[] | null,
  email: string,
): boolean {
  return paginaPermitida(item.rota, cargo, paginasPermitidas, email);
}

/** App com pelo menos um item permitido */
export function appPermitido(
  app: AppSistema,
  cargo: CargoHub,
  paginasPermitidas: string[] | null,
  email: string,
): boolean {
  return app.itens.some((item) =>
    paginaPermitida(item.rota, cargo, paginasPermitidas, email),
  );
}
