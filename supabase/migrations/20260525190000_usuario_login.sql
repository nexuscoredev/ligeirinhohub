-- Login por nome de usuário (campo login) — e-mail técnico no Auth

alter table public.usuarios
  add column if not exists login text;

comment on column public.usuarios.login is
  'Nome de usuário para entrar no Hub (ex.: Vinicius). E-mail fica em email para o Supabase Auth.';

create unique index if not exists usuarios_login_lower_idx
  on public.usuarios (lower(login));

-- Resolve e-mail Auth a partir do login (anon pode chamar antes do sign-in)
create or replace function public.resolve_login_email(p_login text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email
  from public.usuarios u
  where lower(u.login) = lower(trim(p_login))
    and u.ativo = true
  limit 1;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_login text;
  v_nome text;
begin
  v_login := coalesce(
    new.raw_user_meta_data ->> 'login',
    split_part(coalesce(new.email, ''), '@', 1)
  );
  v_nome := coalesce(
    new.raw_user_meta_data ->> 'nome',
    v_login
  );

  insert into public.usuarios (id, email, login, nome, cargo)
  values (
    new.id,
    coalesce(new.email, ''),
    v_login,
    v_nome,
    'Visualizador'
  )
  on conflict (id) do update set
    email = excluded.email,
    login = coalesce(public.usuarios.login, excluded.login),
    nome = coalesce(nullif(public.usuarios.nome, ''), excluded.nome);

  return new;
end;
$$;
