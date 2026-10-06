-- צורכי הדרכה 2027 · הגדרת מאגר התשובות ב-Supabase
-- מדביקים את כל הקובץ ב-SQL Editor ולוחצים Run.
-- לפני כן: מחליפים את YOUR_EMAIL@example.com (מופיע פעמיים למטה) במייל שלך.

create table if not exists public.responses (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  name          text not null check (char_length(name) between 1 and 120),
  dept          text not null check (char_length(dept) between 1 and 120),
  level         text,
  version       text,
  focus         jsonb,
  theme_scores  jsonb,
  answers       jsonb
);

alter table public.responses enable row level security;

-- מנהלים (בלי התחברות) יכולים רק להוסיף תשובה. הם לא יכולים לקרוא, לשנות או למחוק.
drop policy if exists "anyone can submit" on public.responses;
create policy "anyone can submit"
  on public.responses for insert
  to anon, authenticated
  with check (true);

-- רק את, אחרי התחברות במסך הניהול, יכולה לקרוא את התשובות.
drop policy if exists "admin reads all" on public.responses;
create policy "admin reads all"
  on public.responses for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'YOUR_EMAIL@example.com');

-- רק את יכולה למחוק (למשל תשובות בדיקה)
drop policy if exists "admin deletes" on public.responses;
create policy "admin deletes"
  on public.responses for delete
  to authenticated
  using ((auth.jwt() ->> 'email') = 'YOUR_EMAIL@example.com');

grant insert on public.responses to anon, authenticated;
grant select, delete on public.responses to authenticated;
