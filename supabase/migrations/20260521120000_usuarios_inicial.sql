-- Ligeirinho Hub — perfil de usuário ligado ao Supabase Auth
-- Aplicar no SQL Editor do Supabase ou via: supabase db push

create type public.cargo_hub as enum (
  'Desenvolvedor',
  'Administrador',
  'Gerente',
  'Caixa',
  'Estoquista',
  'Logistica',
  'Financeiro',
  'Comercial',
  'Visualizador'
);

create table public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nome text not null,
  cargo public.cargo_hub not null default 'Visualizador',
  ativo boolean not null default true,
  paginas_permitidas text[] null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index usuarios_email_idx on public.usuarios (email);
create index usuarios_cargo_idx on public.usuarios (cargo);

alter table public.usuarios enable row level security;

-- Usuário autenticado lê o próprio perfil
create policy usuarios_select_own
  on public.usuarios
  for select
  to authenticated
  using (auth.uid() = id);

-- Admins leem todos (ajustar conforme evoluir o sistema)
create policy usuarios_select_admin
  on public.usuarios
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.usuarios u
      where u.id = auth.uid()
        and u.ativo = true
        and u.cargo in ('Desenvolvedor', 'Administrador')
    )
  );

-- Trigger: criar linha em usuarios ao registrar no Auth (opcional — útil em dev)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, email, nome, cargo)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(coalesce(new.email, ''), '@', 1)),
    'Visualizador'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Atualizar updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger usuarios_updated_at
  before update on public.usuarios
  for each row
  execute function public.set_updated_at();
