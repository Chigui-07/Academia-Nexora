# v0.33 — Formación esencial anual única

Supabase recibió la migración `essential_subject_annual_track_v033`.

## Decisión académica

Formación esencial deja de comportarse como seis materias repetibles por nivel. Las seis materias existentes se conservan internamente como áreas para no perder diagnósticos, clases, actividades, intentos ni historial, pero en la interfaz se agrupan como una sola materia anual.

- Duración obligatoria: 365 días desde la creación del perfil.
- Se cursa una sola vez.
- No se reactiva ni se repite después de `required_until`.
- 6 áreas internas.
- 100 puntos por área y bloque.
- 600 puntos por bloque entre las seis áreas.
- 4 bloques.
- 2400 puntos máximos durante el año.

## Cambios de servidor

- `public.enroll_essential_courses_for_user(uuid)` ya no reactiva una inscripción esencial vencida.
- Las inscripciones esenciales vencidas quedan en `paused` cuando la función sincroniza al usuario.
- `private.validate_academic_activity()` aplica el límite de 100 puntos por bloque a cada área esencial a lo largo de todo el año, sin reiniciar el cupo por etapa o nivel.
- `private.start_course_activity(uuid)` permite actividades esenciales entre niveles mientras el período anual siga vigente y bloquea nuevos intentos al vencer.
- `private.acknowledge_course_activity(uuid)` aplica la misma regla anual a Enterado/Revisado.
- RLS de `course_lessons` y `course_activities` permite el contenido esencial durante el año aunque cambie la etapa/nivel, pero lo bloquea después de `required_until`.
- `private.recalculate_academic_progress(uuid, boolean)` excluye las áreas esenciales de la progresión repetible por nivel; Formación esencial tiene un recorrido anual separado.

## Compatibilidad

No se eliminaron los seis cursos esenciales existentes ni sus IDs. Los diagnósticos, preguntas, clases, tareas, intentos y resultados ya guardados permanecen asociados a sus áreas originales.
