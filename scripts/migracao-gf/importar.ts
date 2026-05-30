#!/usr/bin/env npx tsx
import { criarClienteAdmin } from './lib/client.js';
import { executarEtapa } from './lib/etapas.js';
import { carregarExport, ORDEM_ETAPAS, parseEtapasArg } from './lib/load.js';

async function main() {
  const fileArg = process.argv.find((a) => a.startsWith('--file='))?.slice(7);
  const etapasArg = process.argv.find((a) => a.startsWith('--etapas='))?.slice(9);
  const force = process.argv.includes('--yes');

  if (!force) {
    console.error('Importação REAL. Confirme com: npm run migracao:import -- --yes');
    process.exit(1);
  }

  console.log('=== GF → HUB — IMPORTAÇÃO (apply) ===\n');

  const exportData = carregarExport(fileArg);
  const supabase = criarClienteAdmin();
  const pedidas = parseEtapasArg(etapasArg);
  const lista = pedidas === 'all' ? [...ORDEM_ETAPAS] : pedidas;

  for (const etapa of lista) {
    const r = await executarEtapa(supabase, etapa, exportData, 'apply');
    console.log(`[${etapa}] ok=${r.ok} erros=${r.erros.length}`);
    for (const e of r.erros) console.log(`  ✗ ${e}`);
  }

  console.log('\nImportação concluída. Rode: npm run migracao:validar');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
