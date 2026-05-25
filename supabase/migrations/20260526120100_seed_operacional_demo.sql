-- Dados de demonstração — operação Denis (remover em produção se necessário)

insert into public.categorias_produto (nome, slug, ordem_separacao) values
  ('Cerveja', 'cerveja', 10),
  ('Whisky', 'whisky', 20),
  ('Vodka', 'vodka', 30),
  ('Refrigerante', 'refrigerante', 40),
  ('Água', 'agua', 50),
  ('Energético', 'energetico', 60),
  ('Outros', 'outros', 99);

-- Produtos demo (sem imagem — placeholder no front)
insert into public.produtos (categoria_id, nome, sku, preco_base)
select c.id, p.nome, p.sku, p.preco
from (values
  ('cerveja', 'Skol Pilsen 350ml cx', 'SKOL-350', 89.90),
  ('cerveja', 'Amstel Lager 350ml cx', 'AMSTEL-350', 92.00),
  ('cerveja', 'Império Pilsen 269ml cx', 'IMPERIO-269', 78.50),
  ('whisky', 'Red Label 1L', 'RED-1L', 89.99),
  ('whisky', 'Buchanan''s 12 anos', 'BUCH-12', 189.90),
  ('whisky', 'Ballantine''s Finest', 'BALL-FIN', 79.90),
  ('whisky', 'Old Parr 12 anos', 'OLDP-12', 159.00),
  ('whisky', 'Royal Salute 21', 'ROYAL-21', 899.00),
  ('vodka', 'Absolut Original 1L', 'ABS-1L', 69.90),
  ('refrigerante', 'Coca-Cola 2L', 'COCA-2L', 8.49),
  ('agua', 'Água Crystal 1,5L', 'AGU-15', 2.99),
  ('energetico', 'Monster Energy 473ml', 'MON-473', 9.79)
) as p(cat, nome, sku, preco)
join public.categorias_produto c on c.slug = p.cat;

insert into public.clientes (nome, nome_fantasia, tabela_preco, dia_vencimento_semana, bloqueado_pedido)
values
  ('Bar do Chico', 'Bar do Chico', 'padrao', 2, false),
  ('Cantinho do Vale', 'Cantinho do Vale', 'padrao', 2, false),
  ('Distribuidora Teste', 'Cayena Parceiro', 'cayena', 2, false);

-- Pedido 1: fila (Bar do Chico)
do $$
declare
  v_cliente uuid;
  v_pedido uuid;
  v_cat_ord int;
begin
  select id into v_cliente from public.clientes where nome = 'Bar do Chico' limit 1;

  insert into public.pedidos (
    cliente_id, status, origem, modalidade, prioridade,
    aceito_em, valor_pedido
  ) values (
    v_cliente, 'aguardando_separacao', 'whatsapp', 'entrega', 0,
    now() - interval '2 hours', 0
  ) returning id into v_pedido;

  insert into public.pedido_itens (pedido_id, produto_id, nome_snapshot, categoria_ordem, qty_pedida, preco_unitario)
  select v_pedido, pr.id, pr.nome, c.ordem_separacao, v.qty, pr.preco_base
  from (values
    ('RED-1L', 3),
    ('SKOL-350', 10),
    ('AMSTEL-350', 30),
    ('BUCH-12', 4),
    ('COCA-2L', 12)
  ) as v(sku, qty)
  join public.produtos pr on pr.sku = v.sku
  join public.categorias_produto c on c.id = pr.categoria_id;

  perform public.recalcular_totais_pedido(v_pedido);
end $$;

-- Pedido 2: prioridade refazer
do $$
declare
  v_cliente uuid;
  v_pedido uuid;
begin
  select id into v_cliente from public.clientes where nome = 'Cantinho do Vale' limit 1;

  insert into public.pedidos (
    cliente_id, status, origem, modalidade, prioridade,
    aceito_em, valor_pedido, tem_ocorrencia
  ) values (
    v_cliente, 'refazer_separacao', 'cayena', 'retirada', 100,
    now() - interval '1 hour', 0, true
  ) returning id into v_pedido;

  insert into public.pedido_itens (pedido_id, produto_id, nome_snapshot, categoria_ordem, qty_pedida, preco_unitario)
  select v_pedido, pr.id, pr.nome, c.ordem_separacao, 6, pr.preco_base
  from public.produtos pr
  join public.categorias_produto c on c.id = pr.categoria_id
  where pr.sku = 'IMPERIO-269';

  perform public.recalcular_totais_pedido(v_pedido);

  insert into public.pedido_ocorrencias (pedido_id, tipo, descricao, alerta_imediato)
  values (v_pedido, 'separacao', 'Separação incorreta — refazer pedido', true);
end $$;

-- Pedido 3: orçamento
do $$
declare
  v_cliente uuid;
  v_pedido uuid;
begin
  select id into v_cliente from public.clientes where nome = 'Distribuidora Teste' limit 1;

  insert into public.pedidos (cliente_id, status, origem, modalidade)
  values (v_cliente, 'orcamento', 'balcao', 'entrega')
  returning id into v_pedido;

  insert into public.pedido_itens (pedido_id, produto_id, nome_snapshot, categoria_ordem, qty_pedida, preco_unitario)
  select v_pedido, pr.id, pr.nome, c.ordem_separacao, 2, pr.preco_base
  from public.produtos pr
  join public.categorias_produto c on c.id = pr.categoria_id
  where pr.sku = 'MON-473';

  perform public.recalcular_totais_pedido(v_pedido);
end $$;
