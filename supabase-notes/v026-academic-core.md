# Academia Nexora — v0.26 · Núcleo académico automático

Migraciones aplicadas en Supabase el 2 de octubre de 2026.

## Estructura académica

- 5 etapas: Fundamentos, Intermedio, Avanzado, Superior y Dominio.
- 10 niveles por etapa (50 niveles en total).
- Nota mínima: 60, 65, 70, 75 y 80 respectivamente.
- Cada materia mantiene 4 bloques de 100 puntos por nivel.
- Un bloque queda cerrado cuando suma exactamente 100 puntos publicados.
- La nota final de una materia es `(Bloque 1 + Bloque 2 + Bloque 3 + Bloque 4) / 4`.

## Datos añadidos

`course_activities`:
- `academic_stage`
- `academic_level`
- `pma_source_activity_id`

`course_lessons`:
- `academic_stage`
- `academic_level`

`activity_attempts`:
- `stage_snapshot`
- `level_snapshot`

Nueva tabla:
- `academic_level_history`

## PMA

`create_pma_activity()` crea un borrador ligado a una tarea original. El PMA hereda curso, tipo, punteo, bloque, etapa, nivel y destinatarios. Profesor puede cambiar ejercicios, intentos, cronómetro, fechas e instrucciones antes de publicarlo. Para calificaciones, original y PMA compiten por el mismo espacio: solo se conserva el mejor resultado.

## Progresión automática

`get_my_academic_progress()` recalcula el expediente del usuario. La lógica comprueba los cuatro bloques de todas las materias activas, aplica el mínimo de la etapa y, cuando todas están completas y aprobadas, guarda una fotografía permanente en `academic_level_history` y avanza automáticamente de nivel o etapa.

El mismo recálculo se ejecuta después de una calificación guardada. Dominio · Nivel 10 es actualmente el máximo disponible.

## Seguridad

- El estudiante solo recibe contenido publicado correspondiente a su etapa y nivel actual.
- Profesor y Administración conservan acceso global de gestión.
- Las RPC públicas nuevas son `SECURITY INVOKER`; las comprobaciones privilegiadas viven en funciones privadas con validación explícita de `auth.uid()` y roles.
- RLS protege `academic_level_history`; cada estudiante lee su propio historial y Profesor/Administración pueden consultarlo.
- Se añadieron índices para el alcance académico, historial, snapshots de intentos y relaciones PMA.

## Pendiente antes de beta pública

- Activar **Leaked Password Protection** en Supabase Auth.
- Retirar manualmente la Edge Function antigua `nexora-ai-teacher` y cualquier secreto `OPENAI_API_KEY` si todavía existen en el proyecto.
