import type { CargoHub } from '@/types/database';
import { CARGOS_HUB } from '@/lib/cargos';

/** Identificador interno do app (não é app nativo — nomenclatura de produto) */
export type AppId = 'hub' | 'pdv' | 'totem' | 'operacional';

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
  /** Rota principal ao abrir o app */
  rotaEntrada: string;
  /** Telas / módulos dentro do app */
  itens: ItemApp[];
}

/** Páginas do painel administrativo (fora dos apps de operação) */
export const HUB_ADMIN_ITENS: ItemApp[] = [
  { rota: '/bem-vindo', titulo: 'Bem-vindo', icone: '👋', prefixo: '/bem-vindo' },
  { rota: '/dashboard', titulo: 'Dashboard', icone: '📊', prefixo: '/dashboard' },
  { rota: '/produtos', titulo: 'Produtos', icone: '🍺', prefixo: '/produtos' },
  { rota: '/usuarios', titulo: 'Usuários', icone: '🔐', prefixo: '/usuarios' },
];

export const APPS_SISTEMA: AppSistema[] = [
  {
    id: 'pdv',
    nome: 'Ligeirinho PDV',
    icone: '🛒',
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
    ],
  },
];

export const NOME_PLATAFORMA = 'Ligeirinho Hub';

/** Todas as rotas registradas (hub + apps) para permissões e menu */
export function todasRotasSistema(): ItemApp[] {
  return [...HUB_ADMIN_ITENS, ...APPS_SISTEMA.flatMap((app) => app.itens)];
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
  '/dashboard': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Financeiro',
    'Comercial',
  ],
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
};

export const ROTAS_PUBLICAS_AUTENTICADAS = ['/bem-vindo'];

export function rotaPermitidaParaCargo(rota: string, cargo: CargoHub): boolean {
  const chave = Object.keys(HUB_CARGOS_POR_ROTA).find(
    (prefixo) => rota === prefixo || rota.startsWith(`${prefixo}/`),
  );
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
