-- Perfil do usuário: foto, bio, telefone + storage de avatares

alter table public.usuarios
  add column if not exists avatar_url text null,
  add column if not exists bio text null,
  add column if not exists telefone text null;

comment on column public.usuarios.avatar_url is 'URL pública do avatar (bucket avatars)';
comment on column public.usuarios.bio is 'Bio curta exibida no perfil';
comment on column public.usuarios.telefone is 'Telefone de contato opcional';

-- Usuário atualiza o próprio perfil (campos não sensíveis)
drop policy if exists usuarios_update_own on public.usuarios;
create policy usuarios_update_own
  on public.usuarios
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Bucket de avatares (leitura pública, escrita só na própria pasta)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_select on storage.objects;
create policy avatars_select
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
