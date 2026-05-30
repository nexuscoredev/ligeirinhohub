#!/usr/bin/env npx tsx
import { criarClienteAdmin } from './lib/client.js';
import { executarEtapa } from './lib/etapas.js';
import { carregarExport, ORDEM_ETAPAS, parseEtapasArg } from './lib/load.js';

async function main() {
  const fileArg = process.argv.find((a) => a.startsWith('--file='))?.slice(7);
  const etapasArg = process.argv.find((a) => a.startsWith('--etapas='))?.slice(9);

  console.log('=== GF → HUB — dry-run (nenhum dado será gravado) ===\n');

  const exportData = carregarExport(fileArg);
  console.log(`Export versão ${exportData.versao}${exportData.exportado_em ? ` (${exportData.exportado_em})` : ''}\n`);

  const supabase = criarClienteAdmin();
  const pedidas = parseEtapasArg(etapasArg);
  const lista = pedidas === 'all' ? [...ORDEM_ETAPAS] : pedidas;

  let totalOk = 0;
  let totalErros = 0;

  for (const etapa of lista) {
    const r = await executarEtapa(supabase, etapa, exportData, 'dry_run');
    totalOk += r.ok;
    totalErros += r.erros.length;
    console.log(`[${etapa}] ok=${r.ok} erros=${r.erros.length}`);
    for (const e of r.erros.slice(0, 5)) console.log(`  ⚠ ${e}`);
    if (r.erros.length > 5) console.log(`  … +${r.erros.length - 5} erros`);
  }

  console.log(`\nResumo dry-run: ${totalOk} registros válidos, ${totalErros} avisos/erros`);
  if (totalErros > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
