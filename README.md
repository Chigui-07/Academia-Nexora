# 🎓 Academia Nexora

**Academia Nexora** es una plataforma educativa multiusuario para estudiar, organizar cursos y avanzar mediante un sistema propio de etapas y niveles.

## 📌 Estado del proyecto

**Fase actual: v0.26 — núcleo académico automático.**

- Frontend: Next.js + TypeScript + CSS.
- Publicación: GitHub Pages.
- Backend, Auth, Storage y datos: Supabase.
- El proyecto no depende de APIs de IA de pago.

La base incluye registro, perfiles, Carné Nexora, roles, cursos, solicitudes e inscripciones, diagnósticos, clases, tareas, ejercicios, preguntas configurables, archivos privados, intentos persistentes, revisión y calificación manual, presencia en línea, Formación esencial, PMA, etapas, niveles, bloques, historial académico y ascenso automático.

## 🧭 Navegación

- 🏠 Inicio
- 📚 Cursos
- ➕ Solicitar curso
- 🧠 Diagnósticos
- 📝 Tareas
- 📊 Calificaciones
- 🟢 En línea
- 🏅 Perfil
- ⚙️ Administración, según permisos

## 👤 Cuentas y roles

Cada usuario dispone de nombre académico, nombre de usuario y Carné Nexora único. Los roles son `student`, `teacher` y `admin`; una misma cuenta puede tener más de un rol.

Supabase Auth gestiona registro, confirmación por correo, inicio de sesión y recuperación de contraseña.

## 📚 Cursos

Los cursos viven en `courses`. Una inscripción activa vive en `course_enrollments`.

Administración puede crear, editar, activar o desactivar materias, aceptar solicitudes y asignar o retirar cursos directamente. Retirar una materia conserva su historial.

Cada curso dispone de **Resumen, Clases, Tareas, Ejercicios y Calificaciones**.

## 🧠 Diagnósticos

El diagnóstico inicial es opcional y no da puntos académicos. Actualmente Matemática dispone de un motor funcional con **194 preguntas permanentes distribuidas en 6 niveles**, con resultados, temas dominados y temas a reforzar.

## 👨‍🏫 Clases y actividades

Profesor puede crear clases y decidir si se publican para todo el curso o para estudiantes específicos.

Las actividades disponibles son:

- 📝 Tarea de cuaderno
- 💻 Tarea virtual
- ✏️ Ejercicio práctico

Una actividad puede configurar curso, destinatarios, título, bloque, punteo, intentos, apertura, cierre, cronómetro, instrucciones, preguntas y estado Borrador/Publicada.

Los ejercicios prácticos se califican sobre 100 como retroalimentación, pero no afectan el promedio académico.

### Tipos de pregunta

- Respuesta escrita
- Elección única
- Selección múltiple
- Verdadero o falso
- Relacionar parejas
- Subir archivo

Los archivos viven en el bucket privado `activity-submissions`, con hasta **20 MB por archivo** y entre **1 y 5 archivos** configurables por pregunta de subida.

Las respuestas correctas objetivas permanecen protegidas en `private.course_activity_answer_keys`.

## ✍️ Intentos y revisión

Los intentos son persistentes, guardan automáticamente las respuestas y pueden tener cronómetro. Al entregar, respuestas y archivos quedan bloqueados.

Profesor revisa cada pregunta como correcta o incorrecta, puede escribir comentarios individuales y retroalimentación general, y decide manualmente la nota final del intento. Cada revisión queda firmada.

Si una actividad permite varios intentos, Nexora conserva para el promedio el mejor resultado válido.

## 🏆 Sistema académico

Nexora no usa años escolares como medida de progreso.

**Etapa → Nivel → Bloques → Materias**

Existen **5 etapas de 10 niveles cada una**, para un total de **50 niveles académicos**:

| Etapa | Niveles | Nota mínima |
|---|---:|---:|
| 🌱 Fundamentos | 1–10 | 60/100 |
| 📘 Intermedio | 1–10 | 65/100 |
| 🧠 Avanzado | 1–10 | 70/100 |
| 🎓 Superior | 1–10 | 75/100 |
| 🏆 Dominio | 1–10 | 80/100 |

Cada clase y actividad pertenece a una **etapa y nivel concretos**. El estudiante solo recibe contenido correspondiente a su progreso actual.

### 📊 Bloques

Cada materia tiene **4 bloques por nivel**.

Cada bloque dispone de exactamente **100 puntos publicados**. Nexora impide publicar tareas normales que hagan superar ese límite.

Un bloque tiene dos estados distintos:

- **Cerrado:** ya existen 100 puntos publicados.
- **Completo:** además, todas sus actividades calificables ya tienen una calificación válida para el estudiante.

### Nota final

Cuando los cuatro bloques están completos, la nota final de la materia se calcula automáticamente:

`(Bloque 1 + Bloque 2 + Bloque 3 + Bloque 4) / 4`

La materia se aprueba si la nota final alcanza el mínimo correspondiente a la etapa.

## 🔁 PMA

Administración puede escoger una tarea original y pulsar **Aplicar PMA**.

Nexora crea un borrador de recuperación que conserva automáticamente:

- materia;
- tipo de actividad;
- punteo;
- bloque;
- etapa y nivel;
- destinatarios.

Profesor escribe ejercicios distintos del mismo tema y puede definir intentos, cronómetro, fechas e instrucciones antes de publicarlo.

El PMA **no agrega puntos nuevos al bloque**. Original y PMA ocupan el mismo espacio académico y Nexora conserva automáticamente el resultado más alto.

## ⬆️ Ascenso automático

Después de cada calificación, Supabase vuelve a calcular el progreso académico.

