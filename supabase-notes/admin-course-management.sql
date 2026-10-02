-- v0.20 — Gestión segura del catálogo de cursos
-- Esta migración ya fue aplicada al proyecto Supabase de Academia Nexora.

create or replace function private.admin_save_course(
  p_course_id uuid,
  p_course_key text,
  p_name text,
  p_description text,
  p_icon text,
  p_category text,
  p_active boolean,
  p_diagnostic_available boolean
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'private', 'pg_temp'
as $$
declare
  v_course public.courses%rowtype;
  v_key text := lower(trim(coalesce(p_course_key, '')));
  v_name text := trim(coalesce(p_name, ''));
  v_description text := trim(coalesce(p_description, ''));
  v_icon text := trim(coalesce(p_icon, ''));
  v_category text := trim(coalesce(p_category, ''));
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.has_role('admin') then
    raise exception 'Admin role required';
  end if;

  if v_name = '' then raise exception 'Course name is required'; end if;
  if char_length(v_name) > 100 then raise exception 'Course name is too long'; end if;
  if v_category = '' then v_category := 'General'; end if;
  if char_length(v_category) > 80 then raise exception 'Course category is too long'; end if;
  if char_length(v_description) > 1200 then raise exception 'Course description is too long'; end if;
  if v_icon = '' then v_icon := '📚'; end if;
  if char_length(v_icon) > 16 then raise exception 'Course icon is too long'; end if;

  if p_course_id is null then
    if v_key = '' then raise exception 'Course key is required'; end if;
    if v_key !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
      raise exception 'Course key must use lowercase letters, numbers and hyphens';
    end if;
    if v_key like 'essential-%' or v_key like 'essential\_%' escape '\' then
      raise exception 'Essential course keys are reserved';
    end if;

    insert into public.courses(
      course_key, name, description, icon, category, active,
      diagnostic_available, is_essential, mandatory_days
    ) values (
      v_key, v_name, v_description, v_icon, v_category,
      coalesce(p_active, true), coalesce(p_diagnostic_available, false),
      false, null
    )
    returning * into v_course;

    return v_course.id;
  end if;

  select * into v_course
  from public.courses
  where id = p_course_id
  for update;

  if not found then raise exception 'Course not found'; end if;
  if v_course.is_essential then raise exception 'Essential courses are system-managed'; end if;
  if v_key <> v_course.course_key then raise exception 'Course key cannot be changed'; end if;

  update public.courses
  set name = v_name,
      description = v_description,
      icon = v_icon,
      category = v_category,
      active = coalesce(p_active, v_course.active),
      diagnostic_available = coalesce(p_diagnostic_available, v_course.diagnostic_available)
  where id = p_course_id
  returning * into v_course;

  return v_course.id;
end;
$$;

create or replace function public.admin_save_course(
  p_course_id uuid,
  p_course_key text,
  p_name text,
  p_description text,
  p_icon text,
  p_category text,
  p_active boolean,
  p_diagnostic_available boolean
)
returns uuid
language sql
set search_path to 'public', 'private', 'pg_temp'
as $$
  select private.admin_save_course(
    p_course_id, p_course_key, p_name, p_description,
    p_icon, p_category, p_active, p_diagnostic_available
  );
$$;

revoke all on function private.admin_save_course(uuid,text,text,text,text,text,boolean,boolean) from public;
grant execute on function private.admin_save_course(uuid,text,text,text,text,text,boolean,boolean) to authenticated;
revoke all on function public.admin_save_course(uuid,text,text,text,text,text,boolean,boolean) from public;
grant execute on function public.admin_save_course(uuid,text,text,text,text,text,boolean,boolean) to authenticated;
