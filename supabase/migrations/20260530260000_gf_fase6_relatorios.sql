-- Gestão Fácil → Ligeirinho HUB — Fase 6: relatórios gerenciais

create or replace function public.pode_acessar_relatorios()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios u
    where u.id = auth.uid() and u.ativo
      and u.cargo in (
        'Desenvolvedor', 'Administrador', 'Gerente', 'Financeiro', 'Comercial', 'CEO'
      )
  );
$$;

revoke all on function public.pode_acessar_relatorios() from public;
grant execute on function public.pode_acessar_relatorios() to authenticated;

-- Vendas por hora (pedidos concluídos no dia)
create or replace function public.gf_relatorio_vendas_por_hora(p_data date default current_date)
returns table (
  hora int,
  quantidade bigint,
  valor_total numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.pode_acessar_relatorios() then
    raise exception 'Acesso negado';
  end if;

  return query
  select
    extract(hour from p.created_at at time zone 'America/Sao_Paulo')::int as hora,
    count(*)::bigint as quantidade,
    coalesce(sum(p.valor_pedido), 0)::numeric(12, 2) as valor_total
  from public.pedidos p
  where p.status in ('concluido', 'entregue', 'retirado')
    and (p.created_at at time zone 'America/Sao_Paulo')::date = p_data
  group by 1
  order by 1;
end;
$$;

-- Vendas mensais NF-e (notas_fiscais) vs NFC-e (pedidos PDV)
create or replace function public.gf_relatorio_vendas_mensais_fiscal(p_meses int default 12)
returns table (
  mes date,
  nfe_quantidade bigint,
  nfe_valor numeric,
  nfce_quantidade bigint,
  nfce_valor numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_inicio date;
begin
  if not public.pode_acessar_relatorios() then
    raise exception 'Acesso negado';
  end if;

  if p_meses < 1 or p_meses > 24 then
    raise exception 'p_meses deve estar entre 1 e 24';
  end if;

  v_inicio := (date_trunc('month', current_date)::date - ((p_meses - 1) || ' months')::interval)::date;

  return query
  with meses as (
    select generate_series(
      date_trunc('month', v_inicio)::date,
      date_trunc('month', current_date)::date,
      '1 month'::interval
    )::date as mes
  ),
  nfe as (
    select
      date_trunc('month', coalesce(n.emitida_em, n.created_at))::date as mes,
      count(*)::bigint as qtd,
      coalesce(sum(n.valor_total), 0)::numeric(12, 2) as valor
    from public.notas_fiscais n
    where n.status = 'autorizada'
      and n.modelo = '55'
      and coalesce(n.emitida_em, n.created_at) >= v_inicio
    group by 1
  ),
  nfce as (
    select
      date_trunc('month', coalesce(p.nfce_emitido_em, p.created_at))::date as mes,
      count(*)::bigint as qtd,
      coalesce(sum(p.valor_pedido), 0)::numeric(12, 2) as valor
    from public.pedidos p
    where p.nfce_status = 'autorizada'
      and coalesce(p.nfce_emitido_em, p.created_at) >= v_inicio
    group by 1
  )
  select
    m.mes,
    coalesce(n.qtd, 0)::bigint,
    coalesce(n.valor, 0)::numeric(12, 2),
    coalesce(c.qtd, 0)::bigint,
    coalesce(c.valor, 0)::numeric(12, 2)
  from meses m
  left join nfe n on n.mes = m.mes
  left join nfce c on c.mes = m.mes
  order by m.mes;
end;
$$;

revoke all on function public.gf_relatorio_vendas_por_hora(date) from public;
grant execute on function public.gf_relatorio_vendas_por_hora(date) to authenticated;

revoke all on function public.gf_relatorio_vendas_mensais_fiscal(int) from public;
grant execute on function public.gf_relatorio_vendas_mensais_fiscal(int) to authenticated;
