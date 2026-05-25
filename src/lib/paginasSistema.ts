/**
 * Compatibilidade e reexport — navegação principal usa {@link ./apps}.
 */
export {
  ROTAS_PUBLICAS_AUTENTICADAS,
  HUB_CARGOS_POR_ROTA,
  rotaPermitidaParaCargo,
  paginaPermitida,
  todasRotasSistema,
  type ItemApp,
} from '@/lib/apps';

import { HUB_ADMIN_ITENS, todasRotasSistema } from '@/lib/apps';

/** @deprecated Preferir HUB_ADMIN_ITENS e APPS_SISTEMA */
export type GrupoMenu =
  | 'visao-geral'
  | 'cadastros'
  | 'operacional'
  | 'sistema';

/** @deprecated Lista plana derivada de hub + apps */
export const PAGINAS_SISTEMA = todasRotasSistema().map((item) => {
  const hub = HUB_ADMIN_ITENS.some((h) => h.rota === item.rota);
  let grupo: GrupoMenu = 'operacional';
  if (hub) {
    if (item.rota === '/bem-vindo' || item.rota === '/dashboard') {
      grupo = 'visao-geral';
    } else if (item.rota === '/usuarios') {
      grupo = 'sistema';
    } else {
      grupo = 'cadastros';
    }
  }
  return {
    rota: item.rota,
    titulo: item.titulo,
    grupo,
    prefixo: item.prefixo,
  };
});

/** @deprecated Menu agrupado por apps em MainLayout */
export const GRUPOS_MENU: Record<GrupoMenu, string> = {
  'visao-geral': 'Visão geral',
  cadastros: 'Cadastros',
  operacional: 'Apps',
  sistema: 'Sistema',
};
