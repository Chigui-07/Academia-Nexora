# Motor de diagnóstico — Matemática

Implementado el 1 de octubre de 2026 y ampliado con resultados persistentes.

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

## Resultado persistente

`diagnostic_results` guarda una fotografía del estado del estudiante cuando termina su diagnóstico. El estudiante puede leer su propio resumen, pero no insertar, editar ni borrar resultados.

Para Matemática se considera dominado un nivel cuando:

- se respondieron todas las preguntas seleccionadas de ese nivel; y
- al menos el **70 %** fueron correctas.

La **ubicación estimada** es el primer nivel que no alcanza ese criterio. Si los seis niveles se dominan, la ubicación queda en Nivel 6 y `mastered_through_level = 6`.

El resultado también guarda:

- `mastered_topics` — grupos completados con dominio;
- `reinforce_topics` — grupos respondidos que necesitan refuerzo o donde se pulsó `Mi límite`;
- `level_summary` — aciertos, respuestas, total seleccionado, porcentaje y estado de dominio por nivel;
- `final_status` — `completed` o `limit_reached`.

La creación del resultado ocurre dentro de `private.finalize_math_diagnostic_result(...)`, llamada por la lógica privilegiada al finalizar el intento. No depende del navegador para calcular o guardar la colocación.

## Historial

La sección principal **Diagnósticos** consulta los intentos y `diagnostic_results` del usuario para mostrar:

- intentos en progreso, con opción de continuar;
- ubicación estimada de cada diagnóstico finalizado;
- temas dominados al comenzar;
- temas que necesitaban refuerzo;
- detalle histórico por nivel.

Esto permite comparar el punto de partida con el progreso futuro sin repetir el diagnóstico inicial.
