import type { Promocao } from '@/types/marketing';

/** Data local YYYY-MM-DD (sem fuso na UI) */
export function hojeLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function promoVigente(p: Promocao, ref = hojeLocal()): boolean {
  if (!p.ativo) return false;
  return p.validade_inicio <= ref && ref <= p.validade_fim;
}

export function promoExpirada(p: Promocao, ref = hojeLocal()): boolean {
  return p.validade_fim < ref;
}

/** Termina em até `dias` dias (inclusive hoje) */
export function promoExpiraEmBreve(
  p: Promocao,
  dias = 3,
  ref = hojeLocal(),
): boolean {
  if (!p.ativo || promoExpirada(p, ref)) return false;
  const fim = new Date(`${p.validade_fim}T12:00:00`);
  const hoje = new Date(`${ref}T12:00:00`);
  const limite = new Date(hoje);
  limite.setDate(limite.getDate() + dias);
  return fim <= limite;
}

export function formatarValidade(inicio: string, fim: string): string {
  const fmt = (s: string) => {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y?.slice(2) ?? y}`;
  };
  return `${fmt(inicio)} — ${fmt(fim)}`;
}
