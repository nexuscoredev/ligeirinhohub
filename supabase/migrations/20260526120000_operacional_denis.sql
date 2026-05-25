-- Ligeirinho Hub — Onda 0/1: pedidos, separação, clientes, produtos (reunião Denis)

-- Enums
create type public.pedido_status as enum (
  'orcamento',
  'aguardando_separacao',
  'em_separacao',
  'separacao_pausada',
  'separado',
  'aguardando_retirada',
  'aguardando_entrega',
  'em_rota',
  'retirado',
  'entregue',
  'concluido',
  'com_ocorrencia',
  'refazer_separacao'
);

create type public.pedido_origem as enum (
  'whatsapp',
  'kaena',
  'balcao',
  'totem',
  'app',
  'hub'
);

create type public.pedido_modalidade as enum (
  'retirada',
  'entrega'
);

create type public.ocorrencia_tipo as enum (
  'entrega',
  'separacao',
  'outro'
);

-- Categorias (ordem na separação: whisky, cerveja, etc.)
create table public.categorias_produto (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  ordem_separacao int not null default 0,
  created_at timestamptz not null default now()
);

-- Produtos
create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.categorias_produto (id),
  nome text not null,
  sku text,
  imagem_url text,
  preco_base numeric(12, 2) not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index produtos_categoria_idx on public.produtos (categoria_id);
create index produtos_nome_idx on public.produtos (nome);

-- Clientes
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  nome_fantasia text,
  tabela_preco text not null default 'padrao',
  dia_vencimento_semana int check (dia_vencimento_semana between 0 and 6),
  bloqueado_pedido boolean not null default false,
  inadimplente boolean not null default false,
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clientes_nome_idx on public.clientes (nome);

-- Pedidos
create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero serial,
  cliente_id uuid not null references public.clientes (id),
  status public.pedido_status not null default 'orcamento',
  origem public.pedido_origem not null default 'whatsapp',
  modalidade public.pedido_modalidade not null default 'entrega',
  prioridade int not null default 0,
  valor_pedido numeric(12, 2) not null default 0,
  valor_separado numeric(12, 2),
  orcamento_em timestamptz not null default now(),
  aceito_em timestamptz,
  separacao_iniciada_em timestamptz,
  separacao_pausada_em timestamptz,
  separado_em timestamptz,
  separador_id uuid references public.usuarios (id),
  impresso_em timestamptz,
  entregue_em timestamptz,
  retirado_em timestamptz,
  retirado_por_nome text,
  tem_ocorrencia boolean not null default false,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pedidos_status_idx on public.pedidos (status);
create index pedidos_cliente_idx on public.pedidos (cliente_id);
create index pedidos_fila_idx on public.pedidos (prioridade desc, aceito_em nulls last, created_at);

-- Itens (preço congelado; qtd separada independente)
create table public.pedido_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  produto_id uuid not null references public.produtos (id),
  nome_snapshot text not null,
  categoria_ordem int not null default 0,
  qty_pedida numeric(12, 3) not null check (qty_pedida > 0),
  qty_separada numeric(12, 3) check (qty_separada is null or qty_separada >= 0),
  preco_unitario numeric(12, 2) not null check (preco_unitario >= 0),
  separado_ok boolean not null default false,
  created_at timestamptz not null default now()
);

create index pedido_itens_pedido_idx on public.pedido_itens (pedido_id);

-- Ocorrências
create table public.pedido_ocorrencias (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  tipo public.ocorrencia_tipo not null default 'outro',
  descricao text not null,
  alerta_imediato boolean not null default false,
  resolvida boolean not null default false,
  resolvida_em timestamptz,
  resolvida_por uuid references public.usuarios (id),
  criado_por uuid references public.usuarios (id),
  created_at timestamptz not null default now()
);

create index pedido_ocorrencias_pedido_idx on public.pedido_ocorrencias (pedido_id);

-- Auditoria
create table public.pedido_eventos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos (id) on delete cascade,
  usuario_id uuid references public.usuarios (id),
  acao text not null,
  detalhes jsonb,
  created_at timestamptz not null default now()
);

create index pedido_eventos_pedido_idx on public.pedido_eventos (pedido_id);

-- Triggers updated_at
create trigger produtos_updated_at
  before update on public.produtos
  for each row execute function public.set_updated_at();

create trigger clientes_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();

create trigger pedidos_updated_at
  before update on public.pedidos
  for each row execute function public.set_updated_at();

