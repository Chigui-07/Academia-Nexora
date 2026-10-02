-- Academia Nexora v0.24
-- Destinatarios de clases, respuestas por archivo y presencia visible para usuarios autenticados.

alter table public.activity_attempt_attachments
  add column if not exists question_id text;

create index if not exists activity_attempt_attachments_attempt_question_idx
  on public.activity_attempt_attachments(attempt_id, question_id);

-- Los archivos nuevos solo pueden pertenecer a una pregunta file_upload del intento.
drop policy if exists activity_attempt_attachments_insert on public.activity_attempt_attachments;
create policy activity_attempt_attachments_insert
on public.activity_attempt_attachments
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and question_id is not null
  and exists (
    select 1
    from public.activity_attempts aa
    join public.course_activities ca on ca.id = aa.activity_id
    cross join lateral jsonb_array_elements(coalesce(ca.question_blocks, '[]'::jsonb)) q(value)
    where aa.id = activity_attempt_attachments.attempt_id
      and aa.user_id = (select auth.uid())
      and aa.status = 'in_progress'
      and q.value->>'id' = activity_attempt_attachments.question_id
      and q.value->>'type' = 'file_upload'
  )
);

-- La ruta nueva es user_id / attempt_id / question_id / archivo.
drop policy if exists activity_submissions_insert on storage.objects;
create policy activity_submissions_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'activity-submissions'
  and (storage.foldername(name))[1] = ((select auth.uid()))::text
  and array_length(storage.foldername(name), 1) >= 4
  and exists (
    select 1
    from public.activity_attempts aa
    join public.course_activities ca on ca.id = aa.activity_id
    cross join lateral jsonb_array_elements(coalesce(ca.question_blocks, '[]'::jsonb)) q(value)
    where aa.id::text = (storage.foldername(storage.objects.name))[2]
      and aa.user_id = (select auth.uid())
      and aa.status = 'in_progress'
      and q.value->>'id' = (storage.foldername(storage.objects.name))[3]
      and q.value->>'type' = 'file_upload'
  )
);

-- Destinatarios de clases.
create or replace function private.get_course_lesson_assignments(p_lesson_id uuid)
returns table(user_id uuid)
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not (public.has_role('teacher') or public.has_role('admin')) then raise exception 'Teacher role required'; end if;

  return query
  select cla.user_id
  from public.course_lesson_assignments cla
  join public.course_lessons cl on cl.id = cla.lesson_id
  where cla.lesson_id = p_lesson_id
    and (cl.created_by = auth.uid() or public.has_role('admin'))
  order by cla.assigned_at, cla.user_id;
end;
$$;

create or replace function public.get_course_lesson_assignments(p_lesson_id uuid)
returns table(user_id uuid)
language sql
set search_path = public, private, pg_temp
as $$ select * from private.get_course_lesson_assignments(p_lesson_id); $$;

revoke all on function private.get_course_lesson_assignments(uuid) from public, anon, authenticated;
revoke all on function public.get_course_lesson_assignments(uuid) from public, anon;
grant execute on function public.get_course_lesson_assignments(uuid) to authenticated;

