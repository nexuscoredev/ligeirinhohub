-- Ligeirinho PDV (estilo Hera): sessão de caixa + colunas fiscais NFC-e
-- Idempotente para reaplicar com segurança.

-- 1) Enums ------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'caixa_turno_status') then
    create type public.caixa_turno_status as enum ('aberto', 'fechado');
  end if;
  if not exists (select 1 from pg_type where typname = 'caixa_movimento_tipo') then
    create type public.caixa_movimento_tipo as enum (
      'abertura', 'suprimento', 'sangria', 'retirada', 'fechamento'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'nfce_status') then
    create type public.nfce_status as enum (
      'nao_emitida', 'processando', 'autorizada', 'rejeitada', 'cancelada', 'contingencia'
    );
  end if;
end$$;

-- 2) Produtos: código de barras, unidade e preço de atacado -----------------
alter table public.produtos
  add column if not exists codigo_barras text,
  add column if not exists unidade text not null default 'UN',
  add column if not exists preco_atacado numeric(12, 2);

create index if not exists produtos_codigo_barras_idx
  on public.produtos (codigo_barras)
  where codigo_barras is not null;

-- 3) Sessão de caixa --------------------------------------------------------
create table if not exists public.caixa_turnos (
  id uuid primary key default gen_random_uuid(),
  caixa_numero int not null default 1,
  operador_id uuid not null references public.usuarios (id),
  status public.caixa_turno_status not null default 'aberto',
  valor_abertura numeric(12, 2) not null default 0,
  valor_fechamento_informado numeric(12, 2),
  valor_fechamento_apurado numeric(12, 2),
  aberto_em timestamptz not null default now(),
  fechado_em timestamptz,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists caixa_turnos_operador_idx on public.caixa_turnos (operador_id);
create index if not exists caixa_turnos_status_idx on public.caixa_turnos (status);

create table if not exists public.caixa_movimentos (
  id uuid primary key default gen_random_uuid(),
  turno_id uuid not null references public.caixa_turnos (id) on delete cascade,
  tipo public.caixa_movimento_tipo not null,
  valor numeric(12, 2) not null default 0,
  motivo text,
  usuario_id uuid references public.usuarios (id),
  created_at timestamptz not null default now()
);

create index if not exists caixa_movimentos_turno_idx on public.caixa_movimentos (turno_id);

-- 4) Colunas de caixa + fiscais em pedidos ----------------------------------
alter table public.pedidos
  add column if not exists caixa_turno_id uuid references public.caixa_turnos (id),
  add column if not exists cpf_consumidor text,
  add column if not exists documento_modelo text,
  add column if not exists nfce_status public.nfce_status not null default 'nao_emitida',
  add column if not exists nfce_numero text,
  add column if not exists nfce_serie text,
  add column if not exists nfce_chave text,
  add column if not exists nfce_protocolo text,
  add column if not exists nfce_qrcode text,
  add column if not exists nfce_xml_url text,
  add column if not exists nfce_danfe_url text,
  add column if not exists nfce_mensagem text,
  add column if not exists nfce_emitido_em timestamptz,
  add column if not exists nfce_ref text;

create index if not exists pedidos_caixa_turno_idx on public.pedidos (caixa_turno_id);
create index if not exists pedidos_nfce_status_idx on public.pedidos (nfce_status);

-- 5) Triggers updated_at ----------------------------------------------------
drop trigger if exists caixa_turnos_updated_at on public.caixa_turnos;
create trigger caixa_turnos_updated_at
  before update on public.caixa_turnos
  for each row execute function public.set_updated_at();

-- 6) RLS --------------------------------------------------------------------
alter table public.caixa_turnos enable row level security;
alter table public.caixa_movimentos enable row level security;

-- Pode operar caixa: Desenvolvedor, Administrador, Gerente, Caixa
create or replace function public.pode_operar_caixa()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios u
    where u.id = auth.uid() and u.ativo
      and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente', 'Caixa', 'CEO')
  );
$$;

revoke all on function public.pode_operar_caixa() from public;
grant execute on function public.pode_operar_caixa() to authenticated;

drop policy if exists caixa_turnos_select on public.caixa_turnos;
create policy caixa_turnos_select on public.caixa_turnos
  for select to authenticated using (true);

drop policy if exists caixa_turnos_write on public.caixa_turnos;
create policy caixa_turnos_write on public.caixa_turnos
  for all to authenticated
  using (public.pode_operar_caixa())
  with check (public.pode_operar_caixa());

drop policy if exists caixa_movimentos_select on public.caixa_movimentos;
create policy caixa_movimentos_select on public.caixa_movimentos
  for select to authenticated using (true);

drop policy if exists caixa_movimentos_write on public.caixa_movimentos;
create policy caixa_movimentos_write on public.caixa_movimentos
  for all to authenticated
  using (public.pode_operar_caixa())
  with check (public.pode_operar_caixa());

-- 7) Realtime ---------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.caixa_turnos;
  exception when duplicate_object then null;
  end;
end$$;