-- Recalcula totais do pedido
create or replace function public.recalcular_totais_pedido(p_pedido_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.pedido_status;
  v_pedido numeric(12, 2);
  v_sep numeric(12, 2);
begin
  select status into v_status from public.pedidos where id = p_pedido_id;

  select coalesce(sum(qty_pedida * preco_unitario), 0),
         coalesce(sum(coalesce(qty_separada, qty_pedida) * preco_unitario), 0)
  into v_pedido, v_sep
  from public.pedido_itens
  where pedido_id = p_pedido_id;

  update public.pedidos
  set
    valor_pedido = v_pedido,
    valor_separado = case
      when v_status in (
        'separado', 'aguardando_retirada', 'aguardando_entrega',
        'em_rota', 'retirado', 'entregue', 'concluido'
      ) then v_sep
      else valor_separado
    end,
    updated_at = now()
  where id = p_pedido_id;
end;
$$;

-- Concluir separação (separador)
create or replace function public.concluir_separacao_pedido(p_pedido_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.pedido_status;
  v_modalidade public.pedido_modalidade;
  v_pendente int;
  v_sep numeric(12, 2);
begin
  select status, modalidade into v_status, v_modalidade
  from public.pedidos where id = p_pedido_id for update;

  if v_status not in ('em_separacao', 'separacao_pausada') then
    raise exception 'Pedido não está em separação';
  end if;

  select count(*) into v_pendente
  from public.pedido_itens
  where pedido_id = p_pedido_id and qty_separada is null;

  if v_pendente > 0 then
    raise exception 'Informe a quantidade separada em todos os itens';
  end if;

  select coalesce(sum(qty_separada * preco_unitario), 0) into v_sep
  from public.pedido_itens where pedido_id = p_pedido_id;

  update public.pedidos
  set
    status = 'separado',
    valor_separado = v_sep,
    separado_em = now(),
    separacao_pausada_em = null,
    updated_at = now()
  where id = p_pedido_id;

  update public.pedidos
  set status = case
    when v_modalidade = 'retirada' then 'aguardando_retirada'::public.pedido_status
    else 'aguardando_entrega'::public.pedido_status
  end
  where id = p_pedido_id;
end;
$$;

revoke all on function public.recalcular_totais_pedido(uuid) from public;
grant execute on function public.recalcular_totais_pedido(uuid) to authenticated;
revoke all on function public.concluir_separacao_pedido(uuid) from public;
grant execute on function public.concluir_separacao_pedido(uuid) to authenticated;

-- RLS
alter table public.categorias_produto enable row level security;
alter table public.produtos enable row level security;
alter table public.clientes enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;
alter table public.pedido_ocorrencias enable row level security;
alter table public.pedido_eventos enable row level security;

create policy categorias_select on public.categorias_produto for select to authenticated using (true);
create policy produtos_select on public.produtos for select to authenticated using (true);
create policy produtos_write_admin on public.produtos for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());

create policy clientes_select on public.clientes for select to authenticated using (true);
create policy clientes_write_staff on public.clientes for all to authenticated
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

create policy pedidos_select on public.pedidos for select to authenticated using (true);

create policy pedidos_insert_staff on public.pedidos for insert to authenticated
  with check (
    exists (
      select 1 from public.usuarios u where u.id = auth.uid() and u.ativo
        and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente', 'Comercial', 'Caixa')
    )
  );

create policy pedidos_update_operacional on public.pedidos for update to authenticated
  using (
    exists (
      select 1 from public.usuarios u where u.id = auth.uid() and u.ativo
        and u.cargo in (
          'Desenvolvedor', 'Administrador', 'Gerente',
          'Estoquista', 'Logistica', 'Caixa'
        )
    )
  );

create policy pedido_itens_select on public.pedido_itens for select to authenticated using (true);
create policy pedido_itens_write on public.pedido_itens for all to authenticated
  using (true) with check (true);

create policy ocorrencias_select on public.pedido_ocorrencias for select to authenticated using (true);
create policy ocorrencias_insert on public.pedido_ocorrencias for insert to authenticated with check (true);
create policy ocorrencias_update_admin on public.pedido_ocorrencias for update to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());

create policy eventos_select on public.pedido_eventos for select to authenticated using (true);
create policy eventos_insert on public.pedido_eventos for insert to authenticated with check (true);

-- Realtime fila
alter publication supabase_realtime add table public.pedidos;
