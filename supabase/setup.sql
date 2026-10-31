-- Выполнить один раз в SQL Editor нового проекта Supabase.
-- Посетители могут только добавлять заявки. Читать их можно в Table Editor.
begin;

create table public.lesson_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  contact text not null check (char_length(btrim(contact)) between 1 and 160),
  created_at timestamptz not null default now()
);

alter table public.lesson_applications enable row level security;
revoke all on public.lesson_applications from anon, authenticated;
grant usage on schema public to anon;
grant insert (id, name, contact) on public.lesson_applications to anon;

create policy "Visitors can submit applications"
on public.lesson_applications for insert to anon
with check (true);

commit;
