# Carné Nexora

La migración `add_unique_student_codes` fue aplicada directamente en Supabase el 1 de octubre de 2026.

- Campo: `profiles.student_code`
- Formato: `NXR-AA-XXXX`
- Único y obligatorio
- Generado automáticamente durante el alta de usuario
- Sin permisos de edición para usuarios normales
- `AA` corresponde al año de registro
- No se utiliza como contraseña ni método de inicio de sesión

Este archivo solo documenta el cambio de base de datos para mantener el repositorio alineado con Supabase.
