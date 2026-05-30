-- Gestão Fácil → Ligeirinho HUB — Fase 8: segurança (cargos) + configuração avançada

-- Novos cargos dedicados GF
do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'cargo_hub' and e.enumlabel = 'Vendedor'
  ) then
    alter type public.cargo_hub add value 'Vendedor';
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'cargo_hub' and e.enumlabel = 'Fiscal'
  ) then
    alter type public.cargo_hub add value 'Fiscal';
  end if;
end$$;

-- Configuração fiscal / envio XML na empresa
alter table public.empresa_config
  add column if not exists fiscal_ambiente public.fiscal_ambiente not null default 'homologacao',
  add column if not exists envio_xml_habilitado boolean not null default false,
  add column if not exists envio_xml_destino text,
  add column if not exists envio_xml_email text;

-- Caixas PDV registrados
create table public.caixas_config (
  id uuid primary key default gen_random_uuid(),
  numero int not null unique check (numero > 0),
  nome text not null,
  descricao text,
  ativo boolean not null default true,
  legacy_gf_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger caixas_config_updated_at
  before update on public.caixas_config
  for each row execute function public.set_updated_at();

insert into public.caixas_config (numero, nome, descricao)
values (1, 'Caixa 01', 'Terminal principal PDV')
on conflict (numero) do nothing;

alter table public.caixas_config enable row level security;

create policy caixas_config_select on public.caixas_config
  for select to authenticated using (true);

create policy caixas_config_write_admin on public.caixas_config
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());

-- Acesso à configuração avançada
create or replace function public.pode_acessar_config()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios u
    where u.id = auth.uid() and u.ativo
      and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente', 'CEO')
  );
$$;

revoke all on function public.pode_acessar_config() from public;
grant execute on function public.pode_acessar_config() to authenticated;

-- Cargo Fiscal dedicado no módulo fiscal
create or replace function public.pode_acessar_fiscal()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios u
    where u.id = auth.uid() and u.ativo
      and u.cargo in (
        'Desenvolvedor', 'Administrador', 'Gerente', 'Financeiro', 'Fiscal', 'CEO'
      )
  );
$$;
