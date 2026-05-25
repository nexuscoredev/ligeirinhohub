-- Kaena → Cayena (nome correto da marca)

alter type public.pedido_origem rename value 'kaena' to 'cayena';

update public.clientes
set
  tabela_preco = 'cayena',
  nome_fantasia = 'Cayena Parceiro'
where tabela_preco = 'kaena' or nome_fantasia ilike '%kaena%';
