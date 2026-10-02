-- Academia Nexora — Profesor IA
-- Aplicada en Supabase como: add_ai_teacher_access_and_draft_save

create table if not exists public.ai_teacher_access (
  slot smallint primary key default 1 check (slot = 1),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_teacher_access enable row level security;
revoke all on table public.ai_teacher_access from anon, authenticated;

-- Nexora reserva un único asiento para Profesor IA.
-- En la migración de producción se asignó automáticamente a la única cuenta
-- que tenía simultáneamente roles admin y teacher.

create or replace function private.has_ai_teacher_access()
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.ai_teacher_access a
      where a.slot = 1
        and a.user_id = auth.uid()
        and a.enabled = true
    );
$$;

create or replace function public.has_ai_teacher_access()
returns boolean
language sql
stable
set search_path = public, private, pg_temp
as $$
  select private.has_ai_teacher_access();
$$;

-- save_ai_teacher_draft(kind, course_id, draft)
-- guarda exclusivamente borradores de clases, tareas o ejercicios.
-- La función privada vuelve a comprobar autenticación y el asiento de Profesor IA.
-- Las actividades generadas se guardan con assignment_mode='course' y status='draft'.
-- Las claves de respuestas se guardan en private.course_activity_answer_keys.

-- La definición completa aplicada en producción vive en el historial de migraciones
-- de Supabase. Este archivo documenta el contrato y las reglas de seguridad usadas
-- por el frontend y la Edge Function nexora-ai-teacher.
