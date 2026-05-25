-- PDV / Totem: pagamento split e confirmação no caixa

alter table public.pedidos
  add column if not exists pagamento_split jsonb,
  add column if not exists pagamento_recebido_em timestamptz;

comment on column public.pedidos.pagamento_split is
  'Array JSON: [{ "forma": "dinheiro"|"pix"|"cartao_debito"|"cartao_credito", "valor": number }]';
comment on column public.pedidos.pagamento_recebido_em is
  'Momento em que o caixa confirmou o recebimento do pagamento';

create index if not exists pedidos_numero_idx on public.pedidos (numero);

-- Clientes fictícios varejo (totem e balcão)
insert into public.clientes (nome, nome_fantasia, tabela_preco, ativo)
select 'Totem — Varejo Loja', 'Totem — Varejo Loja', 'padrao', true
where not exists (
  select 1 from public.clientes where nome = 'Totem — Varejo Loja'
);

insert into public.clientes (nome, nome_fantasia, tabela_preco, ativo)
select 'Balcão — Varejo Loja', 'Balcão — Varejo Loja', 'padrao', true
where not exists (
  select 1 from public.clientes where nome = 'Balcão — Varejo Loja'
);
