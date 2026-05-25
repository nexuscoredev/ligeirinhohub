-- Status por item na separação (sem quantidade digitada)

create type public.item_status_separacao as enum (
  'pendente',
  'separado',
  'indisponivel'
);

alter table public.pedido_itens
  add column status_separacao public.item_status_separacao not null default 'pendente';

update public.pedido_itens
set status_separacao = case
  when qty_separada is null then 'pendente'::public.item_status_separacao
  when qty_separada = 0 then 'indisponivel'::public.item_status_separacao
  else 'separado'::public.item_status_separacao
end;

create or replace function public.concluir_separacao_pedido(p_pedido_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.pedido_status;
  v_modalidade public.pedido_modalidade;
  v_pendente int;
  v_sep numeric(12, 2);
begin
  select status, modalidade into v_status, v_modalidade
  from public.pedidos where id = p_pedido_id for update;

  if v_status not in ('em_separacao', 'separacao_pausada') then
    raise exception 'Pedido não está em separação';
  end if;

  select count(*) into v_pendente
  from public.pedido_itens
  where pedido_id = p_pedido_id and status_separacao = 'pendente';

  if v_pendente > 0 then
    raise exception 'Defina o status de todos os itens antes de concluir';
  end if;

  select coalesce(sum(
    case
      when status_separacao = 'separado' then qty_pedida * preco_unitario
      else 0
    end
  ), 0) into v_sep
  from public.pedido_itens where pedido_id = p_pedido_id;

  update public.pedidos
  set
    status = 'separado',
    valor_separado = v_sep,
    separado_em = now(),
    separacao_pausada_em = null,
    updated_at = now()
  where id = p_pedido_id;

  update public.pedidos
  set status = case
    when v_modalidade = 'retirada' then 'aguardando_retirada'::public.pedido_status
    else 'aguardando_entrega'::public.pedido_status
  end
  where id = p_pedido_id;
end;
$$;
