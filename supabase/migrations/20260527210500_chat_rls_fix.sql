-- Ajustes de RLS do Chat (widget)
-- Motivo:
-- - Criar DM insere 2 participantes (usuário + peer) e a policy antiga só permitia inserir o próprio user_id.
-- - Listar participantes/peers precisava permitir ler participantes do mesmo thread.

alter table public.chat_threads enable row level security;
alter table public.chat_participants enable row level security;
alter table public.chat_messages enable row level security;

-- Threads: mantém insert restrito ao dono
drop policy if exists chat_threads_insert on public.chat_threads;
create policy chat_threads_insert
  on public.chat_threads for insert to authenticated
  with check (created_by = auth.uid());

-- Participants: ler participantes de threads que eu participo
drop policy if exists chat_participants_select on public.chat_participants;
create policy chat_participants_select
  on public.chat_participants for select to authenticated
  using (
    exists (
      select 1
      from public.chat_participants me
      where me.thread_id = chat_participants.thread_id
        and me.user_id = auth.uid()
    )
  );

-- Participants: permitir inserir a si mesmo OU, se eu criei o thread, adicionar os demais participantes
drop policy if exists chat_participants_insert_owner on public.chat_participants;
create policy chat_participants_insert_owner
  on public.chat_participants for insert to authenticated
  with check (
    user_id = auth.uid()
    or exists (
      select 1
      from public.chat_threads t
      where t.id = chat_participants.thread_id
        and t.created_by = auth.uid()
    )
  );

-- Update: mantém somente o próprio row (last_read_at)
drop policy if exists chat_participants_update_own on public.chat_participants;
create policy chat_participants_update_own
  on public.chat_participants for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

