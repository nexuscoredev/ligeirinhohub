import type { CargoHub } from '@/types/database';

const ADMIN: CargoHub[] = ['Desenvolvedor', 'Administrador'];

export function podeEditarPedidoOficial(cargo: CargoHub): boolean {
  return ADMIN.includes(cargo);
}

export function podeSeparar(cargo: CargoHub): boolean {
  return [
    ...ADMIN,
    'Gerente',
    'Estoquista',
    'Logistica',
  ].includes(cargo);
}

export function podeResolverOcorrencia(cargo: CargoHub): boolean {
  return [...ADMIN, 'Gerente'].includes(cargo);
}
