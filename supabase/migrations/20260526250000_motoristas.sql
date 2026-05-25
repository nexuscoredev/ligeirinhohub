-- Motoristas (entregadores) — cadastro independente de usuário Hub

create table public.motoristas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  placa text,
  ativo boolean not null default true,
  usuario_id uuid references public.usuarios (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index motoristas_nome_idx on public.motoristas (nome);
create index motoristas_ativo_idx on public.motoristas (ativo);

create trigger motoristas_updated_at
  before update on public.motoristas
  for each row execute function public.set_updated_at();

alter table public.motoristas enable row level security;

create policy motoristas_select on public.motoristas
  for select to authenticated using (true);

create policy motoristas_write_staff on public.motoristas
  for all to authenticated
  using (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.ativo
        and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente')
    )
  )
  with check (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.ativo
        and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente')
    )
  );

insert into public.motoristas (nome, telefone, placa) values
  ('João Silva', '(11) 98765-4321', 'ABC-1D23'),
  ('Marcos Oliveira', '(11) 97654-3210', 'DEF-4G56'),
  ('Pedro Santos', '(11) 96543-2109', null);
