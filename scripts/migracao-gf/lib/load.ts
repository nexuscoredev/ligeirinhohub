import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ExportGf } from '../types.js';

const __dir = dirname(fileURLToPath(import.meta.url));

export function caminhoExport(custom?: string): string {
  if (custom) return resolve(custom);
  return resolve(__dir, '../data/export-gf.json');
}

export function carregarExport(caminho?: string): ExportGf {
  const path = caminhoExport(caminho);
  if (!existsSync(path)) {
    throw new Error(
      `Arquivo não encontrado: ${path}\nCopie scripts/migracao-gf/templates/export-gf.example.json para data/export-gf.json`,
    );
  }
  const raw = readFileSync(path, 'utf-8');
  const data = JSON.parse(raw) as ExportGf;
  if (!data.versao) {
    throw new Error('export-gf.json inválido: campo "versao" obrigatório.');
  }
  return data;
}

export const ORDEM_ETAPAS = [
  'empresa_config',
  'cadastros_base',
  'familias_categorias',
  'produtos',
  'pessoas',
  'tabelas_preco',
  'fiscal_estoque',
  'operacional_financeiro',
] as const;

export type NomeEtapa = (typeof ORDEM_ETAPAS)[number];

export function parseEtapasArg(arg?: string): NomeEtapa[] | 'all' {
  if (!arg || arg === 'all') return 'all';
  const pedidas = arg.split(',').map((s) => s.trim()) as NomeEtapa[];
  for (const e of pedidas) {
    if (!ORDEM_ETAPAS.includes(e)) {
      throw new Error(`Etapa desconhecida: ${e}. Válidas: ${ORDEM_ETAPAS.join(', ')}`);
    }
  }
  return pedidas;
}
