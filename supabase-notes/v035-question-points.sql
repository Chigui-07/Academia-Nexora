-- Academia Nexora v0.35
-- Valor manual por pregunta para tareas y ejercicios.
-- Aplicado en Supabase mediante la migración question_points_v035.
--
-- question_blocks ya es JSONB, por lo que cada bloque puede guardar `points`
-- sin crear una tabla o columna nueva. La validación se hace al publicar.

create or replace function private.save_course_activity(
  p_activity_id uuid,
  p_course_id uuid,
  p_activity_type text,
  p_title text,
  p_worksheet_content text,
  p_question_blocks jsonb,
  p_answer_key jsonb,
  p_points smallint,
  p_opens_at timestamptz,
  p_closes_at timestamptz,
  p_time_limit_minutes integer,
  p_max_attempts smallint,
  p_block_number smallint,
  p_assignment_mode text,
  p_status text,
  p_user_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  v_user_id uuid := auth.uid();
  v_activity_id uuid := p_activity_id;
  v_question jsonb;
  v_question_points numeric;
  v_question_points_total numeric := 0;
  v_expected_points numeric;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not (public.has_role('teacher') or public.has_role('admin')) then
    raise exception 'Teacher role required';
  end if;
  if p_activity_type not in ('notebook_task','virtual_task','practice') then raise exception 'Invalid activity type'; end if;
  if p_assignment_mode not in ('course','selected') then raise exception 'Invalid assignment mode'; end if;
  if p_status not in ('draft','published') then raise exception 'Invalid activity status'; end if;
  if char_length(trim(coalesce(p_title,''))) < 2 then raise exception 'Activity title required'; end if;
  if not exists (select 1 from public.courses c where c.id=p_course_id and c.active=true) then raise exception 'Course not available'; end if;
  if p_activity_type='practice' and p_points is not null then raise exception 'Practice activities cannot have academic points'; end if;
  if p_activity_type in ('notebook_task','virtual_task') and (p_points is null or p_points < 0 or p_points > 100) then raise exception 'Activity points must be between 0 and 100'; end if;
  if p_max_attempts < 1 or p_max_attempts > 20 then raise exception 'Invalid max attempts'; end if;
  if p_block_number < 1 or p_block_number > 4 then raise exception 'Invalid block number'; end if;
  if p_time_limit_minutes is not null and (p_time_limit_minutes < 1 or p_time_limit_minutes > 1440) then raise exception 'Invalid time limit'; end if;
  if p_opens_at is not null and p_closes_at is not null and p_closes_at <= p_opens_at then raise exception 'Invalid activity dates'; end if;
  if trim(coalesce(p_worksheet_content,''))='' and jsonb_array_length(coalesce(p_question_blocks,'[]'::jsonb))=0 then raise exception 'Activity requires instructions or questions'; end if;
  if p_assignment_mode='selected' and coalesce(array_length(p_user_ids,1),0)=0 then raise exception 'Select at least one student'; end if;

  if p_status='published' and jsonb_array_length(coalesce(p_question_blocks,'[]'::jsonb)) > 0 then
    for v_question in
      select value from jsonb_array_elements(coalesce(p_question_blocks,'[]'::jsonb))
    loop
      if not (v_question ? 'points') or jsonb_typeof(v_question->'points') <> 'number' then
        raise exception 'Asigna un valor manual a cada pregunta antes de publicar.';
      end if;

      v_question_points := (v_question->>'points')::numeric;
      if v_question_points < 0 or v_question_points > 100 or v_question_points <> trunc(v_question_points) then
        raise exception 'El valor de cada pregunta debe ser un número entero entre 0 y 100.';
      end if;
      v_question_points_total := v_question_points_total + v_question_points;
    end loop;

    v_expected_points := case when p_activity_type='practice' then 100 else p_points end;
    if v_question_points_total <> v_expected_points then
      raise exception 'La suma de los valores de las preguntas (%) debe ser exactamente % puntos.', v_question_points_total, v_expected_points;
    end if;
  end if;

  if v_activity_id is null then
    insert into public.course_activities(
      course_id, created_by, activity_type, title, worksheet_content, question_blocks,
      points, opens_at, closes_at, time_limit_minutes, max_attempts, block_number,
      assignment_mode, status
    ) values (
      p_course_id, v_user_id, p_activity_type, trim(p_title), coalesce(p_worksheet_content,''), coalesce(p_question_blocks,'[]'::jsonb),
      p_points, p_opens_at, p_closes_at, p_time_limit_minutes, p_max_attempts, p_block_number,
      p_assignment_mode, p_status
    ) returning id into v_activity_id;
  else
    update public.course_activities ca
    set course_id=p_course_id,
        activity_type=p_activity_type,
        title=trim(p_title),
        worksheet_content=coalesce(p_worksheet_content,''),
        question_blocks=coalesce(p_question_blocks,'[]'::jsonb),
        points=p_points,
        opens_at=p_opens_at,
        closes_at=p_closes_at,
        time_limit_minutes=p_time_limit_minutes,
        max_attempts=p_max_attempts,
        block_number=p_block_number,
        assignment_mode=p_assignment_mode,
        status=p_status
    where ca.id=v_activity_id
      and (ca.created_by=v_user_id or public.has_role('admin'));
    if not found then raise exception 'Activity not found or not editable'; end if;
  end if;

  perform private.save_course_activity_questions(v_activity_id, coalesce(p_question_blocks,'[]'::jsonb), coalesce(p_answer_key,'{}'::jsonb));
  perform private.save_course_activity_assignments(v_activity_id, p_assignment_mode, coalesce(p_user_ids,'{}'::uuid[]));
  return v_activity_id;
end;
$$;

revoke all on function private.save_course_activity(uuid,uuid,text,text,text,jsonb,jsonb,smallint,timestamptz,timestamptz,integer,smallint,smallint,text,text,uuid[]) from public, anon;
grant execute on function private.save_course_activity(uuid,uuid,text,text,text,jsonb,jsonb,smallint,timestamptz,timestamptz,integer,smallint,smallint,text,text,uuid[]) to authenticated;
