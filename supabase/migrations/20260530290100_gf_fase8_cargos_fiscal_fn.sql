-- Gestão Fácil → Ligeirinho HUB — Fase 8b: funções que usam cargo 'Fiscal'
-- Deve rodar APÓS 20260530290000 (enum cargo_hub precisa estar commitado)

create or replace function public.pode_acessar_fiscal()
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
        'Desenvolvedor', 'Administrador', 'Gerente', 'Financeiro', 'Fiscal', 'CEO'
      )
  );
$$;

revoke all on function public.pode_acessar_fiscal() from public;
grant execute on function public.pode_acessar_fiscal() to authenticated;
