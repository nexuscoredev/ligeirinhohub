import type { CargoHub } from '@/types/database';

export const CARGOS_HUB: readonly CargoHub[] = [
  'Desenvolvedor',
  'Administrador',
  'CEO',
  'Gerente',
  'Caixa',
  'Estoquista',
  'Logistica',
  'Financeiro',
  'Comercial',
  'Visualizador',
] as const;
