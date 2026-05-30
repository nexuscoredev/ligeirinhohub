#!/usr/bin/env npx tsx
import { criarClienteAdmin } from './lib/client.js';

async function main() {
  console.log('=== GF → HUB — validação pós-migração ===\n');

  const supabase = criarClienteAdmin();
  const { data, error } = await supabase.rpc('gf_migracao_validar');

  if (error) {
    console.error('Erro ao validar:', error.message);
    process.exit(1);
  }

  const linhas = (data ?? []) as { checagem: string; ok: boolean; detalhe: string }[];
  let falhas = 0;

  for (const row of linhas) {
    const icon = row.ok ? '✓' : '✗';
    console.log(`${icon} ${row.checagem}: ${row.detalhe}`);
    if (!row.ok) falhas += 1;
  }

  const { count } = await supabase
    .from('gf_migracao_map')
    .select('*', { count: 'exact', head: true });

  console.log(`\nMapa legacy: ${count ?? 0} vínculos`);

  if (falhas > 0) process.exit(1);
  console.log('\nValidação OK.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
