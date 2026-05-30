const MENU_RECOLHIDO_KEY = 'hub-menu-recolhido';

export function lerMenuRecolhido(): boolean {
  try {
    return localStorage.getItem(MENU_RECOLHIDO_KEY) === '1';
  } catch {
    return false;
  }
}

export function salvarMenuRecolhido(recolhido: boolean): void {
  try {
    localStorage.setItem(MENU_RECOLHIDO_KEY, recolhido ? '1' : '0');
  } catch {
    /* localStorage indisponível */
  }
}