create or replace function private.save_course_lesson(
  p_lesson_id uuid,
  p_course_id uuid,
  p_unit_title text,
  p_title text,
  p_lesson_content text,
  p_examples text,
  p_resources text,
  p_position integer,
  p_status text,
  p_assignment_mode text,
  p_user_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_lesson_id uuid := p_lesson_id;
  v_target uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not (public.has_role('teacher') or public.has_role('admin')) then raise exception 'Teacher role required'; end if;
  if p_assignment_mode not in ('course', 'selected') then raise exception 'Invalid assignment mode'; end if;
  if p_status not in ('draft', 'published') then raise exception 'Invalid lesson status'; end if;
  if trim(coalesce(p_title, '')) = '' then raise exception 'Lesson title required'; end if;
  if p_status = 'published' and trim(coalesce(p_lesson_content, '')) = '' then raise exception 'Published lesson requires content'; end if;
  if p_position < 1 or p_position > 999 then raise exception 'Invalid lesson position'; end if;
  if not exists (select 1 from public.courses c where c.id = p_course_id and c.active = true) then raise exception 'Course not available'; end if;
  if p_assignment_mode = 'selected' and coalesce(array_length(p_user_ids, 1), 0) = 0 then raise exception 'Select at least one student'; end if;

  if p_assignment_mode = 'selected' then
    foreach v_target in array coalesce(p_user_ids, '{}'::uuid[])
    loop
      if not exists (
        select 1 from public.course_enrollments ce
        where ce.course_id = p_course_id
          and ce.user_id = v_target
          and ce.status = 'active'
      ) then
        raise exception 'Selected student is not actively enrolled in this course';
      end if;
    end loop;
  end if;

  if v_lesson_id is null then
    insert into public.course_lessons(
      course_id, created_by, unit_title, title, lesson_content, examples, resources,
      position, status, published_at, assignment_mode, updated_at
    ) values (
      p_course_id, v_user_id, trim(coalesce(p_unit_title, '')), trim(p_title),
      trim(coalesce(p_lesson_content, '')), trim(coalesce(p_examples, '')),
      trim(coalesce(p_resources, '')), p_position, p_status,
      case when p_status = 'published' then now() else null end,
      p_assignment_mode, now()
    ) returning id into v_lesson_id;
  else
    update public.course_lessons cl
    set course_id = p_course_id,
        unit_title = trim(coalesce(p_unit_title, '')),
        title = trim(p_title),
        lesson_content = trim(coalesce(p_lesson_content, '')),
        examples = trim(coalesce(p_examples, '')),
        resources = trim(coalesce(p_resources, '')),
        position = p_position,
        status = p_status,
        published_at = case when p_status = 'published' then coalesce(cl.published_at, now()) else null end,
        assignment_mode = p_assignment_mode,
        updated_at = now()
    where cl.id = v_lesson_id
      and (cl.created_by = v_user_id or public.has_role('admin'));
    if not found then raise exception 'Lesson not found or not editable'; end if;
  end if;

  delete from public.course_lesson_assignments where lesson_id = v_lesson_id;
  if p_assignment_mode = 'selected' then
    insert into public.course_lesson_assignments(lesson_id, user_id, assigned_by)
    select v_lesson_id, uid, v_user_id
    from unnest(coalesce(p_user_ids, '{}'::uuid[])) uid
    on conflict (lesson_id, user_id) do nothing;
  end if;

  return v_lesson_id;
end;
$$;

create or replace function public.save_course_lesson(
  p_lesson_id uuid,
  p_course_id uuid,
  p_unit_title text,
  p_title text,
  p_lesson_content text,
  p_examples text,
  p_resources text,
  p_position integer,
  p_status text,
  p_assignment_mode text,
  p_user_ids uuid[]
)
returns uuid
language sql
set search_path = public, private, pg_temp
as $$
  select private.save_course_lesson(
    p_lesson_id, p_course_id, p_unit_title, p_title, p_lesson_content,
    p_examples, p_resources, p_position, p_status, p_assignment_mode, p_user_ids
  );
$$;

revoke all on function private.save_course_lesson(uuid,uuid,text,text,text,text,text,integer,text,text,uuid[]) from public, anon, authenticated;
revoke all on function public.save_course_lesson(uuid,uuid,text,text,text,text,text,integer,text,text,uuid[]) from public, anon;
grant execute on function public.save_course_lesson(uuid,uuid,text,text,text,text,text,integer,text,text,uuid[]) to authenticated;

-- Presencia visible para cualquier usuario autenticado. No devuelve carné.
create or replace function private.get_presence()
returns table(
  user_id uuid,
  display_name text,
  username text,
  last_seen_at timestamptz,
  last_active_at timestamptz,
  presence_status text
)
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  return query
  select
    p.id,
    coalesce(nullif(trim(p.display_name), ''), nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''), p.username, 'Usuario')::text,
    p.username::text,
    up.last_seen_at,
    up.last_active_at,
    case
      when up.last_seen_at is null or up.last_seen_at < now() - interval '2 minutes' then 'offline'
      when up.last_active_at < now() - interval '5 minutes' then 'idle'
      else 'online'
    end::text
  from public.profiles p
  left join public.user_presence up on up.user_id = p.id
  order by
    case
      when up.last_seen_at is not null and up.last_seen_at >= now() - interval '2 minutes' and up.last_active_at >= now() - interval '5 minutes' then 0
      when up.last_seen_at is not null and up.last_seen_at >= now() - interval '2 minutes' then 1
      else 2
    end,
    lower(coalesce(nullif(trim(p.display_name), ''), p.username, 'usuario'));
end;
$$;

create or replace function public.get_presence()
returns table(
  user_id uuid,
  display_name text,
  username text,
  last_seen_at timestamptz,
  last_active_at timestamptz,
  presence_status text
)
language sql
set search_path = public, private, pg_temp
as $$ select * from private.get_presence(); $$;

revoke all on function private.get_presence() from public, anon, authenticated;
revoke all on function public.get_presence() from public, anon;
grant execute on function public.get_presence() to authenticated;

-- save_course_activity_questions también valida preguntas file_upload:
-- prompt obligatorio, maxFiles entre 1 y 5, fileAccept en any/image/pdf/document/archive.
