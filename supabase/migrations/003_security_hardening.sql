-- Zazú — hardening de seguridad detectado por el linter de Supabase tras
-- aplicar 001/002: fijar search_path en funciones y mover btree_gist fuera
-- de public (SPEC.md sección 44).

create schema if not exists extensions;

alter extension btree_gist set schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
