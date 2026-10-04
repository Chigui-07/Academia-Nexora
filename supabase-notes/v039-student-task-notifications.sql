-- Academia Nexora v0.39
-- Notificaciones internas ligeras para tareas nuevas.
-- Producción: migration student_task_notifications_v039.

create table if not exists public.student_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_activity_id uuid not null references public.course_activities(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  activity_type text not null check (activity_type in ('notebook_task','virtual_task','exercise_sheet')),
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, source_activity_id)
);

create index if not exists student_notifications_user_created_idx
  on public.student_notifications(user_id, created_at desc);

create index if not exists student_notifications_user_unread_idx
  on public.student_notifications(user_id, read_at)
  where read_at is null;

alter table public.student_notifications enable row level security;

drop policy if exists student_notifications_select_own on public.student_notifications;
create policy student_notifications_select_own
on public.student_notifications
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists student_notifications_update_own on public.student_notifications;
create policy student_notifications_update_own
on public.student_notifications
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on public.student_notifications from anon, authenticated;
grant select on public.student_notifications to authenticated;
grant update(read_at) on public.student_notifications to authenticated;

create or replace function private.refresh_activity_student_notifications(p_activity_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_activity public.course_activities%rowtype;
  v_course public.courses%rowtype;
begin
  select * into v_activity
  from public.course_activities
  where id = p_activity_id;

  if not found then
    delete from public.student_notifications where source_activity_id = p_activity_id;
    return;
  end if;

  if v_activity.status <> 'published'
     or v_activity.activity_type not in ('notebook_task','virtual_task','exercise_sheet') then
    delete from public.student_notifications where source_activity_id = p_activity_id;
    return;
  end if;

  select * into v_course
  from public.courses
  where id = v_activity.course_id;

  if not found or coalesce(v_course.active,false) = false then
    delete from public.student_notifications where source_activity_id = p_activity_id;
    return;
  end if;

  delete from public.student_notifications sn
  where sn.source_activity_id = v_activity.id
    and not exists (
      select 1
      from public.course_enrollments ce
      join public.profiles p on p.id = ce.user_id
      where ce.user_id = sn.user_id
        and ce.course_id = v_activity.course_id
        and ce.status = 'active'
        and (
          (coalesce(v_course.is_essential,false) = true
            and (ce.required_until is null or now() < ce.required_until))
          or
          (coalesce(v_course.is_essential,false) = false
            and lower(p.stage) = lower(v_activity.academic_stage)
            and p.level = v_activity.academic_level)
        )
        and (
          v_activity.assignment_mode = 'course'
          or exists (
            select 1
            from public.course_activity_assignments caa
            where caa.activity_id = v_activity.id
              and caa.user_id = ce.user_id
          )
        )
    );

  insert into public.student_notifications (
    user_id, source_activity_id, course_id, activity_type, title, body
  )
  select
    ce.user_id,
    v_activity.id,
    v_activity.course_id,
    v_activity.activity_type,
    case v_activity.activity_type
      when 'notebook_task' then '📝 Nueva tarea de cuaderno'
      when 'virtual_task' then '💻 Nueva tarea virtual'
      else '📄 Nueva Hoja de ejercicios'
    end,
    v_course.name || ': ' || v_activity.title
  from public.course_enrollments ce
  join public.profiles p on p.id = ce.user_id
  where ce.course_id = v_activity.course_id
    and ce.status = 'active'
    and (
      (coalesce(v_course.is_essential,false) = true
        and (ce.required_until is null or now() < ce.required_until))
      or
      (coalesce(v_course.is_essential,false) = false
        and lower(p.stage) = lower(v_activity.academic_stage)
        and p.level = v_activity.academic_level)
    )
    and (
      v_activity.assignment_mode = 'course'
      or exists (
        select 1
        from public.course_activity_assignments caa
        where caa.activity_id = v_activity.id
          and caa.user_id = ce.user_id
      )
    )
  on conflict (user_id, source_activity_id)
  do update set
    course_id = excluded.course_id,
    activity_type = excluded.activity_type,
    title = excluded.title,
    body = excluded.body;
end;
$$;

revoke all on function private.refresh_activity_student_notifications(uuid) from public;

create or replace function private.student_notifications_activity_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  perform private.refresh_activity_student_notifications(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create or replace function private.student_notifications_assignment_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  perform private.refresh_activity_student_notifications(coalesce(new.activity_id, old.activity_id));
  return coalesce(new, old);
end;
$$;

revoke all on function private.student_notifications_activity_trigger() from public;
revoke all on function private.student_notifications_assignment_trigger() from public;

drop trigger if exists refresh_student_notifications_after_activity on public.course_activities;
create trigger refresh_student_notifications_after_activity
after insert or update of status, activity_type, title, course_id, assignment_mode, academic_stage, academic_level
on public.course_activities
for each row execute function private.student_notifications_activity_trigger();

drop trigger if exists refresh_student_notifications_after_assignment on public.course_activity_assignments;
create trigger refresh_student_notifications_after_assignment
after insert or delete or update
on public.course_activity_assignments
for each row execute function private.student_notifications_assignment_trigger();

-- No se hace backfill: las tareas existentes antes de v0.39 no llenan la campana.
-- Las ediciones conservan read_at gracias al ON CONFLICT, así que no vuelven a quedar sin leer.
