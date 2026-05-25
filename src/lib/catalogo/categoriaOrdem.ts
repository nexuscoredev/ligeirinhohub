/** Ordem na separação (reunião Denis) — categorias do catálogo legado */
const ORDEM_POR_SLUG: Record<string, number> = {
  cervejas: 10,
  whiskys: 20,
  vodkas: 30,
  'gin-s': 35,
  tequila: 36,
  licor: 37,
  destilados: 38,
  'refrigerantes-sucos': 40,
  'driks-prontos': 45,
  aguas: 50,
  gelos: 55,
  energeticos: 60,
  vinhos: 65,
  combos: 70,
  salgadinho: 80,
  tabacaria: 90,
  cigarros: 91,
  carvao: 92,
};

export function ordemSeparacaoCategoria(slug: string, indexFallback: number): number {
  return ORDEM_POR_SLUG[slug] ?? 50 + indexFallback;
}

export function nomeCategoriaExibicao(nome: string): string {
  return nome
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
