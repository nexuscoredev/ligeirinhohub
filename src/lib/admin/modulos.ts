import type { ItemApp } from '@/lib/apps';

/** Módulos do painel administrativo (subnav + cards) */
export const HUB_ADMIN_MODULOS: ItemApp[] = [
  { rota: '/admin', titulo: 'Visão geral', icone: '⚙️', prefixo: '/admin' },
  { rota: '/admin/dashboard', titulo: 'Dashboard', icone: '📊', prefixo: '/admin/dashboard' },
  { rota: '/admin/produtos', titulo: 'Produtos', icone: '🍺', prefixo: '/admin/produtos' },
  { rota: '/admin/usuarios', titulo: 'Usuários', icone: '🔐', prefixo: '/admin/usuarios' },
  { rota: '/admin/sistemas', titulo: 'Sistemas', icone: '🔌', prefixo: '/admin/sistemas' },
];

export const ADMIN_DESCRICAO =
  'Cadastros, permissões e visão gerencial do ecossistema Ligeirinho.';
