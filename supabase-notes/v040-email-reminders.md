# v0.40 — Recordatorios externos por correo

Migración aplicada en Supabase: `student_email_reminders_v040`.

## Comportamiento

- Solo aplica a `notebook_task`, `virtual_task` y `exercise_sheet`.
- Los ejercicios prácticos no generan correos.
- Se crea como máximo un recordatorio `unseen_24h` por alumno/actividad: queda programado 24 horas después del aviso interno y se cancela si el alumno ya abrió la notificación, inició un intento o confirmó Enterado/Revisado.
- Si la actividad tiene `closes_at`, se crea además un recordatorio `due_24h`, programado 24 horas antes del cierre. Se cancela si la actividad ya fue entregada o cerró.
- Cada envío fallido se reintenta como máximo 3 veces, con una hora entre intentos.
- El cron revisa la cola una vez por hora.

## Backend

- Tabla: `public.student_email_reminders`.
- RLS habilitado; `anon` y `authenticated` no tienen acceso directo.
- Token privado del cron guardado en `private.runtime_secrets`.
- RPCs de backend, ejecutables solo por `service_role`:
  - `get_email_reminder_cron_token()`
  - `claim_due_student_email_reminders(integer)`
  - `complete_student_email_reminder(uuid, text)`
  - `fail_student_email_reminder(uuid, text)`
- Edge Function: `send-task-reminders`.
- Cron: `nexora-email-reminders-hourly`, minuto 10 de cada hora.

## Proveedor

La Edge Function usa Resend. Para activar envío real hay que configurar en Supabase > Edge Functions > Secrets:

- `RESEND_API_KEY`
- `NEXORA_REMINDER_FROM`, por ejemplo `Academia Nexora <tareas@dominio-verificado.com>`
- `NEXORA_PUBLIC_URL` es opcional; por defecto usa `https://chigui-07.github.io/Academia-Nexora/`.

No se guarda ninguna API key en GitHub.

## Verificación

- Prueba transaccional: se generaron correctamente `unseen_24h` y `due_24h` y luego se revirtió sin dejar datos de prueba.
- La llamada real del cron a la Edge Function respondió HTTP 200 con `configured: false` mientras faltan las credenciales de Resend, por lo que no se pierden recordatorios ni se intenta enviar correo sin configuración.
