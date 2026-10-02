-- Academia Nexora — v0.22
-- Profesor IA personal, clases individuales, archivos privados y preguntas de parejas.
-- Este archivo documenta las migraciones aplicadas en Supabase el 2 de octubre de 2026.

-- ============================================================
-- 1. Clases asignables a estudiantes concretos
-- ============================================================

alter table public.course_lessons
  add column if not exists assignment_mode text not null default 'course';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.course_lessons'::regclass
      and conname = 'course_lessons_assignment_mode_check'
  ) then
    alter table public.course_lessons
      add constraint course_lessons_assignment_mode_check
      check (assignment_mode in ('course', 'selected'));
  end if;
end $$;

create table if not exists public.course_lesson_assignments (
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (lesson_id, user_id)
);

alter table public.course_lesson_assignments enable row level security;
grant select, insert, delete on public.course_lesson_assignments to authenticated;

drop policy if exists course_lesson_assignments_select on public.course_lesson_assignments;
create policy course_lesson_assignments_select
on public.course_lesson_assignments for select to authenticated
using (
  user_id = (select auth.uid())
  or public.has_role('teacher')
  or public.has_role('admin')
);

drop policy if exists course_lesson_assignments_insert on public.course_lesson_assignments;
create policy course_lesson_assignments_insert
on public.course_lesson_assignments for insert to authenticated
with check (
  assigned_by = (select auth.uid())
  and (public.has_role('teacher') or public.has_role('admin'))
);

drop policy if exists course_lesson_assignments_delete on public.course_lesson_assignments;
create policy course_lesson_assignments_delete
on public.course_lesson_assignments for delete to authenticated
using (public.has_role('teacher') or public.has_role('admin'));

drop policy if exists course_lessons_select on public.course_lessons;
create policy course_lessons_select
on public.course_lessons for select to authenticated
using (
  public.has_role('teacher')
  or public.has_role('admin')
  or (
    status = 'published'
    and exists (
      select 1 from public.course_enrollments ce
      where ce.course_id = course_lessons.course_id
        and ce.user_id = (select auth.uid())
        and ce.status = 'active'
    )
    and (
      assignment_mode = 'course'
      or exists (
        select 1 from public.course_lesson_assignments cla
        where cla.lesson_id = course_lessons.id
          and cla.user_id = (select auth.uid())
      )
    )
  )
);

-- ============================================================
-- 2. Archivos privados por intento
-- ============================================================

alter table public.course_activities
  add column if not exists allow_attachments boolean not null default true,
  add column if not exists attachments_required boolean not null default false,
  add column if not exists max_attachments smallint not null default 5,
  add column if not exists attachment_instructions text not null default '';

alter table public.course_activities alter column allow_attachments set default true;
alter table public.course_activities alter column max_attachments set default 5;

update public.course_activities set allow_attachments = true where allow_attachments = false;
update public.course_activities set max_attachments = 5 where max_attachments = 3;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.course_activities'::regclass
      and conname = 'course_activities_max_attachments_check'
  ) then
    alter table public.course_activities
      add constraint course_activities_max_attachments_check
      check (max_attachments between 1 and 10);
  end if;
end $$;

create table if not exists public.activity_attempt_attachments (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.activity_attempts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text,
  file_size bigint not null check (file_size > 0 and file_size <= 20971520),
  created_at timestamptz not null default now()
);

create index if not exists activity_attempt_attachments_attempt_idx
  on public.activity_attempt_attachments(attempt_id, created_at);

alter table public.activity_attempt_attachments enable row level security;
grant select, insert, delete on public.activity_attempt_attachments to authenticated;

drop policy if exists activity_attempt_attachments_select on public.activity_attempt_attachments;
create policy activity_attempt_attachments_select
on public.activity_attempt_attachments for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.activity_attempts aa
    join public.course_activities ca on ca.id = aa.activity_id
    where aa.id = activity_attempt_attachments.attempt_id
      and (ca.created_by = (select auth.uid()) or public.has_role('admin'))
  )
);

drop policy if exists activity_attempt_attachments_insert on public.activity_attempt_attachments;
create policy activity_attempt_attachments_insert
on public.activity_attempt_attachments for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.activity_attempts aa
    join public.course_activities ca on ca.id = aa.activity_id
    where aa.id = activity_attempt_attachments.attempt_id
      and aa.user_id = (select auth.uid())
      and aa.status = 'in_progress'
      and ca.allow_attachments = true
  )
);

