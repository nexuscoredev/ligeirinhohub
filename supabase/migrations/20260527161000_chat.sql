-- Chat (DM) entre usuários

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.usuarios (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_participants (
  thread_id uuid not null references public.chat_threads (id) on delete cascade,
  user_id uuid not null references public.usuarios (id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz null,
  primary key (thread_id, user_id)
);

create index if not exists chat_participants_user_idx on public.chat_participants (user_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads (id) on delete cascade,
  sender_id uuid not null references public.usuarios (id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_thread_created_idx
  on public.chat_messages (thread_id, created_at desc);

-- updated_at on thread when new message
create or replace function public.touch_chat_thread(p_thread uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.chat_threads set updated_at = now() where id = p_thread;
$$;

create or replace function public.chat_messages_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.touch_chat_thread(new.thread_id);
  return new;
end;
$$;

drop trigger if exists chat_messages_touch_thread on public.chat_messages;
create trigger chat_messages_touch_thread
  after insert on public.chat_messages
  for each row execute function public.chat_messages_after_insert();

alter table public.chat_threads enable row level security;
alter table public.chat_participants enable row level security;
alter table public.chat_messages enable row level security;

-- Policies
create policy chat_threads_select
  on public.chat_threads for select to authenticated
  using (
    exists (
      select 1 from public.chat_participants p
      where p.thread_id = chat_threads.id
        and p.user_id = auth.uid()
    )
  );

create policy chat_threads_insert
  on public.chat_threads for insert to authenticated
  with check (created_by = auth.uid());

create policy chat_participants_select
  on public.chat_participants for select to authenticated
  using (user_id = auth.uid());

create policy chat_participants_insert_owner
  on public.chat_participants for insert to authenticated
  with check (user_id = auth.uid());

create policy chat_participants_update_own
  on public.chat_participants for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy chat_messages_select
  on public.chat_messages for select to authenticated
  using (
    exists (
      select 1 from public.chat_participants p
      where p.thread_id = chat_messages.thread_id
        and p.user_id = auth.uid()
    )
  );

create policy chat_messages_insert
  on public.chat_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_participants p
      where p.thread_id = chat_messages.thread_id
        and p.user_id = auth.uid()
    )
  );

-- Realtime
alter publication supabase_realtime add table public.chat_messages;
