# Migração Gestão Fácil → Ligeirinho HUB

Scripts para importar dados exportados do GF para o Supabase, com **dry-run** e **validação pós-migração**.

## Pré-requisitos

1. Migrations GF Fases 0–9 aplicadas no Supabase (inclui `gf_migracao_map` e índices `legacy_gf_id`).
2. Variáveis de ambiente:

```bash
export SUPABASE_URL="https://SEU_PROJETO.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
```

3. Export JSON do Gestão Fácil em `scripts/migracao-gf/data/export-gf.json`  
   (use `templates/export-gf.example.json` como base).

## Ordem de importação

```text
1. empresa_config
2. cadastros_base      → formas_pagamento, tipos_conta, motivos, operacoes_fiscais
3. familias_categorias
4. produtos
5. pessoas
6. tabelas_preco     → inclui tabelas_preco_itens
7. fiscal_estoque    → series_fiscais, estoque_saldos
8. operacional_financeiro → notas_fiscais, contas_abertas, pedidos_abertos*
```

\* Pedidos abertos exigem revisão manual — o script registra aviso (stub).

## Comandos

```bash
# Simular (não grava)
npm run migracao:dry-run

# Simular só algumas etapas
npm run migracao:dry-run -- --etapas=empresa_config,produtos

# Importar de verdade (requer --yes)
npm run migracao:import -- --yes

# Validar após importação
npm run migracao:validar
```

Arquivo customizado:

```bash
npm run migracao:dry-run -- --file=/caminho/export-gf.json
```

## Mapa legacy → HUB

Cada registro importado grava em `gf_migracao_map`:

| Coluna | Descrição |
|--------|-----------|
| `entidade` | ex.: `produto`, `pessoa` |
| `legacy_gf_id` | ID no Gestão Fácil |
| `hub_id` | UUID no Supabase |

Reimportar é idempotente (upsert por `legacy_gf_id`).

## Validação SQL manual

```sql
select * from public.gf_migracao_validar();
select entidade, count(*) from public.gf_migracao_map group by entidade;
```

## Formato do JSON

Ver `types.ts` e `templates/export-gf.example.json`. Todo registro migrável deve ter `legacy_gf_id` (string estável do GF).
