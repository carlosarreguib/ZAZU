-- split clients.full_name into first_name / last_name -----------------------
-- the whatsapp reminder message must use only the first name so it reads as
-- a personal message, but the app still needs the last name to tell clients
-- with the same first name apart in lists and search.

alter table public.clients
  add column first_name text,
  add column last_name text;

update public.clients
set
  first_name = coalesce(nullif(split_part(full_name, ' ', 1), ''), full_name),
  last_name = nullif(trim(substring(full_name from length(split_part(full_name, ' ', 1)) + 1)), '');

alter table public.clients
  alter column first_name set not null,
  add constraint clients_first_name_check check (char_length(trim(first_name)) > 0);

alter table public.clients drop column full_name;
