# v0.34 — Diagnósticos eliminados y Administración ordenada

## Supabase

El sistema de diagnósticos se eliminó por completo.

Se retiraron:

- tablas `diagnostic_*`;
- RPC y funciones públicas/privadas de diagnóstico;
- `courses.diagnostic_available`;
- `course_requests.diagnostic_opt_in`;
- `course_enrollments.diagnostic_result_id`;
- `course_enrollments.starting_level`;
- `course_enrollments.starting_title`.

`admin_resolve_course_request` fue actualizado para aceptar cursos sin depender de resultados de diagnóstico.

`admin_save_course` ahora usa la firma:

```text
admin_save_course(uuid, text, text, text, text, text, boolean)
```

Las solicitudes continúan creando inscripciones normales y Formación esencial conserva su lógica anual independiente.

## Frontend

- Se eliminaron las rutas `/diagnostics`, `/diagnostic/run` y `/diagnostic/math`.
- Se eliminó `AdminDiagnosticBuilder`.
- Navegación, solicitudes, cursos e inscripciones dejaron de consultar campos de diagnóstico.
- Administración usa botones exclusivos: al abrir una sección, cualquier otra deja de mostrarse.
- `Tareas y ejercicios` es la sección inicial para facilitar la publicación rápida de actividades.
- Cuentas con rol `admin` o `teacher` ven acceso a Administración en menú lateral y barra superior.
