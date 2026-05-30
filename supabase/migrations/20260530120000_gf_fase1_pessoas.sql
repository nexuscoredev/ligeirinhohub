-- Gestão Fácil → Ligeirinho HUB — Fase 1: pessoas + compat clientes

create type public.gf_tipo_pessoa as enum (
  'cliente',
  'fornecedor',
  'vendedor',
  'transportadora'
);

create table public.pessoas (
  id uuid primary key default gen_random_uuid(),
  tipos public.gf_tipo_pessoa[] not null default array['cliente']::public.gf_tipo_pessoa[],
  nome text not null,
  nome_fantasia text,
  cpf_cnpj text,
  email text,
  telefone text,
  endereco jsonb not null default '{}'::jsonb,
  tabela_preco text not null default 'padrao',
  dia_vencimento_semana int check (dia_vencimento_semana between 0 and 6),
  bloqueado_pedido boolean not null default false,
  inadimplente boolean not null default false,
  limite_credito numeric(12, 2),
  observacoes text,
  ativo boolean not null default true,
  legacy_gf_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pessoas_nome_idx on public.pessoas (nome);
create index pessoas_cpf_cnpj_idx on public.pessoas (cpf_cnpj) where cpf_cnpj is not null;
create index pessoas_tipos_idx on public.pessoas using gin (tipos);

create trigger pessoas_updated_at
  before update on public.pessoas
  for each row execute function public.set_updated_at();

-- Vínculo opcional: clientes existentes continuam funcionando
alter table public.clientes
  add column if not exists pessoa_id uuid references public.pessoas (id) on delete set null;

create unique index clientes_pessoa_id_idx on public.clientes (pessoa_id) where pessoa_id is not null;

-- Copia clientes atuais para pessoas (idempotente se reexecutado parcialmente)
do $$
declare
  r record;
  v_pessoa_id uuid;
begin
  for r in
    select c.*
    from public.clientes c
    where c.pessoa_id is null
  loop
    insert into public.pessoas (
      tipos,
      nome,
      nome_fantasia,
      tabela_preco,
      dia_vencimento_semana,
      bloqueado_pedido,
      inadimplente,
      observacoes,
      ativo
    ) values (
      array['cliente']::public.gf_tipo_pessoa[],
      r.nome,
      r.nome_fantasia,
      r.tabela_preco,
      r.dia_vencimento_semana,
      r.bloqueado_pedido,
      r.inadimplente,
      r.observacoes,
      r.ativo
    )
    returning id into v_pessoa_id;

    update public.clientes
    set pessoa_id = v_pessoa_id
    where id = r.id;
  end loop;
end;
$$;

-- Novos clientes criados pelo Operacional/PDV também geram pessoa
create or replace function public.trg_clientes_sync_pessoa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pessoa_id uuid;
begin
  if new.pessoa_id is null then
    insert into public.pessoas (
      tipos,
      nome,
      nome_fantasia,
      tabela_preco,
      dia_vencimento_semana,
      bloqueado_pedido,
      inadimplente,
      observacoes,
      ativo
    ) values (
      array['cliente']::public.gf_tipo_pessoa[],
      new.nome,
      new.nome_fantasia,
      new.tabela_preco,
      new.dia_vencimento_semana,
      new.bloqueado_pedido,
      new.inadimplente,
      new.observacoes,
      new.ativo
    )
    returning id into v_pessoa_id;

    new.pessoa_id := v_pessoa_id;
  else
    update public.pessoas
    set
      nome = new.nome,
      nome_fantasia = new.nome_fantasia,
      tabela_preco = new.tabela_preco,
      dia_vencimento_semana = new.dia_vencimento_semana,
      bloqueado_pedido = new.bloqueado_pedido,
      inadimplente = new.inadimplente,
      observacoes = new.observacoes,
      ativo = new.ativo,
      tipos = case
        when 'cliente' = any(tipos) then tipos
        else tipos || array['cliente']::public.gf_tipo_pessoa[]
      end,
      updated_at = now()
    where id = new.pessoa_id;
  end if;

  return new;
end;
$$;

drop trigger if exists clientes_sync_pessoa on public.clientes;
create trigger clientes_sync_pessoa
  before insert or update on public.clientes
  for each row execute function public.trg_clientes_sync_pessoa();

-- Ocorrências podem referenciar motivo cadastrado
alter table public.pedido_ocorrencias
  add column if not exists motivo_id uuid references public.motivos (id) on delete set null;

create index pedido_ocorrencias_motivo_idx on public.pedido_ocorrencias (motivo_id);

-- RLS pessoas
alter table public.pessoas enable row level security;

create policy pessoas_select on public.pessoas
  for select to authenticated using (true);

create policy pessoas_write_staff on public.pessoas
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
