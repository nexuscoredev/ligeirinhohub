-- Gestão Fácil → Ligeirinho HUB — Fase 0: schema base (aditivo, sem quebrar existente)

-- Enums compartilhados (GF)
create type public.gf_motivo_tipo as enum (
  'cancelamento',
  'devolucao',
  'ocorrencia',
  'desconto'
);

create type public.gf_forma_pagamento_tipo as enum (
  'dinheiro',
  'pix',
  'cartao_debito',
  'cartao_credito',
  'boleto',
  'prazo'
);

create type public.gf_regime_tributario as enum (
  'simples',
  'presumido',
  'real'
);

create type public.gf_tipo_conta_natureza as enum (
  'receita',
  'despesa'
);

-- Configuração da empresa (single-tenant; preparado para multi-CNPJ futuro)
create table public.empresa_config (
  id uuid primary key default gen_random_uuid(),
  razao_social text not null,
  nome_fantasia text,
  cnpj text unique,
  inscricao_estadual text,
  regime_tributario public.gf_regime_tributario not null default 'simples',
  endereco jsonb not null default '{}'::jsonb,
  certificado_fiscal_ref text,
  ativo boolean not null default true,
  legacy_gf_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger empresa_config_updated_at
  before update on public.empresa_config
  for each row execute function public.set_updated_at();

-- Motivos (cancelamento, devolução, ocorrência, desconto)
create table public.motivos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  descricao text not null,
  tipo public.gf_motivo_tipo not null default 'ocorrencia',
  ativo boolean not null default true,
  legacy_gf_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger motivos_updated_at
  before update on public.motivos
  for each row execute function public.set_updated_at();

create index motivos_tipo_idx on public.motivos (tipo);

-- Formas de pagamento configuráveis
create table public.formas_pagamento (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  tipo public.gf_forma_pagamento_tipo not null,
  gera_conta_receber boolean not null default false,
  dias_prazo int not null default 0 check (dias_prazo >= 0),
  ativo boolean not null default true,
  legacy_gf_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger formas_pagamento_updated_at
  before update on public.formas_pagamento
  for each row execute function public.set_updated_at();

-- Tipos de conta (classificação financeira)
create table public.tipos_conta (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  natureza public.gf_tipo_conta_natureza not null,
  ativo boolean not null default true,
  legacy_gf_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tipos_conta_updated_at
  before update on public.tipos_conta
  for each row execute function public.set_updated_at();

-- Contas bancárias
create table public.contas_bancarias (
  id uuid primary key default gen_random_uuid(),
  banco_codigo text not null,
  agencia text not null,
  conta text not null,
  titular text not null,
  ativo boolean not null default true,
  legacy_gf_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger contas_bancarias_updated_at
  before update on public.contas_bancarias
  for each row execute function public.set_updated_at();

-- Produtos: colunas fiscais/estoque (nullable — não afeta PDV/Operacional)
alter table public.produtos add column if not exists ean text;
alter table public.produtos add column if not exists ncm text;
alter table public.produtos add column if not exists cfop_padrao text;
alter table public.produtos add column if not exists cst_icms text;
alter table public.produtos add column if not exists aliquota_icms numeric(5, 2);
alter table public.produtos add column if not exists unidade text not null default 'UN';
alter table public.produtos add column if not exists estoque_minimo numeric(12, 3);
alter table public.produtos add column if not exists controla_lote boolean not null default false;
alter table public.produtos add column if not exists controla_validade boolean not null default false;
alter table public.produtos add column if not exists legacy_gf_id text;

create index if not exists produtos_ean_idx on public.produtos (ean) where ean is not null;
create index if not exists produtos_ncm_idx on public.produtos (ncm) where ncm is not null;

-- Seeds: formas de pagamento padrão (compatível com PDV atual)
insert into public.formas_pagamento (codigo, nome, tipo, gera_conta_receber, dias_prazo) values
  ('DIN', 'Dinheiro', 'dinheiro', false, 0),
  ('PIX', 'PIX', 'pix', false, 0),
  ('DEB', 'Cartão débito', 'cartao_debito', false, 0),
  ('CRE', 'Cartão crédito', 'cartao_credito', false, 0),
  ('BOL', 'Boleto', 'boleto', true, 30),
  ('PRZ', 'Prazo / crediário', 'prazo', true, 7)
on conflict (codigo) do nothing;

-- Seeds: motivos padrão
insert into public.motivos (codigo, descricao, tipo) values
  ('CAN-001', 'Cancelamento solicitado pelo cliente', 'cancelamento'),
  ('CAN-002', 'Cancelamento por erro de digitação', 'cancelamento'),
  ('DEV-001', 'Devolução parcial na entrega', 'devolucao'),
  ('DEV-002', 'Produto trocado (ex.: whisky errado)', 'devolucao'),
  ('OCO-001', 'Falta de item na separação', 'ocorrencia'),
  ('OCO-002', 'Avaria no transporte', 'ocorrencia'),
  ('DSC-001', 'Desconto comercial autorizado', 'desconto')
on conflict (codigo) do nothing;

-- RLS
alter table public.empresa_config enable row level security;
alter table public.motivos enable row level security;
alter table public.formas_pagamento enable row level security;
alter table public.tipos_conta enable row level security;
alter table public.contas_bancarias enable row level security;

-- Leitura: usuários autenticados
create policy empresa_config_select on public.empresa_config
  for select to authenticated using (true);

create policy motivos_select on public.motivos
  for select to authenticated using (true);

create policy formas_pagamento_select on public.formas_pagamento
  for select to authenticated using (true);

create policy tipos_conta_select on public.tipos_conta
  for select to authenticated using (true);

create policy contas_bancarias_select on public.contas_bancarias
  for select to authenticated using (true);

-- Escrita: admins do hub
create policy empresa_config_write_admin on public.empresa_config
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());

create policy motivos_write_admin on public.motivos
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());

create policy formas_pagamento_write_admin on public.formas_pagamento
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());

create policy tipos_conta_write_admin on public.tipos_conta
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());

create policy contas_bancarias_write_admin on public.contas_bancarias
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());
