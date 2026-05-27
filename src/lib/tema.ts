export type Tema = 'dark' | 'light';

export const TEMA_STORAGE_KEY = 'ligeirinho-hub-tema';
export const TEMA_PADRAO: Tema = 'dark';

const META_THEME_COLOR: Record<Tema, string> = {
  dark: '#080808',
  light: '#f5f2ee',
};

export function temaValido(valor: string | null | undefined): valor is Tema {
  return valor === 'dark' || valor === 'light';
}

export function lerTemaSalvo(): Tema {
  try {
    const salvo = localStorage.getItem(TEMA_STORAGE_KEY);
    if (temaValido(salvo)) return salvo;
  } catch {
    /* localStorage indisponível */
  }
  return TEMA_PADRAO;
}

export function aplicarTema(tema: Tema) {
  document.documentElement.dataset.theme = tema;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', META_THEME_COLOR[tema]);

  try {
    localStorage.setItem(TEMA_STORAGE_KEY, tema);
  } catch {
    /* ignore */
  }
}
