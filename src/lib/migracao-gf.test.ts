import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ORDEM_ETAPAS, parseEtapasArg } from '../../scripts/migracao-gf/lib/load.js';
import type { ExportGf } from '../../scripts/migracao-gf/types.js';

describe('migracao-gf load', () => {
  it('parseEtapasArg aceita all', () => {
    expect(parseEtapasArg(undefined)).toBe('all');
    expect(parseEtapasArg('all')).toBe('all');
  });

  it('parseEtapasArg filtra etapas válidas', () => {
    expect(parseEtapasArg('empresa_config,produtos')).toEqual([
      'empresa_config',
      'produtos',
    ]);
  });

  it('template example.json é válido', () => {
    const path = resolve('scripts/migracao-gf/templates/export-gf.example.json');
    const data = JSON.parse(readFileSync(path, 'utf-8')) as ExportGf;
    expect(data.versao).toBeTruthy();
    expect(ORDEM_ETAPAS.length).toBe(8);
  });
});
