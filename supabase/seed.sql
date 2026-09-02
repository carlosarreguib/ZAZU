-- Zazú — datos de demostración para desarrollo local (SPEC.md sección 39).
-- No se ejecuta contra proyectos de producción: solo aplica al correr
-- `supabase db reset` o `supabase start` en local.
--
-- Crea un usuario demo en auth.users (contraseña: "demo12345") y su negocio,
-- clientes, servicios y citas de hoy/mañana con distintos estados de
-- recordatorio, para poder probar la UI sin tener que registrarse a mano.

do $$
declare
  demo_user_id uuid := '00000000-0000-0000-0000-000000000001';
  demo_business_id uuid := '00000000-0000-0000-0000-000000000002';
  client_maria_id uuid := '00000000-0000-0000-0000-000000000010';
  client_carlos_id uuid := '00000000-0000-0000-0000-000000000011';
  client_laura_id uuid := '00000000-0000-0000-0000-000000000012';
  service_fisio_id uuid := '00000000-0000-0000-0000-000000000020';
  appt_today_1 uuid := '00000000-0000-0000-0000-000000000030';
  appt_today_2 uuid := '00000000-0000-0000-0000-000000000031';
  appt_today_3 uuid := '00000000-0000-0000-0000-000000000032';
  appt_tomorrow_1 uuid := '00000000-0000-0000-0000-000000000033';
  today_9 timestamptz := date_trunc('day', now()) + interval '9 hours';
  today_1030 timestamptz := date_trunc('day', now()) + interval '10 hours 30 minutes';
  today_12 timestamptz := date_trunc('day', now()) + interval '12 hours';
  tomorrow_10 timestamptz := date_trunc('day', now()) + interval '1 day 10 hours';
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) values (
    demo_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'demo@zazu.app', crypt('demo12345', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{}'
  )
  on conflict (id) do nothing;

  insert into public.profiles (id, email, full_name)
  values (demo_user_id, 'demo@zazu.app', 'Profesional Demo')
  on conflict (id) do nothing;

  insert into public.businesses (id, name, contact_name, phone, timezone)
  values (demo_business_id, 'Clínica Demo', 'Profesional Demo', '+34600000000', 'Europe/Madrid')
  on conflict (id) do nothing;

  insert into public.business_members (business_id, user_id, role)
  values (demo_business_id, demo_user_id, 'owner')
  on conflict (business_id, user_id) do nothing;

  insert into public.business_settings (business_id)
  values (demo_business_id)
  on conflict (business_id) do nothing;

  insert into public.services (id, business_id, name, duration_minutes, active)
  values (service_fisio_id, demo_business_id, 'Fisioterapia', 50, true)
  on conflict (id) do nothing;

  insert into public.clients (id, business_id, full_name, phone, notes)
  values
    (client_maria_id, demo_business_id, 'María López', '+34600111222', null),
    (client_carlos_id, demo_business_id, 'Carlos Pérez', '+34600333444', null),
    (client_laura_id, demo_business_id, 'Laura Gómez', '+34600555666', null)
  on conflict (id) do nothing;

  insert into public.appointments (
    id, business_id, client_id, service_id, starts_at, ends_at, status
  ) values
    (appt_today_1, demo_business_id, client_maria_id, service_fisio_id, today_9, today_9 + interval '50 minutes', 'scheduled'),
    (appt_today_2, demo_business_id, client_carlos_id, service_fisio_id, today_1030, today_1030 + interval '50 minutes', 'confirmed'),
    (appt_today_3, demo_business_id, client_laura_id, service_fisio_id, today_12, today_12 + interval '50 minutes', 'scheduled'),
    (appt_tomorrow_1, demo_business_id, client_maria_id, service_fisio_id, tomorrow_10, tomorrow_10 + interval '50 minutes', 'scheduled')
  on conflict (id) do nothing;

  insert into public.appointment_reminders (business_id, appointment_id, channel, status, sent_at)
  values
    (demo_business_id, appt_today_1, 'whatsapp', 'pending', null),
    (demo_business_id, appt_today_2, 'whatsapp', 'sent', now() - interval '1 day'),
    (demo_business_id, appt_today_3, 'whatsapp', 'pending', null),
    (demo_business_id, appt_tomorrow_1, 'whatsapp', 'pending', null)
  on conflict do nothing;
end $$;
