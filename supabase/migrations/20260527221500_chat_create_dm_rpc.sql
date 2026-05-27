-- Chat DM: SELECT pós-insert + RPC para criar conversa sem falha de RLS

drop policy if exists chat_threads_select on public.chat_threads;
create policy chat_threads_select
  on public.chat_threads for select to authenticated
  using (
    public.is_chat_participant(id)
    or created_by = auth.uid()
  );

create or replace function public.create_or_get_chat_dm(p_peer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_uid uuid := auth.uid();
  v_thread uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if p_peer_id is null or p_peer_id = v_uid then
    raise exception 'invalid peer';
  end if;

  if not exists (
    select 1 from public.usuarios u
    where u.id = p_peer_id and u.ativo = true
  ) then
    raise exception 'peer not found';
  end if;

  select cp1.thread_id into v_thread
  from public.chat_participants cp1
  inner join public.chat_participants cp2
    on cp2.thread_id = cp1.thread_id and cp2.user_id = p_peer_id
  where cp1.user_id = v_uid
  order by cp1.joined_at desc
  limit 1;

  if v_thread is not null then
    return v_thread;
  end if;

  insert into public.chat_threads (created_by)
  values (v_uid)
  returning id into v_thread;

  insert into public.chat_participants (thread_id, user_id)
  values (v_thread, v_uid), (v_thread, p_peer_id);

  return v_thread;
end;
$$;

revoke all on function public.create_or_get_chat_dm(uuid) from public;
grant execute on function public.create_or_get_chat_dm(uuid) to authenticated;
