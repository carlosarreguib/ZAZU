-- Zazú — horario laboral por día de la semana (spec: disponibilidad).
--
-- Una fila por negocio y día de la semana (0 = domingo ... 6 = sábado,
-- convención Date.getDay()). Solo un tramo abierto/cerrado por día en el
-- MVP: sin franjas múltiples.

create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  is_open boolean not null default true,
  starts_at time,
  ends_at time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_hours_business_day_unique unique (business_id, day_of_week),
  constraint business_hours_hours_check check (
    (is_open = false and starts_at is null and ends_at is null)
    or (is_open = true and starts_at is not null and ends_at is not null and ends_at > starts_at)
  )
);

create index business_hours_business_id_idx on public.business_hours (business_id);

create trigger set_business_hours_updated_at
  before update on public.business_hours
  for each row execute function public.set_updated_at();

alter table public.business_hours enable row level security;

create policy "business_hours_select_member"
  on public.business_hours for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "business_hours_insert_member"
  on public.business_hours for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "business_hours_update_member"
  on public.business_hours for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "business_hours_delete_member"
  on public.business_hours for delete
  to authenticated
  using (public.is_business_member(business_id));

-- Backfill retroactivo: negocios ya existentes (creados antes de esta
-- migración) reciben el horario por defecto L-V 09:00-18:00, S/D cerrado.
insert into public.business_hours (business_id, day_of_week, is_open, starts_at, ends_at)
select
  b.id,
  d.day_of_week,
  d.day_of_week between 1 and 5,
  case when d.day_of_week between 1 and 5 then '09:00'::time end,
  case when d.day_of_week between 1 and 5 then '18:00'::time end
from public.businesses b
cross join (select generate_series(0, 6) as day_of_week) d
on conflict (business_id, day_of_week) do nothing;

-- Provisión de negocios nuevos: añade el mismo horario por defecto al
-- flujo atómico de registro (create or replace conserva los grants ya
-- otorgados sobre la función).
create or replace function public.provision_business_for_current_user(
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

  insert into public.business_hours (business_id, day_of_week, is_open, starts_at, ends_at)
  select
    new_business_id,
    d.day_of_week,
    d.day_of_week between 1 and 5,
    case when d.day_of_week between 1 and 5 then '09:00'::time end,
    case when d.day_of_week between 1 and 5 then '18:00'::time end
  from (select generate_series(0, 6) as day_of_week) d;

  return new_business_id;
end;
$$;
