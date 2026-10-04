-- Academia Nexora v0.36
-- Seguimiento personal de clases abiertas/revisadas.

create table if not exists public.lesson_views (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  first_viewed_at timestamptz not null default now(),
  reviewed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.lesson_views enable row level security;

revoke all on table public.lesson_views from anon, authenticated;
grant select, insert, update on table public.lesson_views to authenticated;

create policy "Students read own lesson views"
on public.lesson_views for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Students create own lesson views"
on public.lesson_views for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.course_lessons cl
    where cl.id = lesson_id
  )
);

create policy "Students update own lesson views"
on public.lesson_views for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.course_lessons cl
    where cl.id = lesson_id
  )
);

create index if not exists lesson_views_user_reviewed_idx
  on public.lesson_views (user_id, reviewed_at desc);
