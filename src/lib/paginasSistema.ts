import type { CargoHub } from '@/types/database';
import { CARGOS_HUB } from '@/lib/cargos';

export type GrupoMenu =
  | 'visao-geral'
  | 'cadastros'
  | 'operacional'
  | 'sistema';

export interface PaginaSistema {
  rota: string;
  titulo: string;
  grupo: GrupoMenu;
  /** Prefixo usado em paginas_permitidas e match de menu */
  prefixo: string;
}

export const PAGINAS_SISTEMA: PaginaSistema[] = [
  { rota: '/bem-vindo', titulo: 'Bem-vindo', grupo: 'visao-geral', prefixo: '/bem-vindo' },
  { rota: '/dashboard', titulo: 'Dashboard', grupo: 'visao-geral', prefixo: '/dashboard' },
  { rota: '/produtos', titulo: 'Produtos', grupo: 'cadastros', prefixo: '/produtos' },
  { rota: '/clientes', titulo: 'Clientes', grupo: 'cadastros', prefixo: '/clientes' },
  { rota: '/pedidos', titulo: 'Pedidos', grupo: 'operacional', prefixo: '/pedidos' },
  { rota: '/pdv', titulo: 'PDV', grupo: 'operacional', prefixo: '/pdv' },
  { rota: '/totem', titulo: 'Totem', grupo: 'operacional', prefixo: '/totem' },
  { rota: '/operacional', titulo: 'Operacional', grupo: 'operacional', prefixo: '/operacional' },
  { rota: '/motorista', titulo: 'Motoristas', grupo: 'operacional', prefixo: '/motorista' },
  { rota: '/usuarios', titulo: 'Usuários', grupo: 'sistema', prefixo: '/usuarios' },
];

export const GRUPOS_MENU: Record<GrupoMenu, string> = {
  'visao-geral': 'Visão geral',
  cadastros: 'Cadastros',
  operacional: 'Operacional',
  sistema: 'Sistema',
};

/** Rotas sempre acessíveis após login */
export const ROTAS_PUBLICAS_AUTENTICADAS = ['/bem-vindo'];

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
  '/clientes': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Comercial',
    'Caixa',
  ],
  '/pedidos': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Caixa',
    'Estoquista',
    'Logistica',
  ],
  '/pdv': ['Desenvolvedor', 'Administrador', 'Gerente', 'Caixa'],
  '/totem': ['Desenvolvedor', 'Administrador', 'Gerente'],
  '/operacional': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Estoquista',
    'Logistica',
  ],
  '/motorista': [
    'Desenvolvedor',
    'Administrador',
    'Gerente',
    'Logistica',
  ],
  '/usuarios': ['Desenvolvedor', 'Administrador'],
};

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
