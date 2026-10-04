# v0.40 — Recordatorios externos

## Push del navegador/dispositivo

Academia Nexora añade notificaciones push opcionales para estudiantes.

- Se activan manualmente desde la campana de notificaciones.
- Requieren permiso del navegador/dispositivo.
- Se envían para Tarea de cuaderno, Tarea virtual y Hoja de ejercicios.
- Los ejercicios prácticos no generan push.
- Una tarea nueva puede generar un push mientras su aviso interno siga sin leer.
- Una tarea pendiente puede generar un recordatorio cuando falten menos de 24 horas para el cierre.
- Si el intento ya fue entregado, el recordatorio de vencimiento no se envía.
- Las suscripciones inválidas se desactivan automáticamente cuando el proveedor devuelve 404 o 410.
- El cron `nexora-push-notifications-5min` revisa la cola cada 5 minutos.

La clave pública VAPID puede vivir en el frontend. La clave privada VAPID y el token del cron permanecen en `private.student_push_config` y no se guardan en GitHub.

Edge Function: `send-student-push`.

## Correo

La infraestructura de recordatorios por correo también quedó preparada mediante `student_email_reminders` y `send-task-reminders`.

Como Academia Nexora todavía no tiene un dominio propio verificado, Resend permanece desactivado para envíos reales a estudiantes. La cola conserva la lógica para poder activar correo más adelante sin rediseñar el sistema.

## Privacidad y permisos

`student_push_subscriptions` usa RLS: cada estudiante solo puede consultar, crear, actualizar o eliminar sus propias suscripciones.

`student_push_deliveries` no es accesible directamente por `anon` ni `authenticated`; únicamente el backend de servicio procesa la cola.
