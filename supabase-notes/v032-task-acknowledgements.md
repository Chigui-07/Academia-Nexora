# v0.32 — Confirmación de lectura de tareas

## Objetivo

Añadir una constancia simple de que el estudiante ya revisó una tarea, sin mezclarla con entregas, intentos ni calificaciones.

## Base de datos

Se añadió `course_activities.acknowledgement_label` con los valores permitidos:

- `enterado`
- `revisado`
- `null`

Se añadió `activity_acknowledgements` con clave única `(activity_id, user_id)` y `acknowledged_at`.

RLS permite a cada estudiante leer su propia confirmación y a profesor/admin consultar confirmaciones. La escritura se realiza mediante `acknowledge_course_activity(uuid)`, que valida autenticación, publicación, etapa/nivel, inscripción y asignación de la tarea.

## Regla automática

- Tarea de cuaderno → `Enterado`
- Tarea virtual → `Revisado`
- Ejercicio práctico → sin confirmación

Las tareas existentes se actualizaron con esta regla y un trigger la aplica a tareas nuevas.

## Interfaz

Al final de cada tarea el estudiante ve una tarjeta de **Confirmación de lectura**. Al pulsar el botón, Nexora guarda la fecha y hora. Una vez confirmada, el botón queda bloqueado y se muestra cuándo se realizó la confirmación.

La confirmación no entrega la tarea, no cambia el intento y no afecta la nota.