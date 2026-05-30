-- Gestão Fácil → Ligeirinho HUB — Fase 4: módulo financeiro

create type public.conta_financeira_natureza as enum ('receber', 'pagar');

create type public.conta_financeira_status as enum (
  'aberta',
  'parcial',
  'paga',
  'vencida',
  'cancelada'
);

create type public.comissao_status as enum ('pendente', 'paga', 'cancelada');

create type public.vale_desconto_status as enum (
  'ativo',
  'utilizado',
  'expirado',
  'cancelado'
);

-- Contas a receber / a pagar (título único)
create table public.contas_financeiras (
  id uuid primary key default gen_random_uuid(),
  natureza public.conta_financeira_natureza not null,
  tipo_conta_id uuid references public.tipos_conta (id) on delete set null,
  pessoa_id uuid references public.pessoas (id) on delete set null,
  pedido_id uuid references public.pedidos (id) on delete set null,
  descricao text not null,
  documento_ref text,
  valor_original numeric(12, 2) not null check (valor_original > 0),
  valor_saldo numeric(12, 2) not null check (valor_saldo >= 0),
  data_emissao date not null default current_date,
  data_vencimento date not null,
  status public.conta_financeira_status not null default 'aberta',
  forma_pagamento_id uuid references public.formas_pagamento (id) on delete set null,
  conta_bancaria_id uuid references public.contas_bancarias (id) on delete set null,
  observacoes text,
  legacy_gf_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger contas_financeiras_updated_at
  before update on public.contas_financeiras
  for each row execute function public.set_updated_at();

create index contas_financeiras_natureza_idx on public.contas_financeiras (natureza);
create index contas_financeiras_status_idx on public.contas_financeiras (status);
create index contas_financeiras_vencimento_idx on public.contas_financeiras (data_vencimento);
create index contas_financeiras_pessoa_idx on public.contas_financeiras (pessoa_id);
create index contas_financeiras_pedido_idx on public.contas_financeiras (pedido_id);

-- Baixas (pagamentos / recebimentos parciais ou totais)
create table public.contas_financeiras_baixas (
  id uuid primary key default gen_random_uuid(),
  conta_financeira_id uuid not null references public.contas_financeiras (id) on delete cascade,
  valor numeric(12, 2) not null check (valor > 0),
  data_baixa date not null default current_date,
  forma_pagamento_id uuid references public.formas_pagamento (id) on delete set null,
  conta_bancaria_id uuid references public.contas_bancarias (id) on delete set null,
  observacoes text,
  created_at timestamptz not null default now()
);

create index contas_financeiras_baixas_conta_idx
  on public.contas_financeiras_baixas (conta_financeira_id);

create table public.comissoes (
  id uuid primary key default gen_random_uuid(),
  vendedor_pessoa_id uuid references public.pessoas (id) on delete set null,
  pedido_id uuid references public.pedidos (id) on delete set null,
  descricao text not null,
  percentual numeric(5, 2),
  valor numeric(12, 2) not null check (valor >= 0),
  status public.comissao_status not null default 'pendente',
  data_referencia date not null default current_date,
  pago_em date,
  legacy_gf_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger comissoes_updated_at
  before update on public.comissoes
  for each row execute function public.set_updated_at();

create index comissoes_status_idx on public.comissoes (status);
create index comissoes_vendedor_idx on public.comissoes (vendedor_pessoa_id);

create table public.vales_desconto (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid references public.pessoas (id) on delete set null,
  codigo text,
  descricao text not null,
  valor_original numeric(12, 2) not null check (valor_original > 0),
  saldo numeric(12, 2) not null check (saldo >= 0),
  validade date,
  status public.vale_desconto_status not null default 'ativo',
  legacy_gf_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger vales_desconto_updated_at
  before update on public.vales_desconto
  for each row execute function public.set_updated_at();

create index vales_desconto_pessoa_idx on public.vales_desconto (pessoa_id);
create index vales_desconto_status_idx on public.vales_desconto (status);

-- Sincroniza flag inadimplente em pessoas (e clientes vinculados)
create or replace function public.gf_sync_inadimplencia_pessoa(p_pessoa_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inadimplente boolean;
begin
  if p_pessoa_id is null then
    return;
  end if;

  select exists (
    select 1
    from public.contas_financeiras c
    where c.pessoa_id = p_pessoa_id
      and c.natureza = 'receber'
      and c.valor_saldo > 0
      and c.status not in ('paga', 'cancelada')
      and c.data_vencimento < current_date
  ) into v_inadimplente;

  update public.pessoas
  set inadimplente = v_inadimplente
  where id = p_pessoa_id;

  update public.clientes
  set inadimplente = v_inadimplente
  where pessoa_id = p_pessoa_id;
end;
$$;

revoke all on function public.gf_sync_inadimplencia_pessoa(uuid) from public;
grant execute on function public.gf_sync_inadimplencia_pessoa(uuid) to authenticated;

-- Após baixa: atualiza saldo, status e inadimplência
create or replace function public.contas_financeiras_baixa_after()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conta public.contas_financeiras%rowtype;
  v_novo_saldo numeric(12, 2);
begin
  select * into v_conta
  from public.contas_financeiras
  where id = new.conta_financeira_id
  for update;

  if not found then
    raise exception 'Conta financeira não encontrada';
  end if;

  if v_conta.status = 'cancelada' or v_conta.status = 'paga' then
    raise exception 'Conta não permite baixa (status %)', v_conta.status;
  end if;

  v_novo_saldo := round((v_conta.valor_saldo - new.valor)::numeric, 2);

  if v_novo_saldo < 0 then
    raise exception 'Valor da baixa maior que o saldo em aberto';
  end if;

  update public.contas_financeiras
  set
    valor_saldo = v_novo_saldo,
    status = case
      when v_novo_saldo = 0 then 'paga'::public.conta_financeira_status
      else 'parcial'::public.conta_financeira_status
    end,
    updated_at = now()
  where id = v_conta.id;

  if v_conta.natureza = 'receber' and v_conta.pessoa_id is not null then
    perform public.gf_sync_inadimplencia_pessoa(v_conta.pessoa_id);
  end if;

  return new;
end;
$$;

create trigger contas_financeiras_baixa_after
  after insert on public.contas_financeiras_baixas
  for each row execute function public.contas_financeiras_baixa_after();

-- Marca títulos vencidos e atualiza inadimplência
create or replace function public.gf_marcar_contas_vencidas()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  r record;
begin
  with upd as (
    update public.contas_financeiras c
    set status = 'vencida', updated_at = now()
    where c.status in ('aberta', 'parcial')
      and c.valor_saldo > 0
      and c.data_vencimento < current_date
    returning c.pessoa_id
  )
  select count(*) into v_count from upd;

  for r in
    select distinct pessoa_id
    from public.contas_financeiras
    where natureza = 'receber'
      and pessoa_id is not null
      and valor_saldo > 0
      and status = 'vencida'
  loop
    perform public.gf_sync_inadimplencia_pessoa(r.pessoa_id);
  end loop;

  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.gf_marcar_contas_vencidas() from public;
grant execute on function public.gf_marcar_contas_vencidas() to authenticated;

-- RLS
alter table public.contas_financeiras enable row level security;
alter table public.contas_financeiras_baixas enable row level security;
alter table public.comissoes enable row level security;
alter table public.vales_desconto enable row level security;

create or replace function public.pode_acessar_financeiro()
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

revoke all on function public.pode_acessar_financeiro() from public;
grant execute on function public.pode_acessar_financeiro() to authenticated;

create policy contas_financeiras_select on public.contas_financeiras
  for select to authenticated using (true);

create policy contas_financeiras_write on public.contas_financeiras
  for all to authenticated
  using (public.pode_acessar_financeiro())
  with check (public.pode_acessar_financeiro());

create policy contas_financeiras_baixas_select on public.contas_financeiras_baixas
  for select to authenticated using (true);

create policy contas_financeiras_baixas_write on public.contas_financeiras_baixas
  for all to authenticated
  using (public.pode_acessar_financeiro())
  with check (public.pode_acessar_financeiro());

create policy comissoes_select on public.comissoes
  for select to authenticated using (true);

create policy comissoes_write on public.comissoes
  for all to authenticated
  using (public.pode_acessar_financeiro())
  with check (public.pode_acessar_financeiro());

create policy vales_desconto_select on public.vales_desconto
  for select to authenticated using (true);

create policy vales_desconto_write on public.vales_desconto
  for all to authenticated
  using (public.pode_acessar_financeiro())
  with check (public.pode_acessar_financeiro());
