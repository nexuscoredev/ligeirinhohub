import type { CargoHub } from '@/types/database';

export const CARGOS_HUB: readonly CargoHub[] = [
  'Desenvolvedor',
  'Administrador',
  'Gerente',
  'Caixa',
  'Estoquista',
  'Logistica',
  'Financeiro',
  'Comercial',
  'Visualizador',
] as const;
