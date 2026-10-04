# v0.40.2 — Acceso a actividades con destinatarios específicos

## Objetivo

Evitar que una tarea, ejercicio o Hoja de ejercicios configurada con `assignment_mode = 'selected'` aparezca o pueda seguir utilizándose desde una cuenta que no esté incluida en `course_activity_assignments`.

## Frontend

- `StudentActivityList` vuelve a comprobar los destinatarios usando `course_activity_assignments` y `auth.uid()` antes de mostrar actividades.
- `DashboardTaskBoard` aplica la misma comprobación para Inicio.
- La comprobación es explícita incluso en cuentas con varios roles; una vista estudiantil no muestra actividades individuales de otros alumnos.

## Backend

Migración aplicada: `enforce_specific_activity_access_v0402`.

`private.save_course_activity_attempt` y `private.submit_course_activity_attempt` vuelven a validar que:

- la actividad siga publicada;
- si es de destinatarios específicos, el usuario actual siga figurando en `course_activity_assignments`.

`private.start_course_activity` ya validaba esta condición y se mantiene.

## Prueba

Se creó una actividad temporal asignada a una sola cuenta dentro de una sentencia que se revirtió al fallar. Al intentar iniciarla con otra cuenta, Supabase respondió `Activity is not assigned to you`. Después se confirmó que quedaron 0 filas de prueba.