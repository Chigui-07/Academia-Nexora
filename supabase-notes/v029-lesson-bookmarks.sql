-- Academia Nexora — v0.29
-- Clases guardadas por estudiante.

create table if not exists public.lesson_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.lesson_bookmarks enable row level security;

grant select, insert, delete on public.lesson_bookmarks to authenticated;

create policy "Students read own lesson bookmarks"
on public.lesson_bookmarks
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Students save own lesson bookmarks"
on public.lesson_bookmarks
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Students remove own lesson bookmarks"
on public.lesson_bookmarks
for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists lesson_bookmarks_user_created_idx
  on public.lesson_bookmarks (user_id, created_at desc);
