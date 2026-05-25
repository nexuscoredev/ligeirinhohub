-- Permite admins atualizarem perfis na tabela usuarios

create policy usuarios_update_admin
  on public.usuarios
  for update
  to authenticated
  using (public.is_hub_admin())
  with check (public.is_hub_admin());
