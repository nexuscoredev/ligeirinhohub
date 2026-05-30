#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  console.log('=== GF → HUB — checklist go-live ===\n');

  const { data, error } = await supabase.rpc('gf_golive_avaliar');

  if (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }

  const linhas = (data ?? []) as {
    criterio: string;
    titulo: string;
    ok: boolean;
    automatico: boolean;
    detalhe: string;
  }[];

  let prontos = 0;
  for (const row of linhas) {
    const icon = row.ok ? '✓' : '✗';
    console.log(`${icon} [${row.automatico ? 'auto' : 'manual'}] ${row.titulo}`);
    console.log(`   ${row.detalhe}\n`);
    if (row.ok) prontos += 1;
  }

  const liberado = prontos === linhas.length && linhas.length > 0;
  console.log(`Resultado: ${prontos}/${linhas.length} — ${liberado ? 'GO-LIVE LIBERADO' : 'PENDENTE'}`);

  if (!liberado) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
