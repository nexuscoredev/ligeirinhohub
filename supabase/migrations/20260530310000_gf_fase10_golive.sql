-- Gestão Fácil → Ligeirinho HUB — Fase 10: go-live e descomissionamento GF

create table if not exists public.gf_golive_checklist (
  criterio text primary key,
  titulo text not null,
  automatico boolean not null default false,
  confirmado boolean not null default false,
  confirmado_por uuid references public.usuarios (id) on delete set null,
  confirmado_em timestamptz,
  observacoes text,
  updated_at timestamptz not null default now()
);

create trigger gf_golive_checklist_updated_at
  before update on public.gf_golive_checklist
  for each row execute function public.set_updated_at();

insert into public.gf_golive_checklist (criterio, titulo, automatico) values
  ('operacao_fluxo', 'Pedido → separação → entrega operando no HUB', true),
  ('pdv_nfce_producao', 'PDV emite NFC-e em produção', true),
  ('financeiro_inadimplencia', 'Contas a receber refletem inadimplência', true),
  ('gf_parado_7d', 'Nenhum pedido novo no GF por 7 dias', false)
on conflict (criterio) do nothing;

alter table public.gf_golive_checklist enable row level security;

create policy gf_golive_checklist_select on public.gf_golive_checklist
  for select to authenticated using (public.is_hub_admin());

create policy gf_golive_checklist_write on public.gf_golive_checklist
  for all to authenticated
  using (public.is_hub_admin()) with check (public.is_hub_admin());

-- Avaliação automática + confirmações manuais
create or replace function public.gf_golive_avaliar()
returns table (
  criterio text,
  titulo text,
  ok boolean,
  automatico boolean,
  detalhe text,
  confirmado_manual boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_concluidos int;
  v_serie_prod int;
  v_nfce_prod int;
  v_desync int;
  v_manual boolean;
begin
  if not public.is_hub_admin() then
    raise exception 'Acesso negado';
  end if;

  select count(*) into v_concluidos
  from public.pedidos
  where status in ('entregue', 'retirado', 'concluido')
    and created_at >= now() - interval '90 days';

  return query
  select
    'operacao_fluxo'::text,
    c.titulo,
    v_concluidos > 0,
    true,
    format('%s pedido(s) concluído(s) nos últimos 90 dias', v_concluidos),
    c.confirmado
  from public.gf_golive_checklist c
  where c.criterio = 'operacao_fluxo';

  select count(*) into v_serie_prod
  from public.series_fiscais
  where modelo = '65' and ambiente = 'producao' and ativo = true;

  select count(*) into v_nfce_prod
  from public.pedidos p
  join public.series_fiscais s on s.serie = p.nfce_serie and s.modelo = '65'
  where p.nfce_status = 'autorizada'
    and s.ambiente = 'producao'
  limit 1;

  return query
  select
    'pdv_nfce_producao'::text,
    c.titulo,
    v_serie_prod > 0 and (v_nfce_prod > 0 or exists (
      select 1 from public.empresa_config e
      where e.ativo and e.fiscal_ambiente = 'producao'
    )),
    true,
    format(
      'Série produção: %s · NFC-e autorizadas prod: %s',
      v_serie_prod, v_nfce_prod
    ),
    c.confirmado
  from public.gf_golive_checklist c
  where c.criterio = 'pdv_nfce_producao';

  select count(*) into v_desync
  from public.contas_financeiras cf
  join public.pessoas p on p.id = cf.pessoa_id
  where cf.natureza = 'receber'
    and cf.status = 'vencida'
    and cf.valor_saldo > 0
    and p.inadimplente = false;

  return query
  select
    'financeiro_inadimplencia'::text,
    c.titulo,
    v_desync = 0,
    true,
    case
      when v_desync = 0 then 'Inadimplência sincronizada com contas vencidas'
      else format('%s pessoa(s) com conta vencida sem flag inadimplente', v_desync)
    end,
    c.confirmado
  from public.gf_golive_checklist c
  where c.criterio = 'financeiro_inadimplencia';

  select c.confirmado into v_manual
  from public.gf_golive_checklist c
  where c.criterio = 'gf_parado_7d';

  return query
  select
    'gf_parado_7d'::text,
    c.titulo,
    coalesce(c.confirmado, false),
    false,
    coalesce(c.observacoes, 'Confirmação manual — GF sem pedidos novos por 7 dias'),
    c.confirmado
  from public.gf_golive_checklist c
  where c.criterio = 'gf_parado_7d';
end;
$$;

revoke all on function public.gf_golive_avaliar() from public;
grant execute on function public.gf_golive_avaliar() to authenticated;

create or replace function public.gf_golive_confirmar(
  p_criterio text,
  p_confirmado boolean,
  p_observacoes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_hub_admin() then
    raise exception 'Acesso negado';
  end if;

  update public.gf_golive_checklist
  set
    confirmado = p_confirmado,
    confirmado_por = auth.uid(),
    confirmado_em = case when p_confirmado then now() else null end,
    observacoes = nullif(trim(p_observacoes), '')
  where criterio = p_criterio and automatico = false;

  if not found then
    raise exception 'Critério manual não encontrado: %', p_criterio;
  end if;
end;
$$;

revoke all on function public.gf_golive_confirmar(text, boolean, text) from public;
grant execute on function public.gf_golive_confirmar(text, boolean, text) to authenticated;
