-- Cargo CEO (enum)

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'cargo_hub'
      and e.enumlabel = 'CEO'
  ) then
    alter type public.cargo_hub add value 'CEO';
  end if;
end $$;

