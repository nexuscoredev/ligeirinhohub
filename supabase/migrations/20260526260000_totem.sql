-- Totem: pagamento split no pedido + cliente varejo

alter table public.pedidos
  add column if not exists pagamento_split jsonb;

comment on column public.pedidos.pagamento_split is
  'Split de pagamento definido no totem: [{ "forma": "dinheiro"|"pix"|"cartao_debito"|"cartao_credito", "valor": number }]';

insert into public.clientes (nome, nome_fantasia, tabela_preco, bloqueado_pedido, observacoes)
select
  'Totem — Varejo Loja',
  'Totem Varejo',
  'padrao',
  false,
  'Cliente genérico para pedidos do autoatendimento (totem).'
where not exists (
  select 1 from public.clientes where nome = 'Totem — Varejo Loja'
);
