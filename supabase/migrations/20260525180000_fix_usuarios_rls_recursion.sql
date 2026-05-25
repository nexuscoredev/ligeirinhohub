-- Corrige recursão infinita na RLS de usuarios (política admin consultava a própria tabela)

drop policy if exists usuarios_select_admin on public.usuarios;

create or replace function public.is_hub_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios u
    where u.id = auth.uid()
      and u.ativo = true
      and u.cargo in ('Desenvolvedor', 'Administrador')
  );
$$;

revoke all on function public.is_hub_admin() from public;
grant execute on function public.is_hub_admin() to authenticated;

create policy usuarios_select_admin
  on public.usuarios
  for select
  to authenticated
  using (public.is_hub_admin());
