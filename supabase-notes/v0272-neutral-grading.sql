-- Academia Nexora — v0.27.2
-- Decisión neutral al revisar respuestas.
--
-- Una pregunta revisada puede quedar como:
--   correct   = Correcta
--   neutral   = Neutral (decisión tomada, no pendiente)
--   incorrect = Incorrecta
--
-- La calificación numérica final sigue siendo manual.

create or replace function private.grade_course_activity_attempt(
  p_attempt_id uuid,
  p_question_reviews jsonb,
  p_question_feedback jsonb,
  p_grade_value numeric,
  p_feedback text default null
)
returns table(
  reviewed_at timestamptz,
  reviewer_name text,
  grade_value numeric,
  grade_max numeric
)
language plpgsql
security definer
set search_path to 'public', 'private', 'pg_temp'
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt public.activity_attempts%rowtype;
  v_activity public.course_activities%rowtype;
  v_review jsonb := coalesce(p_question_reviews, '{}'::jsonb);
  v_question_feedback jsonb := coalesce(p_question_feedback, '{}'::jsonb);
  v_question jsonb;
  v_key text;
  v_max numeric;
  v_name text;
  v_reviewed_at timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not (public.has_role('teacher') or public.has_role('admin')) then
    raise exception 'Teacher role required';
  end if;

  if jsonb_typeof(v_review) <> 'object' then
    raise exception 'Question reviews must be a JSON object';
  end if;

  if jsonb_typeof(v_question_feedback) <> 'object' then
    raise exception 'Question feedback must be a JSON object';
  end if;

  select * into v_attempt
  from public.activity_attempts
  where id = p_attempt_id
  for update;

  if not found then
    raise exception 'Attempt not found';
  end if;

  if v_attempt.status not in ('submitted', 'timed_out') then
    raise exception 'Attempt must be finished before grading';
  end if;

  select * into v_activity
  from public.course_activities
  where id = v_attempt.activity_id;

  if not found then
    raise exception 'Activity not found';
  end if;

  if v_activity.created_by <> v_user_id and not public.has_role('admin') then
    raise exception 'You cannot grade this activity';
  end if;

  for v_question in
    select value from jsonb_array_elements(coalesce(v_activity.question_blocks, '[]'::jsonb))
  loop
    v_key := v_question->>'id';
    if v_key is null or v_key = '' then
      continue;
    end if;

    if not (v_review ? v_key) then
      raise exception 'Every question must have a review decision';
    end if;

    if (v_review->>v_key) not in ('correct', 'neutral', 'incorrect') then
      raise exception 'Question review values must be correct, neutral or incorrect';
    end if;
  end loop;

  for v_key in select jsonb_object_keys(v_review)
  loop
    if not exists (
      select 1
      from jsonb_array_elements(coalesce(v_activity.question_blocks, '[]'::jsonb)) q
      where q->>'id' = v_key
    ) then
      raise exception 'Question review contains an unknown question';
    end if;
  end loop;

  for v_key in select jsonb_object_keys(v_question_feedback)
  loop
    if not exists (
      select 1
      from jsonb_array_elements(coalesce(v_activity.question_blocks, '[]'::jsonb)) q
      where q->>'id' = v_key
    ) then
      raise exception 'Question feedback contains an unknown question';
    end if;

    if length(coalesce(v_question_feedback->>v_key, '')) > 1500 then
      raise exception 'Question feedback is too long';
    end if;
  end loop;

  v_max := coalesce(v_activity.points::numeric, 100::numeric);
  if p_grade_value is null or p_grade_value < 0 or p_grade_value > v_max then
    raise exception 'Grade must be between 0 and %', v_max;
  end if;

  select coalesce(
    nullif(trim(display_name), ''),
    nullif(trim(concat_ws(' ', first_name, last_name)), ''),
    username,
    'Profesor'
  )
  into v_name
  from public.profiles
  where id = v_user_id;

  v_name := coalesce(v_name, 'Profesor');

  update public.activity_attempts
  set question_reviews = v_review,
      question_feedback = v_question_feedback,
      grade_value = p_grade_value,
      grade_max = v_max,
      feedback = nullif(trim(coalesce(p_feedback, '')), ''),
      reviewed_by = v_user_id,
      reviewer_name = v_name,
      reviewed_at = v_reviewed_at,
      updated_at = now()
  where id = p_attempt_id;

  return query select v_reviewed_at, v_name, p_grade_value, v_max;
end;
$$;
