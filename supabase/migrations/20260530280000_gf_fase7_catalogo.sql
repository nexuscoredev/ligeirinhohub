-- Gestão Fácil → Ligeirinho HUB — Fase 7: catálogo digital B2B

alter table public.produtos
  add column if not exists visivel_catalogo boolean not null default true,
  add column if not exists ordem_catalogo int not null default 0;

create index if not exists produtos_catalogo_visivel_idx
  on public.produtos (ordem_catalogo, nome)
  where ativo = true and visivel_catalogo = true;

-- Origem de pedido pelo portal catálogo B2B
do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'pedido_origem' and e.enumlabel = 'catalogo'
  ) then
    alter type public.pedido_origem add value 'catalogo';
  end if;
end$$;

create or replace function public.pode_acessar_catalogo()
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
        'Desenvolvedor', 'Administrador', 'Gerente', 'Comercial', 'Caixa', 'CEO'
      )
  );
$$;

create or replace function public.pode_configurar_catalogo()
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
        'Desenvolvedor', 'Administrador', 'Gerente', 'Comercial', 'CEO'
      )
  );
$$;

revoke all on function public.pode_acessar_catalogo() from public;
grant execute on function public.pode_acessar_catalogo() to authenticated;

revoke all on function public.pode_configurar_catalogo() from public;
grant execute on function public.pode_configurar_catalogo() to authenticated;

-- Produtos visíveis no catálogo digital com preço da tabela informada
create or replace function public.gf_catalogo_produtos(p_tabela_codigo text default 'PADRAO')
returns table (
  produto_id uuid,
  sku text,
  nome text,
  imagem_url text,
  categoria_nome text,
  categoria_slug text,
  categoria_ordem int,
  preco numeric,
  ordem_catalogo int
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tabela_id uuid;
begin
  if not public.pode_acessar_catalogo() then
    raise exception 'Acesso negado';
  end if;

  select tp.id into v_tabela_id
  from public.tabelas_preco tp
  where upper(tp.codigo) = upper(coalesce(nullif(trim(p_tabela_codigo), ''), 'PADRAO'))
    and tp.ativo = true
  limit 1;

  if v_tabela_id is null then
    select tp.id into v_tabela_id
    from public.tabelas_preco tp
    where tp.padrao = true and tp.ativo = true
    limit 1;
  end if;

  return query
  select
    p.id,
    p.sku,
    p.nome,
    p.imagem_url,
    c.nome,
    c.slug,
    c.ordem_separacao,
    coalesce(tpi.preco, p.preco_base)::numeric(12, 2),
    p.ordem_catalogo
  from public.produtos p
  join public.categorias_produto c on c.id = p.categoria_id
  left join public.tabelas_preco_itens tpi
    on tpi.tabela_preco_id = v_tabela_id and tpi.produto_id = p.id
  where p.ativo = true
    and p.visivel_catalogo = true
  order by p.ordem_catalogo, c.ordem_separacao, p.nome;
end;
$$;

revoke all on function public.gf_catalogo_produtos(text) from public;
grant execute on function public.gf_catalogo_produtos(text) to authenticated;
