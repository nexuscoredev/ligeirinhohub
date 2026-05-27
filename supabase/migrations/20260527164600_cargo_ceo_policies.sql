-- Cargo CEO: comportamento equivalente a admin/gerente

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
      and u.cargo in ('Desenvolvedor', 'Administrador', 'CEO')
  );
$$;

revoke all on function public.is_hub_admin() from public;
grant execute on function public.is_hub_admin() to authenticated;

drop policy if exists clientes_write_staff on public.clientes;
create policy clientes_write_staff on public.clientes for all to authenticated
  using (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.ativo
        and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente', 'CEO', 'Comercial')
    )
  )
  with check (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.ativo
        and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente', 'CEO', 'Comercial')
    )
  );

drop policy if exists pedidos_insert_staff on public.pedidos;
create policy pedidos_insert_staff on public.pedidos for insert to authenticated
  with check (
    exists (
      select 1 from public.usuarios u where u.id = auth.uid() and u.ativo
        and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente', 'CEO', 'Comercial', 'Caixa')
    )
  );

drop policy if exists pedidos_update_operacional on public.pedidos;
create policy pedidos_update_operacional on public.pedidos for update to authenticated
  using (
    exists (
      select 1 from public.usuarios u where u.id = auth.uid() and u.ativo
        and u.cargo in (
          'Desenvolvedor', 'Administrador', 'Gerente', 'CEO',
          'Estoquista', 'Logistica', 'Caixa'
        )
    )
  );

drop policy if exists motoristas_write_staff on public.motoristas;
create policy motoristas_write_staff on public.motoristas
  for all to authenticated
  using (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.ativo
        and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente', 'CEO')
    )
  )
  with check (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.ativo
        and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente', 'CEO')
    )
  );

do $$
begin
  if to_regclass('public.veiculos') is not null then
    execute 'drop policy if exists veiculos_write_staff on public.veiculos';
    execute $p$
      create policy veiculos_write_staff on public.veiculos
        for all to authenticated
        using (
          exists (
            select 1 from public.usuarios u
            where u.id = auth.uid() and u.ativo
              and u.cargo in (''Desenvolvedor'', ''Administrador'', ''Gerente'', ''CEO'', ''Logistica'')
          )
        )
        with check (
          exists (
            select 1 from public.usuarios u
            where u.id = auth.uid() and u.ativo
              and u.cargo in (''Desenvolvedor'', ''Administrador'', ''Gerente'', ''CEO'', ''Logistica'')
          )
        )
    $p$;
  end if;
end $$;

drop policy if exists promocoes_write_staff on public.promocoes;
create policy promocoes_write_staff on public.promocoes
  for all to authenticated
  using (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.ativo
        and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente', 'CEO', 'Comercial')
    )
  )
  with check (
    exists (
      select 1 from public.usuarios u
      where u.id = auth.uid() and u.ativo
        and u.cargo in ('Desenvolvedor', 'Administrador', 'Gerente', 'CEO', 'Comercial')
    )
  );

