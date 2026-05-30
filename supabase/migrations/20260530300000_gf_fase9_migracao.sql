-- Gestão Fácil → Ligeirinho HUB — Fase 9: suporte à migração de dados GF

-- Mapa legacy_gf_id → uuid do HUB (usado pelos scripts em scripts/migracao-gf/)
create table if not exists public.gf_migracao_map (
  entidade text not null,
  legacy_gf_id text not null,
  hub_id uuid not null,
  importado_em timestamptz not null default now(),
  primary key (entidade, legacy_gf_id)
);

create index if not exists gf_migracao_map_hub_idx on public.gf_migracao_map (hub_id);

create table if not exists public.gf_migracao_lote (
  id uuid primary key default gen_random_uuid(),
  etapa text not null,
  modo text not null check (modo in ('dry_run', 'apply')),
  registros_ok int not null default 0,
  registros_erro int not null default 0,
  mensagens jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.gf_migracao_map enable row level security;
alter table public.gf_migracao_lote enable row level security;

create policy gf_migracao_map_select on public.gf_migracao_map
  for select to authenticated using (public.is_hub_admin());

create policy gf_migracao_map_write on public.gf_migracao_map
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());

create policy gf_migracao_lote_select on public.gf_migracao_lote
  for select to authenticated using (public.is_hub_admin());

create policy gf_migracao_lote_write on public.gf_migracao_lote
  for insert to authenticated
  with check (public.is_hub_admin());

-- Validação pós-migração (executável via script ou SQL Editor)
create or replace function public.gf_migracao_validar()
returns table (
  checagem text,
  ok boolean,
  detalhe text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_empresa int;
  v_produtos int;
  v_pessoas int;
  v_map int;
  v_pedidos_abertos int;
  v_contas_abertas int;
begin
  if not public.is_hub_admin() then
    raise exception 'Acesso negado';
  end if;

  select count(*) into v_empresa from public.empresa_config where ativo = true;
  return query select 'empresa_config_ativa'::text, v_empresa >= 1,
    format('%s registro(s) ativo(s)', v_empresa);

  select count(*) into v_produtos from public.produtos where ativo = true;
  return query select 'produtos_ativos'::text, v_produtos > 0,
    format('%s produto(s)', v_produtos);

  select count(*) into v_pessoas from public.pessoas where ativo = true;
  return query select 'pessoas_ativas'::text, v_pessoas > 0,
    format('%s pessoa(s)', v_pessoas);

  select count(*) into v_map from public.gf_migracao_map;
  return query select 'mapa_legacy'::text, v_map >= 0,
    format('%s vínculo(s) legacy→hub', v_map);

  select count(*) into v_pedidos_abertos
  from public.pedidos
  where status not in ('concluido', 'entregue', 'retirado', 'orcamento');
  return query select 'pedidos_abertos'::text, true,
    format('%s pedido(s) em andamento', v_pedidos_abertos);

  select count(*) into v_contas_abertas
  from public.contas_financeiras
  where status not in ('paga', 'cancelada') and valor_saldo > 0;
  return query select 'contas_em_aberto'::text, true,
    format('%s conta(s) com saldo', v_contas_abertas);
end;
$$;

revoke all on function public.gf_migracao_validar() from public;
grant execute on function public.gf_migracao_validar() to authenticated;

-- Índices únicos parciais para upsert idempotente via legacy_gf_id (scripts de importação)
create unique index if not exists empresa_config_legacy_idx
  on public.empresa_config (legacy_gf_id) where legacy_gf_id is not null;
create unique index if not exists motivos_legacy_idx
  on public.motivos (legacy_gf_id) where legacy_gf_id is not null;
create unique index if not exists formas_pagamento_legacy_idx
  on public.formas_pagamento (legacy_gf_id) where legacy_gf_id is not null;
create unique index if not exists tipos_conta_legacy_idx
  on public.tipos_conta (legacy_gf_id) where legacy_gf_id is not null;
create unique index if not exists operacoes_fiscais_legacy_idx
  on public.operacoes_fiscais (legacy_gf_id) where legacy_gf_id is not null;
create unique index if not exists familias_produto_legacy_idx
  on public.familias_produto (legacy_gf_id) where legacy_gf_id is not null;
create unique index if not exists produtos_legacy_idx
  on public.produtos (legacy_gf_id) where legacy_gf_id is not null;
create unique index if not exists pessoas_legacy_idx
  on public.pessoas (legacy_gf_id) where legacy_gf_id is not null;
create unique index if not exists tabelas_preco_legacy_idx
  on public.tabelas_preco (legacy_gf_id) where legacy_gf_id is not null;
create unique index if not exists series_fiscais_legacy_idx
  on public.series_fiscais (legacy_gf_id) where legacy_gf_id is not null;
create unique index if not exists notas_fiscais_legacy_idx
  on public.notas_fiscais (legacy_gf_id) where legacy_gf_id is not null;
create unique index if not exists contas_financeiras_legacy_idx
  on public.contas_financeiras (legacy_gf_id) where legacy_gf_id is not null;