drop policy if exists activity_attempt_attachments_delete on public.activity_attempt_attachments;
create policy activity_attempt_attachments_delete
on public.activity_attempt_attachments for delete to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.activity_attempts aa
    where aa.id = activity_attempt_attachments.attempt_id
      and aa.user_id = (select auth.uid())
      and aa.status = 'in_progress'
  )
);

-- Bucket privado: 20 MB por archivo. La aplicación limita la interfaz a 5 archivos por intento.
insert into storage.buckets (id, name, public, file_size_limit)
values ('activity-submissions', 'activity-submissions', false, 20971520)
on conflict (id) do update
set public = false,
    file_size_limit = 20971520;

drop policy if exists activity_submissions_select on storage.objects;
create policy activity_submissions_select
on storage.objects for select to authenticated
using (
  bucket_id = 'activity-submissions'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1
      from public.activity_attempts aa
      join public.course_activities ca on ca.id = aa.activity_id
      where aa.id::text = (storage.foldername(name))[2]
        and (ca.created_by = (select auth.uid()) or public.has_role('admin'))
    )
  )
);

drop policy if exists activity_submissions_insert on storage.objects;
create policy activity_submissions_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'activity-submissions'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.activity_attempts aa
    join public.course_activities ca on ca.id = aa.activity_id
    where aa.id::text = (storage.foldername(name))[2]
      and aa.user_id = (select auth.uid())
      and aa.status = 'in_progress'
      and ca.allow_attachments = true
  )
);

drop policy if exists activity_submissions_delete on storage.objects;
create policy activity_submissions_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'activity-submissions'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.activity_attempts aa
    where aa.id::text = (storage.foldername(name))[2]
      and aa.user_id = (select auth.uid())
      and aa.status = 'in_progress'
  )
);

-- ============================================================
-- 3. Profesor IA personal
-- ============================================================
-- save_ai_teacher_draft conserva su nombre por compatibilidad con el frontend,
-- pero desde v0.22 el botón de aprobación publica contenido SOLO para el usuario
-- autorizado en ai_teacher_access.
-- También activa la inscripción de ese usuario en la materia seleccionada.

