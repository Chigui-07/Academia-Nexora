# Motor de diagnóstico — Matemática

Implementado el 1 de octubre de 2026.

## Regla principal

El diagnóstico inicial de cada curso se realiza **una sola vez**. Para Matemática, `diagnostic_attempts` guarda `course_key = 'matematica'` y existe una restricción única por `user_id + course_key`.

Cerrar el navegador no crea otro intento: si el diagnóstico sigue `in_progress`, el estudiante continúa el mismo intento. Una vez que termina como `completed` o `limit_reached`, no puede comenzar otro.

## Selección permanente

- `diagnostic_attempt_questions` guarda las preguntas sorteadas para el intento.
- El sorteo respeta `diagnostic_question_pools.draw_count`.
- El estudiante ve únicamente el nivel actual.
- El orden y las preguntas elegidas permanecen estables durante todo el intento.

## RPC

- `start_math_diagnostic(course_request_id)` crea o recupera el único intento.
- `get_math_diagnostic_questions(attempt_id)` devuelve las preguntas del nivel actual y sus respuestas guardadas, sin revelar `answer_key`.
- `save_math_diagnostic_answer(attempt_id, question_id, response, action)` guarda y corrige la respuesta en el servidor. Admite `save`, `next` y `limit`.

Las claves correctas siguen protegidas y no se envían al navegador.
