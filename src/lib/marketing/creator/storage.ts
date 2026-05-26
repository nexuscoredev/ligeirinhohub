import type { ArteSalva, MarketingCreatorState } from '@/lib/marketing/creator/types';

const CHAVE = 'ligeirinho-marketing-galeria';

export function listarArtesGaleria(): ArteSalva[] {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (!raw) return [];
    const lista = JSON.parse(raw) as ArteSalva[];
    return Array.isArray(lista) ? lista.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)) : [];
  } catch {
    return [];
  }
}

export function salvarArteGaleria(arte: ArteSalva): void {
  const lista = listarArtesGaleria().filter((a) => a.id !== arte.id);
  lista.unshift(arte);
  localStorage.setItem(CHAVE, JSON.stringify(lista.slice(0, 80)));
}

export function buscarArteGaleria(id: string): ArteSalva | undefined {
  return listarArtesGaleria().find((a) => a.id === id);
}

export function atualizarArteGaleria(
  id: string,
  patch: Partial<Pick<ArteSalva, 'favorito' | 'previewDataUrl' | 'variacoes'>>,
): void {
  const lista = listarArtesGaleria();
  const idx = lista.findIndex((a) => a.id === id);
  if (idx < 0) return;
  lista[idx] = { ...lista[idx], ...patch };
  localStorage.setItem(CHAVE, JSON.stringify(lista));
}

export function removerArteGaleria(id: string): void {
  const lista = listarArtesGaleria().filter((a) => a.id !== id);
  localStorage.setItem(CHAVE, JSON.stringify(lista));
}

export function tituloArte(estado: MarketingCreatorState): string {
  const p = estado.produtos[0];
  if (p?.nome.trim()) return p.nome.trim();
  if (estado.campos.tituloPrincipal.trim()) return estado.campos.tituloPrincipal.trim();
  return 'Arte sem título';
}
