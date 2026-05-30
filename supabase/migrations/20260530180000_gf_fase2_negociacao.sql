-- Gestão Fácil → Ligeirinho HUB — Fase 2: negociação + gestão produtos (aditivo)

create type public.gf_tipo_documento as enum (
  'orcamento',
  'nfce',
  'nfe'
);

-- Família de produtos (Gestão Produtos GF)
create table public.familias_produto (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ordem int not null default 0,
  ativo boolean not null default true,
  legacy_gf_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger familias_produto_updated_at
  before update on public.familias_produto
  for each row execute function public.set_updated_at();

alter table public.produtos
  add column if not exists familia_id uuid references public.familias_produto (id) on delete set null;

-- Operações fiscais / comerciais (Negociação GF)
create table public.operacoes_fiscais (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  descricao text not null,
  cfop_dentro_uf text,
  cfop_fora_uf text,
  ativo boolean not null default true,
  legacy_gf_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger operacoes_fiscais_updated_at
  before update on public.operacoes_fiscais
  for each row execute function public.set_updated_at();

-- Tabelas de preço
create table public.tabelas_preco (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  padrao boolean not null default false,
  ativo boolean not null default true,
  legacy_gf_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tabelas_preco_updated_at
  before update on public.tabelas_preco
  for each row execute function public.set_updated_at();

create table public.tabelas_preco_itens (
  id uuid primary key default gen_random_uuid(),
  tabela_preco_id uuid not null references public.tabelas_preco (id) on delete cascade,
  produto_id uuid not null references public.produtos (id) on delete cascade,
  preco numeric(12, 2) not null check (preco >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tabela_preco_id, produto_id)
);

create trigger tabelas_preco_itens_updated_at
  before update on public.tabelas_preco_itens
  for each row execute function public.set_updated_at();

create index tabelas_preco_itens_produto_idx on public.tabelas_preco_itens (produto_id);

-- Campos comerciais em pedidos (nullable — fluxos atuais intactos)
alter table public.pedidos
  add column if not exists operacao_fiscal_id uuid references public.operacoes_fiscais (id) on delete set null;

alter table public.pedidos
  add column if not exists vendedor_id uuid references public.pessoas (id) on delete set null;

alter table public.pedidos
  add column if not exists tabela_preco_id uuid references public.tabelas_preco (id) on delete set null;

alter table public.pedidos
  add column if not exists tipo_documento public.gf_tipo_documento;

alter table public.pedidos
  add column if not exists desconto_total numeric(12, 2) not null default 0 check (desconto_total >= 0);

alter table public.pedidos
  add column if not exists frete_valor numeric(12, 2) not null default 0 check (frete_valor >= 0);

-- Seeds
insert into public.familias_produto (nome, ordem) values
  ('Bebidas', 10),
  ('Destilados', 20),
  ('Cervejas', 30),
  ('Refrigerantes', 40),
  ('Águas', 50)
on conflict (nome) do nothing;

insert into public.operacoes_fiscais (codigo, descricao, cfop_dentro_uf, cfop_fora_uf) values
  (
    'VENDA',
    'Venda de Mercadoria Adquirida ou Recebida de Terceiros',
    '5102',
    '6102'
  ),
  ('BONIF', 'Bonificação / Doação', '5910', '6910')
on conflict (codigo) do nothing;

insert into public.tabelas_preco (codigo, nome, padrao) values
  ('PADRAO', 'TABELA PADRÃO', true)
on conflict (codigo) do nothing;

-- RLS
alter table public.familias_produto enable row level security;
alter table public.operacoes_fiscais enable row level security;
alter table public.tabelas_preco enable row level security;
alter table public.tabelas_preco_itens enable row level security;

create policy familias_select on public.familias_produto
  for select to authenticated using (true);

create policy familias_write_admin on public.familias_produto
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());

create policy operacoes_select on public.operacoes_fiscais
  for select to authenticated using (true);

create policy operacoes_write_staff on public.operacoes_fiscais
  for all to authenticated
  using (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.ativo
        and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente', 'Comercial')
    )
  )
  with check (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.ativo
        and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente', 'Comercial')
    )
  );

create policy tabelas_preco_select on public.tabelas_preco
  for select to authenticated using (true);

create policy tabelas_preco_itens_select on public.tabelas_preco_itens
  for select to authenticated using (true);

create policy tabelas_preco_write_staff on public.tabelas_preco
  for all to authenticated
  using (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.ativo
        and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente', 'Comercial')
    )
  )
  with check (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.ativo
        and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente', 'Comercial')
    )
  );

create policy tabelas_preco_itens_write_staff on public.tabelas_preco_itens
  for all to authenticated
  using (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.ativo
        and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente', 'Comercial')
    )
  )
  with check (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.ativo
        and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente', 'Comercial')
    )
  );
