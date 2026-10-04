# v0.32.1 — Confirmación de revisión en ejercicios

## Objetivo

Extender la confirmación de lectura/revisión de v0.32 a los ejercicios prácticos.

## Cambios aplicados en Supabase

- `private.set_activity_acknowledgement_label()` ahora asigna automáticamente:
  - `notebook_task` → `enterado`
  - `virtual_task` → `revisado`
  - `practice` → `revisado`
- Los ejercicios prácticos existentes con `acknowledgement_label = null` fueron actualizados a `revisado`.
- `private.acknowledge_course_activity(uuid)` acepta ahora `practice` además de los dos tipos de tarea.
- La misma validación de autenticación, curso, nivel y asignación continúa aplicándose.
- La confirmación sigue siendo independiente de intentos, entregas y calificaciones.

## Verificación

Se ejecutó una prueba transaccional con un ejercicio práctico publicado y un estudiante con acceso válido. La confirmación se guardó correctamente dentro de la transacción y después se hizo `ROLLBACK`; no quedó ningún registro de prueba.

El asesor de seguridad no reportó alertas nuevas relacionadas con esta función. Permanecen únicamente los avisos preexistentes de las funciones públicas de presencia y la protección de contraseñas filtradas desactivada.
