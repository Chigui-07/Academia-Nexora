# v0.27 — Diagnósticos universales

## Motor

- El diagnóstico dejó de estar limitado a Matemática.
- `start_diagnostic`, `get_diagnostic_questions` y `save_diagnostic_answer` funcionan con cualquier `course_key` que tenga diagnóstico activo.
- Los diagnósticos pueden iniciarse desde una solicitud con diagnóstico o desde una inscripción activa, necesario para Formación esencial.
- El resultado mantiene ubicación estimada, temas dominados, temas por reforzar y resumen por nivel.
- Al finalizar un diagnóstico de un curso ya inscrito, el resultado inicial queda asociado a `course_enrollments`.

## Seguridad

- La columna `answer_key` de `diagnostic_questions` ya no puede leerse directamente con el rol `authenticated`.
- La corrección continúa ejecutándose del lado de Supabase.
- Las funciones administrativas privilegiadas viven en `private`; los RPC públicos son wrappers `SECURITY INVOKER`.

## Constructor administrativo

Administración puede crear niveles y preguntas para cualquier curso. Cada pregunta admite varias respuestas equivalentes separadas por comas, dificultad y estado activo/inactivo. Al guardar la primera pregunta, el diagnóstico del curso se activa automáticamente.

## Bancos iniciales

Los 14 cursos activos tienen diagnóstico:

- Matemática: 6 niveles, 194 preguntas.
- Física, Química, Biología, Geografía, Historia, Inglés y Programación básica: 6 niveles, 18 preguntas iniciales cada uno.
- Los seis cursos de Formación esencial: 6 niveles, 18 preguntas iniciales cada uno.

Estos bancos son una base editable y pueden crecer desde el Constructor de diagnósticos.