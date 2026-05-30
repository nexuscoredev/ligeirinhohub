import type { ItemApp } from '@/lib/apps';

/** Módulos do painel administrativo (subnav + cards) */
export const HUB_ADMIN_MODULOS: ItemApp[] = [
  { rota: '/admin', titulo: 'Visão geral', icone: '⚙️', prefixo: '/admin' },
  { rota: '/admin/estrategico', titulo: 'Visão Estratégica', icone: '🎯', prefixo: '/admin/estrategico' },
  { rota: '/admin/dashboard', titulo: 'Dashboard', icone: '📊', prefixo: '/admin/dashboard' },
  { rota: '/admin/relatorios', titulo: 'Relatórios', icone: '📈', prefixo: '/admin/relatorios' },
  { rota: '/admin/produtos', titulo: 'Produtos', icone: '🍺', prefixo: '/admin/produtos' },
  { rota: '/admin/cadastros-base', titulo: 'Cadastros base', icone: '📋', prefixo: '/admin/cadastros-base' },
  { rota: '/admin/pessoas', titulo: 'Pessoas', icone: '👥', prefixo: '/admin/pessoas' },
  { rota: '/admin/usuarios', titulo: 'Usuários', icone: '🔐', prefixo: '/admin/usuarios' },
  { rota: '/admin/sistemas', titulo: 'Sistemas', icone: '🔌', prefixo: '/admin/sistemas' },
];

export const ADMIN_DESCRICAO =
  'Cadastros, permissões e visão gerencial do ecossistema Ligeirinho.';
