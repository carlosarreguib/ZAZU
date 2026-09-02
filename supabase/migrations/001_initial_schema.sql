-- Zazú — esquema inicial (SPEC.md sección 6-7)

create extension if not exists "btree_gist";

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles ------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- businesses ------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  contact_name text,
  phone text,
  timezone text not null default 'Europe/Madrid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_businesses_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

-- business_members ------------------------------------------------------------------

create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index business_members_business_id_idx on public.business_members (business_id);
create index business_members_user_id_idx on public.business_members (user_id);

-- clients ------------------------------------------------------------------

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) > 0),
  phone text not null check (char_length(trim(phone)) > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_business_id_idx on public.clients (business_id);
create index clients_business_id_phone_idx on public.clients (business_id, phone);

create trigger set_clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- services ------------------------------------------------------------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  duration_minutes integer not null check (duration_minutes > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index services_business_id_idx on public.services (business_id);

create trigger set_services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- appointments ------------------------------------------------------------------

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  service_id uuid references public.services (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index appointments_business_id_idx on public.appointments (business_id);
create index appointments_client_id_idx on public.appointments (client_id);
create index appointments_business_starts_at_idx on public.appointments (business_id, starts_at);

-- Constraint anti-solapamiento a nivel de BD (SPEC.md sección 6): la BD
-- rechaza citas solapadas del mismo negocio incluso ante condiciones de
-- carrera. Las citas canceladas no cuentan como solapamiento.
alter table public.appointments
  add constraint no_overlapping_appointments
  exclude using gist (
    business_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status <> 'cancelled');

create trigger set_appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- appointment_reminders ------------------------------------------------------------------

create table public.appointment_reminders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  channel text not null default 'whatsapp' check (channel in ('whatsapp')),
  status text not null default 'pending' check (status in ('pending', 'prepared', 'sent')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index appointment_reminders_business_id_idx on public.appointment_reminders (business_id);
create index appointment_reminders_appointment_id_idx on public.appointment_reminders (appointment_id);

create trigger set_appointment_reminders_updated_at
  before update on public.appointment_reminders
  for each row execute function public.set_updated_at();

-- business_settings ------------------------------------------------------------------

create table public.business_settings (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  default_reminder_template text not null default
    'Hola {{client_name}}, te recordamos tu cita de {{service}} mañana a las {{time}} en {{business_name}}. ¡Te esperamos!',
  week_starts_on integer not null default 1 check (week_starts_on between 0 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_business_settings_updated_at
  before update on public.business_settings
  for each row execute function public.set_updated_at();
