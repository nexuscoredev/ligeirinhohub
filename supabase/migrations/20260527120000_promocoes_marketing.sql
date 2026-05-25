-- Ligeirinho Marketing — promoções para TV na loja

create table public.promocoes (
  id uuid primary key default gen_random_uuid(),
  produto_sku text not null,
  produto_nome text not null,
  preco_original numeric(12, 2) not null check (preco_original >= 0),
  preco_promo numeric(12, 2) not null check (preco_promo >= 0),
  validade_inicio date not null,
  validade_fim date not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (validade_fim >= validade_inicio)
);

create index promocoes_ativo_idx on public.promocoes (ativo);
create index promocoes_validade_fim_idx on public.promocoes (validade_fim);
create index promocoes_sku_idx on public.promocoes (produto_sku);

create trigger promocoes_updated_at
  before update on public.promocoes
  for each row execute function public.set_updated_at();

alter table public.promocoes enable row level security;

create policy promocoes_select on public.promocoes
  for select to authenticated using (true);

create policy promocoes_write_comercial on public.promocoes
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

alter publication supabase_realtime add table public.promocoes;
