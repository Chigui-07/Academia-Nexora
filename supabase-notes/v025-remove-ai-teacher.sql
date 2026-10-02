-- Academia Nexora — v0.25
-- Retiro definitivo del Profesor IA.
-- Aplicar manualmente en Supabase después de desplegar el frontend sin IA.

-- 1. Eliminar funciones públicas/privadas exclusivas del Profesor IA.
drop function if exists public.has_ai_teacher_access();
drop function if exists private.has_ai_teacher_access();
drop function if exists private.save_ai_teacher_draft(text, uuid, jsonb);

-- 2. Eliminar la tabla de acceso exclusiva del Profesor IA.
drop table if exists public.ai_teacher_access;

-- Nota:
-- La Edge Function `nexora-ai-teacher` también debe eliminarse desde Supabase.
-- El secreto `OPENAI_API_KEY`, si fue creado, debe retirarse de los secretos del proyecto.
-- No se tocan course_lessons, course_lesson_assignments, course_activities,
-- course_activity_assignments ni activity_attempt_attachments porque esas funciones
-- también son utilizadas por el sistema académico normal.
