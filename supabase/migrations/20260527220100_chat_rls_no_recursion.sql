-- Chat: corrigir RLS para evitar recursão infinita
--
-- Problema:
-- - Policies que consultam public.chat_participants dentro do próprio SELECT da tabela
--   podem disparar "infinite recursion detected in policy".
--
-- Solução:
-- - Usar função SECURITY DEFINER com row_security=off para checar participação no thread.

create or replace function public.is_chat_participant(p_thread uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.chat_participants p
    where p.thread_id = p_thread
      and p.user_id = auth.uid()
  );
$$;

revoke all on function public.is_chat_participant(uuid) from public;
grant execute on function public.is_chat_participant(uuid) to authenticated;

alter table public.chat_participants enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists chat_participants_select on public.chat_participants;
create policy chat_participants_select
  on public.chat_participants for select to authenticated
  using (public.is_chat_participant(thread_id));

drop policy if exists chat_threads_select on public.chat_threads;
create policy chat_threads_select
  on public.chat_threads for select to authenticated
  using (public.is_chat_participant(chat_threads.id));

drop policy if exists chat_messages_select on public.chat_messages;
create policy chat_messages_select
  on public.chat_messages for select to authenticated
  using (public.is_chat_participant(chat_messages.thread_id));

drop policy if exists chat_messages_insert on public.chat_messages;
create policy chat_messages_insert
  on public.chat_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_chat_participant(chat_messages.thread_id)
  );

