-- Zazú — provisión atómica tras el registro (SPEC.md sección 9).
--
-- Crea profile + business + business_member(owner) + business_settings en
-- una sola transacción para evitar estados parciales si algo falla a mitad
-- de camino (p. ej. el cliente pierde la conexión entre pasos).

create function public.provision_business_for_current_user(
  business_name text,
  contact_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_business_id uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  insert into public.profiles (id, email, full_name)
  select auth.uid(), u.email, contact_name
  from auth.users u
  where u.id = auth.uid()
  on conflict (id) do update set full_name = excluded.full_name;

  insert into public.businesses (name, contact_name)
  values (business_name, contact_name)
  returning id into new_business_id;

  insert into public.business_members (business_id, user_id, role)
  values (new_business_id, auth.uid(), 'owner');

  insert into public.business_settings (business_id)
  values (new_business_id);

  return new_business_id;
end;
$$;

grant execute on function public.provision_business_for_current_user(text, text) to authenticated;
