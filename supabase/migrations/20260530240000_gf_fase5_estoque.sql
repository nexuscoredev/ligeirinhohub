-- Gestão Fácil → Ligeirinho HUB — Fase 5: controle de estoque

create type public.estoque_movimento_tipo as enum (
  'entrada',
  'saida',
  'ajuste',
  'inventario'
);

-- Depósitos / armazéns
create table public.estoque_depositos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  descricao text,
  ativo boolean not null default true,
  legacy_gf_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger estoque_depositos_updated_at
  before update on public.estoque_depositos
  for each row execute function public.set_updated_at();

-- Saldo por produto × depósito
create table public.estoque_saldos (
  id uuid primary key default gen_random_uuid(),
  deposito_id uuid not null references public.estoque_depositos (id) on delete cascade,
  produto_id uuid not null references public.produtos (id) on delete cascade,
  quantidade numeric(12, 3) not null default 0,
  updated_at timestamptz not null default now(),
  unique (deposito_id, produto_id)
);

create trigger estoque_saldos_updated_at
  before update on public.estoque_saldos
  for each row execute function public.set_updated_at();

create index estoque_saldos_produto_idx on public.estoque_saldos (produto_id);
create index estoque_saldos_deposito_idx on public.estoque_saldos (deposito_id);

-- Lotes e validade
create table public.estoque_lotes (
  id uuid primary key default gen_random_uuid(),
  deposito_id uuid not null references public.estoque_depositos (id) on delete cascade,
  produto_id uuid not null references public.produtos (id) on delete cascade,
  codigo_lote text not null,
  data_validade date,
  quantidade numeric(12, 3) not null default 0 check (quantidade >= 0),
  legacy_gf_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (deposito_id, produto_id, codigo_lote)
);

create trigger estoque_lotes_updated_at
  before update on public.estoque_lotes
  for each row execute function public.set_updated_at();

create index estoque_lotes_validade_idx on public.estoque_lotes (data_validade);

-- Movimentações (entrada, saída, ajuste, inventário)
create table public.estoque_movimentos (
  id uuid primary key default gen_random_uuid(),
  deposito_id uuid not null references public.estoque_depositos (id) on delete restrict,
  produto_id uuid not null references public.produtos (id) on delete restrict,
  lote_id uuid references public.estoque_lotes (id) on delete set null,
  tipo public.estoque_movimento_tipo not null,
  quantidade numeric(12, 3) not null check (quantidade > 0),
  saldo_anterior numeric(12, 3),
  saldo_posterior numeric(12, 3),
  documento_ref text,
  pedido_id uuid references public.pedidos (id) on delete set null,
  observacoes text,
  usuario_id uuid references public.usuarios (id) on delete set null,
  legacy_gf_id text,
  created_at timestamptz not null default now()
);

create index estoque_movimentos_deposito_idx on public.estoque_movimentos (deposito_id);
create index estoque_movimentos_produto_idx on public.estoque_movimentos (produto_id);
create index estoque_movimentos_created_idx on public.estoque_movimentos (created_at desc);

-- Atualiza saldo ao registrar movimento (BEFORE INSERT preenche saldos no registro)
create or replace function public.estoque_movimento_before()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_saldo numeric(12, 3);
  v_delta numeric(12, 3);
  v_novo numeric(12, 3);
begin
  select coalesce(quantidade, 0) into v_saldo
  from public.estoque_saldos
  where deposito_id = new.deposito_id and produto_id = new.produto_id;

  v_saldo := coalesce(v_saldo, 0);
  new.saldo_anterior := v_saldo;

  v_delta := case new.tipo
    when 'entrada' then new.quantidade
    when 'saida' then -new.quantidade
    when 'ajuste' then new.quantidade
    when 'inventario' then new.quantidade - v_saldo
    else 0
  end;

  v_novo := v_saldo + v_delta;

  if v_novo < 0 then
    raise exception 'Saldo insuficiente (atual: %, movimento: %)', v_saldo, new.quantidade;
  end if;

  insert into public.estoque_saldos (deposito_id, produto_id, quantidade)
  values (new.deposito_id, new.produto_id, v_novo)
  on conflict (deposito_id, produto_id)
  do update set quantidade = v_novo, updated_at = now();

  new.saldo_posterior := v_novo;
  return new;
end;
$$;

create trigger estoque_movimento_before
  before insert on public.estoque_movimentos
  for each row execute function public.estoque_movimento_before();

-- Seed: depósito principal
insert into public.estoque_depositos (codigo, nome, descricao) values
  ('DEP01', 'Depósito principal', 'Estoque padrão da distribuidora')
on conflict (codigo) do nothing;

-- RLS
alter table public.estoque_depositos enable row level security;
alter table public.estoque_saldos enable row level security;
alter table public.estoque_movimentos enable row level security;
alter table public.estoque_lotes enable row level security;

create or replace function public.pode_acessar_estoque()
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
        'Desenvolvedor', 'Administrador', 'Gerente', 'Estoquista', 'Logistica', 'CEO'
      )
  );
$$;

revoke all on function public.pode_acessar_estoque() from public;
grant execute on function public.pode_acessar_estoque() to authenticated;

create policy estoque_depositos_select on public.estoque_depositos
  for select to authenticated using (true);

create policy estoque_depositos_write on public.estoque_depositos
  for all to authenticated
  using (public.pode_acessar_estoque())
  with check (public.pode_acessar_estoque());

create policy estoque_saldos_select on public.estoque_saldos
  for select to authenticated using (true);

create policy estoque_saldos_write on public.estoque_saldos
  for all to authenticated
  using (public.pode_acessar_estoque())
  with check (public.pode_acessar_estoque());

create policy estoque_movimentos_select on public.estoque_movimentos
  for select to authenticated using (true);

create policy estoque_movimentos_write on public.estoque_movimentos
  for all to authenticated
  using (public.pode_acessar_estoque())
  with check (public.pode_acessar_estoque());

create policy estoque_lotes_select on public.estoque_lotes
  for select to authenticated using (true);

create policy estoque_lotes_write on public.estoque_lotes
  for all to authenticated
  using (public.pode_acessar_estoque())
  with check (public.pode_acessar_estoque());
