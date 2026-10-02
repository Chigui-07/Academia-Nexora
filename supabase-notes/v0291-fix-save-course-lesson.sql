-- Academia Nexora — v0.29.1
-- Corrige el error 403 al guardar/publicar clases.
-- El wrapper public.save_course_lesson es SECURITY INVOKER y llama a
-- private.save_course_lesson, por lo que authenticated necesita permiso
-- explícito para ejecutar la función privada. La función privada mantiene
-- sus comprobaciones de autenticación y roles teacher/admin.

grant usage on schema private to authenticated;
grant execute on function private.save_course_lesson(
  uuid, uuid, text, text, text, text, text, integer, text, text, uuid[]
) to authenticated;

revoke all on function private.save_course_lesson(
  uuid, uuid, text, text, text, text, text, integer, text, text, uuid[]
) from anon;