create or replace function private.save_ai_teacher_draft(p_kind text, p_course_id uuid, p_draft jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'private', 'pg_temp'
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_position integer;
  v_question_blocks jsonb := coalesce(p_draft->'question_blocks', '[]'::jsonb);
  v_answer_key jsonb := coalesce(p_draft->'answer_key', '{}'::jsonb);
  v_points integer;
  v_block integer;
  v_attempts integer;
  v_timer integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not private.has_ai_teacher_access() then raise exception 'AI teacher access required'; end if;
  if p_kind not in ('lesson', 'notebook_task', 'virtual_task', 'practice') then raise exception 'Unsupported AI draft kind'; end if;
  if not exists (select 1 from public.courses where id = p_course_id and active = true) then raise exception 'Active course not found'; end if;
  if jsonb_typeof(coalesce(p_draft, '{}'::jsonb)) <> 'object' then raise exception 'Draft must be a JSON object'; end if;

  insert into public.course_enrollments(user_id, course_id, status, updated_at)
  values (v_user_id, p_course_id, 'active', now())
  on conflict (user_id, course_id) do update
    set status = 'active', updated_at = now();

  if p_kind = 'lesson' then
    if char_length(trim(coalesce(p_draft->>'title', ''))) < 2 then raise exception 'Lesson title is required'; end if;

    select coalesce(max(position), 0) + 1 into v_position
    from public.course_lessons where course_id = p_course_id;

    insert into public.course_lessons(
      course_id, created_by, unit_title, title, lesson_content, examples, resources,
      position, status, published_at, assignment_mode
    ) values (
      p_course_id, v_user_id, left(coalesce(p_draft->>'unit_title', ''), 160),
      left(trim(p_draft->>'title'), 160), coalesce(p_draft->>'lesson_content', ''),
      coalesce(p_draft->>'examples', ''), coalesce(p_draft->>'resources', ''),
      v_position, 'published', now(), 'selected'
    ) returning id into v_id;

    insert into public.course_lesson_assignments(lesson_id, user_id, assigned_by)
    values (v_id, v_user_id, v_user_id)
    on conflict do nothing;

    return jsonb_build_object('id', v_id, 'kind', p_kind, 'status', 'published', 'personal', true);
  end if;

  if jsonb_typeof(v_question_blocks) <> 'array' then raise exception 'Question blocks must be a JSON array'; end if;
  if jsonb_typeof(v_answer_key) <> 'object' then raise exception 'Answer key must be a JSON object'; end if;
  if char_length(trim(coalesce(p_draft->>'title', ''))) < 2 then raise exception 'Activity title is required'; end if;

  v_points := case when p_kind = 'practice' then null else greatest(0, least(100, coalesce((p_draft->>'points')::integer, 10))) end;
  v_block := greatest(1, least(4, coalesce((p_draft->>'block_number')::integer, 1)));
  v_attempts := greatest(1, least(20, coalesce((p_draft->>'max_attempts')::integer, case when p_kind = 'practice' then 3 else 1 end)));
  v_timer := nullif((p_draft->>'time_limit_minutes')::integer, 0);
  if v_timer is not null then v_timer := greatest(1, least(1440, v_timer)); end if;

  insert into public.course_activities(
    course_id, created_by, activity_type, title, worksheet_content, question_blocks,
    points, opens_at, closes_at, time_limit_minutes, status, assignment_mode,
    max_attempts, block_number, allow_attachments, max_attachments
  ) values (
    p_course_id, v_user_id, p_kind, left(trim(p_draft->>'title'), 120),
    coalesce(p_draft->>'worksheet_content', ''), v_question_blocks, v_points,
    null, null, v_timer, 'published', 'selected', v_attempts, v_block, true, 5
  ) returning id into v_id;

  insert into public.course_activity_assignments(activity_id, user_id, assigned_by)
  values (v_id, v_user_id, v_user_id)
  on conflict do nothing;

  insert into private.course_activity_answer_keys(activity_id, answer_key, updated_at)
  values (v_id, v_answer_key, now())
  on conflict (activity_id) do update
    set answer_key = excluded.answer_key,
        updated_at = excluded.updated_at;

  return jsonb_build_object('id', v_id, 'kind', p_kind, 'status', 'published', 'personal', true);
end;
$$;

-- ============================================================
-- 4. Validación de preguntas Relacionar parejas
-- ============================================================
-- La estructura de parejas vive en course_activities.question_blocks (JSONB).
-- El frontend usa type = 'matching_pairs', pairs = [{id,left,right}, ...]
-- y guarda como respuesta un objeto {leftPairId: selectedRightPairId}.
-- La siguiente versión de save_course_activity_questions impide publicar
-- una pregunta de parejas incompleta.

create or replace function private.save_course_activity_questions(p_activity_id uuid, p_question_blocks jsonb, p_answer_key jsonb)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'private', 'pg_temp'
as $$
declare
  v_user_id uuid := auth.uid();
  v_status text;
  v_question jsonb;
  v_pair jsonb;
  v_question_id text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not (public.has_role('teacher') or public.has_role('admin')) then raise exception 'Teacher role required'; end if;

  select ca.status into v_status
  from public.course_activities ca
  where ca.id = p_activity_id
    and (ca.created_by = v_user_id or public.has_role('admin'));

  if not found then raise exception 'Activity not found or not editable'; end if;
  if jsonb_typeof(coalesce(p_question_blocks, '[]'::jsonb)) <> 'array' then raise exception 'Question blocks must be a JSON array'; end if;
  if jsonb_typeof(coalesce(p_answer_key, '{}'::jsonb)) <> 'object' then raise exception 'Answer key must be a JSON object'; end if;

  if v_status = 'published' then
    for v_question in select value from jsonb_array_elements(coalesce(p_question_blocks, '[]'::jsonb))
    loop
      if coalesce(v_question->>'type', '') = 'matching_pairs' then
        v_question_id := coalesce(v_question->>'id', '');
        if v_question_id = '' then raise exception 'Matching question requires an id'; end if;
        if coalesce(jsonb_typeof(v_question->'pairs'), '') <> 'array'
           or jsonb_array_length(v_question->'pairs') < 2 then
          raise exception 'Matching questions require at least two pairs';
        end if;

        for v_pair in select value from jsonb_array_elements(v_question->'pairs')
        loop
          if trim(coalesce(v_pair->>'id', '')) = ''
             or trim(coalesce(v_pair->>'left', '')) = ''
             or trim(coalesce(v_pair->>'right', '')) = '' then
            raise exception 'Every matching pair must be complete';
          end if;
        end loop;

        if coalesce(jsonb_typeof(p_answer_key->v_question_id), '') <> 'object' then
          raise exception 'Matching question answer key is invalid';
        end if;
      end if;
    end loop;
  end if;

  update public.course_activities
  set question_blocks = coalesce(p_question_blocks, '[]'::jsonb), updated_at = now()
  where id = p_activity_id;

  insert into private.course_activity_answer_keys(activity_id, answer_key, updated_at)
  values (p_activity_id, coalesce(p_answer_key, '{}'::jsonb), now())
  on conflict (activity_id) do update
    set answer_key = excluded.answer_key,
        updated_at = excluded.updated_at;

  return true;
end;
$$;