Para aprobar un nivel:

1. cada materia activa debe tener sus cuatro bloques completos;
2. Nexora calcula la nota final de cada materia;
3. todas las materias deben alcanzar el mínimo de la etapa.

Si alguna materia queda debajo del mínimo, el nivel pasa a **Pendiente de aprobación**. Las materias aprobadas se conservan y solo la materia pendiente necesita recuperación.

Cuando todas las materias quedan aprobadas, Nexora guarda el nivel en el historial y avanza automáticamente:

- Nivel 1 → Nivel 2 → … → Nivel 10;
- al superar Nivel 10, pasa a Nivel 1 de la siguiente etapa;
- 🏆 Dominio · Nivel 10 es actualmente el máximo disponible.

## 📜 Historial y Perfil

`academic_level_history` conserva una fotografía permanente de cada nivel aprobado: etapa, nivel, mínimo requerido, resultados de materias y fecha de finalización.

Perfil muestra automáticamente:

- etapa y nivel actuales;
- progreso dentro de la etapa;
- nota mínima;
- estado académico;
- estado de cada materia y sus cuatro bloques;
- historial de niveles completados.

## 🟢 Presencia

Cada sesión autenticada actualiza `user_presence`. Nexora distingue:

- 🟢 En línea
- 🟡 Inactivo
- ⚫ Desconectado

La vista general no expone Carné Nexora ni datos administrativos.

## 🌱 Formación esencial

Durante los primeros 365 días se asignan automáticamente:

- ✍️ Caligrafía y escritura clara
- 📖 Comprensión y expresión lectora
- 📝 Ortografía y redacción
- 🧮 Cálculo mental y agilidad numérica
- 🧩 Lógica y razonamiento
- 📅 Organización y hábitos de estudio

## 🔐 Seguridad

- RLS protege perfiles, cursos, solicitudes, inscripciones, clases, actividades, intentos, historial y archivos.
- El estudiante solo recibe contenido publicado que le corresponde.
- Las claves correctas no se exponen al navegador del estudiante.
- Crear, guardar y entregar intentos pasa por funciones de servidor.
- PMA valida servidor a servidor su relación con la tarea original.
- El historial académico no admite escritura directa del estudiante.
- Los RPC académicos públicos usan wrappers `SECURITY INVOKER`; las operaciones privilegiadas permanecen en funciones privadas con comprobaciones explícitas de autenticación y roles.

**Antes de una beta pública amplia:** activar **Leaked Password Protection** en Supabase Auth.

## 🗄️ Datos principales

- `profiles`
- `user_roles`
- `user_presence`
- `courses`
- `course_requests`
- `course_enrollments`
- `course_lessons`
- `course_lesson_assignments`
- `course_activities`
- `course_activity_assignments`
- `activity_attempts`
- `activity_attempt_attachments`
- `academic_level_history`
- `admin_notifications`
- tablas de diagnóstico
- `private.course_activity_answer_keys`

Storage privado: `activity-submissions`.

Las migraciones y cambios de Supabase se documentan en `supabase-notes/`.

## ✅ Base funcional v0.26

La base académica principal queda definida: autenticación, cursos, contenido, tareas, intentos, revisión, calificaciones, cuatro bloques, PMA, 50 niveles, ascenso automático, historial, perfil y presencia.

El proyecto continuará recibiendo mejoras, pruebas, contenido y funciones nuevas, pero estas ya no son necesarias para definir la estructura académica central.

## 🚧 Antes de compartir ampliamente

1. Activar **Leaked Password Protection** en Supabase Auth.
2. Eliminar manualmente la antigua Edge Function `nexora-ai-teacher` y cualquier secreto `OPENAI_API_KEY` que todavía exista.
3. Confirmar el despliegue de GitHub Pages y hacer una prueba completa con una segunda cuenta.
4. Añadir SEO público (metadatos, `robots.txt` y `sitemap.xml`) si se quiere que buscadores como Google encuentren Academia Nexora con facilidad.

---

# 📒 Bitácora

### 30 de septiembre de 2026 — Inicio
Se creó Academia Nexora y se definió la primera estructura de cursos, tareas, ejercicios, calificaciones, PMA y progresión.

### 1 de octubre de 2026 — v0.3 a v0.14
Registro, login, Carné Nexora, roles, diagnóstico de Matemática, catálogo, solicitudes, inscripciones, creador de contenido, intentos persistentes, autosave y cronómetro.

### 2 de octubre de 2026 — v0.15 a v0.20
Recuperación de contraseña, bibliotecas de tareas, revisión detallada, administración por alumno, calificaciones por curso, tablero de tareas y gestión de cursos.

### 2 de octubre de 2026 — v0.21–v0.22
Se experimentó con Profesor IA y se añadieron clases individuales, Storage privado, preguntas de parejas y la base Etapa + Nivel.

### 2 de octubre de 2026 — v0.23
Presencia en línea, estados de actividad y cambio definitivo de Año a Nivel.

### 2 de octubre de 2026 — v0.24 / v0.24.1
Clases dirigidas, archivos por pregunta, presencia general y corrección de permisos de presencia.

### 2 de octubre de 2026 — v0.25
Se retiró Profesor IA del producto y se decidió que las funciones principales de Nexora no dependerán de APIs de pago.

### 2 de octubre de 2026 — v0.26
Se implementó el núcleo académico automático: 5 etapas × 10 niveles, bloques de 100 puntos, nota final automática, PMA por tarea, recuperación de materias, ascenso automático, snapshots por intento, historial permanente y perfil dinámico.

---

> Este README funciona como resumen general y bitácora del proyecto y debe mantenerse actualizado con cada cambio importante.
