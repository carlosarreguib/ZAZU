-- Zazú — soporte para el onboarding de 3 pasos (SPEC.md sección 10).
-- onboarding_completed_at permite saber si un negocio ya pasó el
-- onboarding, para no volver a mostrarlo en logins futuros.

alter table public.businesses
  add column onboarding_completed_at timestamptz;
