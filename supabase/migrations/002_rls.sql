-- Zazú — Row Level Security (SPEC.md sección 5.2 y 8)

-- Función SECURITY DEFINER para comprobar membresía sin recursión de RLS.
-- Las policies de business_members NUNCA deben hacer una subquery directa
-- contra la propia tabla business_members (ver SPEC.md sección 5.2).
create function public.is_business_member(target_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = target_business_id
      and bm.user_id = auth.uid()
  );
$$;

grant execute on function public.is_business_member(uuid) to authenticated;

-- profiles ------------------------------------------------------------------

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- businesses ------------------------------------------------------------------

alter table public.businesses enable row level security;

create policy "businesses_select_member"
  on public.businesses for select
  to authenticated
  using (public.is_business_member(id));

create policy "businesses_insert_authenticated"
  on public.businesses for insert
  to authenticated
  with check (true);

create policy "businesses_update_member"
  on public.businesses for update
  to authenticated
  using (public.is_business_member(id))
  with check (public.is_business_member(id));

create policy "businesses_delete_member"
  on public.businesses for delete
  to authenticated
  using (public.is_business_member(id));

-- business_members ------------------------------------------------------------------

alter table public.business_members enable row level security;

-- SELECT/INSERT/UPDATE/DELETE se apoyan en is_business_member (que consulta
-- esta misma tabla con SECURITY DEFINER) en vez de una subquery directa
-- aquí, para evitar la recursión de RLS descrita en SPEC.md sección 5.2.
create policy "business_members_select_member"
  on public.business_members for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "business_members_insert_self_as_owner"
  on public.business_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "business_members_update_member"
  on public.business_members for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "business_members_delete_member"
  on public.business_members for delete
  to authenticated
  using (public.is_business_member(business_id));

-- clients ------------------------------------------------------------------

alter table public.clients enable row level security;

create policy "clients_select_member"
  on public.clients for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "clients_insert_member"
  on public.clients for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "clients_update_member"
  on public.clients for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "clients_delete_member"
  on public.clients for delete
  to authenticated
  using (public.is_business_member(business_id));

-- services ------------------------------------------------------------------

alter table public.services enable row level security;

create policy "services_select_member"
  on public.services for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "services_insert_member"
  on public.services for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "services_update_member"
  on public.services for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "services_delete_member"
  on public.services for delete
  to authenticated
  using (public.is_business_member(business_id));

-- appointments ------------------------------------------------------------------

alter table public.appointments enable row level security;

create policy "appointments_select_member"
  on public.appointments for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "appointments_insert_member"
  on public.appointments for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "appointments_update_member"
  on public.appointments for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "appointments_delete_member"
  on public.appointments for delete
  to authenticated
  using (public.is_business_member(business_id));

-- appointment_reminders ------------------------------------------------------------------

alter table public.appointment_reminders enable row level security;

create policy "appointment_reminders_select_member"
  on public.appointment_reminders for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "appointment_reminders_insert_member"
  on public.appointment_reminders for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "appointment_reminders_update_member"
  on public.appointment_reminders for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "appointment_reminders_delete_member"
  on public.appointment_reminders for delete
  to authenticated
  using (public.is_business_member(business_id));

-- business_settings ------------------------------------------------------------------

alter table public.business_settings enable row level security;

create policy "business_settings_select_member"
  on public.business_settings for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "business_settings_insert_member"
  on public.business_settings for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "business_settings_update_member"
  on public.business_settings for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "business_settings_delete_member"
  on public.business_settings for delete
  to authenticated
  using (public.is_business_member(business_id));
