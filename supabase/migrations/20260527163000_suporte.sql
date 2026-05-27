-- Solicitações / Suporte técnico (ticket simples)

create type public.suporte_status as enum ('aberto', 'resolvido');

create table if not exists public.suporte_tickets (
  id uuid primary key default gen_random_uuid(),
  criado_por uuid not null references public.usuarios (id) on delete restrict,
  titulo text not null,
  status public.suporte_status not null default 'aberto',
  resolvido_em timestamptz null,
  resolvido_por uuid references public.usuarios (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists suporte_tickets_status_idx on public.suporte_tickets (status, updated_at desc);
create index if not exists suporte_tickets_user_idx on public.suporte_tickets (criado_por, updated_at desc);

create table if not exists public.suporte_mensagens (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.suporte_tickets (id) on delete cascade,
  sender_id uuid not null references public.usuarios (id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists suporte_msg_ticket_created_idx on public.suporte_mensagens (ticket_id, created_at asc);

alter table public.suporte_tickets enable row level security;
alter table public.suporte_mensagens enable row level security;

-- Requester: read own tickets
create policy suporte_ticket_select_own
  on public.suporte_tickets for select to authenticated
  using (criado_por = auth.uid() or public.is_hub_admin());

create policy suporte_ticket_insert
  on public.suporte_tickets for insert to authenticated
  with check (criado_por = auth.uid());

create policy suporte_ticket_update_admin
  on public.suporte_tickets for update to authenticated
  using (public.is_hub_admin())
  with check (public.is_hub_admin());

create policy suporte_msg_select
  on public.suporte_mensagens for select to authenticated
  using (
    exists (
      select 1
      from public.suporte_tickets t
      where t.id = suporte_mensagens.ticket_id
        and (t.criado_por = auth.uid() or public.is_hub_admin())
    )
  );

create policy suporte_msg_insert
  on public.suporte_mensagens for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.suporte_tickets t
      where t.id = suporte_mensagens.ticket_id
        and (t.criado_por = auth.uid() or public.is_hub_admin())
    )
  );

-- Realtime
alter publication supabase_realtime add table public.suporte_mensagens;

