-- Gestão Fácil → Ligeirinho HUB — Fase 3: módulo fiscal (NF-e / NFC-e)

create type public.nota_fiscal_status as enum (
  'rascunho',
  'processando',
  'autorizada',
  'rejeitada',
  'cancelada',
  'inutilizada'
);

create type public.fiscal_ambiente as enum (
  'homologacao',
  'producao'
);

-- Séries de numeração (NF-e 55 / NFC-e 65)
create table public.series_fiscais (
  id uuid primary key default gen_random_uuid(),
  modelo text not null check (modelo in ('55', '65')),
  serie text not null,
  numero_atual int not null default 0 check (numero_atual >= 0),
  ambiente public.fiscal_ambiente not null default 'homologacao',
  descricao text,
  ativo boolean not null default true,
  legacy_gf_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (modelo, serie, ambiente)
);

create trigger series_fiscais_updated_at
  before update on public.series_fiscais
  for each row execute function public.set_updated_at();

-- Notas fiscais (NF-e modelo 55; NFC-e do PDV permanece em pedidos)
create table public.notas_fiscais (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references public.pedidos (id) on delete set null,
  pessoa_id uuid references public.pessoas (id) on delete set null,
  modelo text not null default '55' check (modelo in ('55', '65')),
  serie text not null,
  numero int not null,
  chave_acesso text unique,
  status public.nota_fiscal_status not null default 'rascunho',
  valor_total numeric(12, 2) not null default 0,
  xml_url text,
  pdf_url text,
  protocolo text,
  motivo_rejeicao text,
  nuvem_fiscal_id text,
  ambiente public.fiscal_ambiente not null default 'homologacao',
  emitida_em timestamptz,
  cancelada_em timestamptz,
  legacy_gf_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notas_fiscais_updated_at
  before update on public.notas_fiscais
  for each row execute function public.set_updated_at();

create index notas_fiscais_pedido_idx on public.notas_fiscais (pedido_id);
create index notas_fiscais_status_idx on public.notas_fiscais (status);
create index notas_fiscais_emitida_idx on public.notas_fiscais (emitida_em desc nulls last);

create table public.notas_fiscais_itens (
  id uuid primary key default gen_random_uuid(),
  nota_fiscal_id uuid not null references public.notas_fiscais (id) on delete cascade,
  produto_id uuid references public.produtos (id) on delete set null,
  descricao text not null,
  ncm text,
  cfop text,
  cst text,
  quantidade numeric(12, 3) not null check (quantidade > 0),
  valor_unitario numeric(12, 2) not null check (valor_unitario >= 0),
  valor_total numeric(12, 2) not null check (valor_total >= 0),
  created_at timestamptz not null default now()
);

create index notas_fiscais_itens_nota_idx on public.notas_fiscais_itens (nota_fiscal_id);

-- Seeds: séries padrão homologação
insert into public.series_fiscais (modelo, serie, numero_atual, ambiente, descricao) values
  ('65', '1', 0, 'homologacao', 'NFC-e PDV'),
  ('55', '1', 0, 'homologacao', 'NF-e Negociação')
on conflict (modelo, serie, ambiente) do nothing;

-- RLS
alter table public.series_fiscais enable row level security;
alter table public.notas_fiscais enable row level security;
alter table public.notas_fiscais_itens enable row level security;

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
        'Desenvolvedor', 'Administrador', 'Gerente', 'Financeiro', 'CEO'
      )
  );
$$;

revoke all on function public.pode_acessar_fiscal() from public;
grant execute on function public.pode_acessar_fiscal() to authenticated;

create policy series_fiscais_select on public.series_fiscais
  for select to authenticated using (true);

create policy series_fiscais_write on public.series_fiscais
  for all to authenticated
  using (public.pode_acessar_fiscal())
  with check (public.pode_acessar_fiscal());

create policy notas_fiscais_select on public.notas_fiscais
  for select to authenticated using (true);

create policy notas_fiscais_write on public.notas_fiscais
  for all to authenticated
  using (public.pode_acessar_fiscal())
  with check (public.pode_acessar_fiscal());

create policy notas_fiscais_itens_select on public.notas_fiscais_itens
  for select to authenticated using (true);

create policy notas_fiscais_itens_write on public.notas_fiscais_itens
  for all to authenticated
  using (public.pode_acessar_fiscal())
  with check (public.pode_acessar_fiscal());
