-- Veículos (caminhões e frota) — cadastro para logística/rota

create table public.veiculos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  placa text,
  tipo text,
  capacidade_kg numeric(12, 2),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index veiculos_nome_idx on public.veiculos (nome);
create index veiculos_ativo_idx on public.veiculos (ativo);
create index veiculos_placa_idx on public.veiculos (placa);

create trigger veiculos_updated_at
  before update on public.veiculos
  for each row execute function public.set_updated_at();

alter table public.veiculos enable row level security;

create policy veiculos_select on public.veiculos
  for select to authenticated using (true);

create policy veiculos_write_staff on public.veiculos
  for all to authenticated
  using (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.ativo
        and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente', 'Logistica')
    )
  )
  with check (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.ativo
        and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente', 'Logistica')
    )
  );

