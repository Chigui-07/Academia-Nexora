# 🎓 Academia Nexora

**Academia Nexora** es una plataforma educativa multiusuario para aprender desde cero, avanzar por etapas y organizar cursos, clases, tareas, ejercicios, calificaciones, diagnósticos y logros.

## 📌 Estado del proyecto

**Fase actual: v0.10 — Preguntas configurables y Formación esencial.**

Frontend: Next.js + TypeScript + CSS, publicado con GitHub Pages.  
Backend, autenticación y datos: Supabase.

Ya existen registro, confirmación por correo, perfiles, Carné Nexora, roles, onboarding, solicitudes e inscripciones, diagnóstico funcional de Matemática, historial de diagnósticos, creador de actividades para Profesor, vista publicada tipo cuaderno, preguntas interactivas configurables y cursos obligatorios de Formación esencial.

## 🧭 Navegación principal

- 🏠 Inicio
- 📚 Cursos
- ➕ Solicitar curso
- 🧠 Diagnósticos
- 📝 Tareas
- 📊 Calificaciones
- 🏅 Perfil
- ⚙️ Administración, cuando la cuenta tiene permisos

## 👤 Identidad y roles

Cada cuenta usa nombre y apellido reales para espacios académicos, Carné Nexora único y permanente y nombre de usuario personal/decorativo.

Los roles disponibles son `student`, `teacher` y `admin`. Una cuenta puede tener varios roles al mismo tiempo.

## 📚 Catálogo, solicitudes e inscripciones

El catálogo persistente vive en `courses`. Una solicitud aceptada crea una inscripción real en `course_enrollments`.

Los cursos normales se solicitan desde **Solicitar curso** y Administración puede revisarlos, aceptarlos o rechazarlos. Cada curso dispone de Resumen, Clases, Tareas, Ejercicios y Calificaciones.

## 🧠 Diagnósticos

El diagnóstico inicial es opcional, no da puntos y se realiza una sola vez por materia.

Actualmente Matemática dispone de **194 preguntas permanentes** distribuidas en 6 niveles:

| Nivel | Contenido | Banco | Selección |
|---|---|---:|---:|
| 1 | Operaciones básicas y problemas | 44 | 14 |
| 2 | Números negativos, fracciones y decimales | 36 | 12 |
| 3 | Proporciones, porcentajes y conversiones | 30 | 10 |
| 4 | Álgebra básica | 30 | 10 |
| 5 | Álgebra intermedia y geometría | 30 | 10 |
| 6 | Razonamiento avanzado | 24 | 8 |
| **Total** | | **194** | **64 máximo** |

Al finalizar se genera `diagnostic_results` con ubicación estimada, temas dominados y temas a reforzar. Las respuestas correctas permanecen protegidas del navegador.

## 👨‍🏫 Profesor

Dentro de Administración existe un apartado Profesor para cuentas con rol `teacher`.

Profesor puede crear y editar:

- **Tareas de cuaderno**;
- **Tareas virtuales**;
- **Ejercicios prácticos**.

Cada actividad puede configurar curso, título, punteo cuando corresponda, fecha/hora de apertura, fecha/hora de cierre, cronómetro opcional, estado Borrador/Publicada e instrucciones generales.

### Hoja de actividad

La hoja en blanco funciona únicamente como **editor**. Antes de publicar puede usarse **👁️ Vista previa**. Al publicarse, el estudiante ve una hoja/cuaderno centrada inspirada en el estilo del diagnóstico.

### Constructor de preguntas

Profesor puede combinar varios bloques dentro de una misma actividad:

- **Respuesta escrita** — caja de texto para que el estudiante redacte;
- **Elección única** — varias opciones y una sola correcta;
- **Selección múltiple** — varias opciones y más de una respuesta correcta;
- **Verdadero o falso**.

Las claves correctas no se guardan dentro del contenido visible. Se almacenan en `private.course_activity_answer_keys` y se administran mediante RPC seguras para Profesor/Admin.

La columna pública `course_activities.question_blocks` contiene únicamente el contenido que el estudiante necesita ver: enunciados, tipo de pregunta y opciones.

## 📝 Vista del estudiante

Las actividades publicadas aparecen en **Tareas** o en las pestañas Tareas/Ejercicios de cada curso cuando están dentro de su ventana de disponibilidad.

La hoja ya puede mostrar cajas de respuesta, botones de opción, casillas múltiples y verdadero/falso. El siguiente paso es crear el sistema de **Comenzar actividad**, guardado persistente, entrega y cronómetro real.

## 🌱 Formación esencial — primeros 365 días

Cada usuario queda inscrito automáticamente durante su primer año en seis cursos breves:

- ✍️ Caligrafía y escritura clara
- 📖 Comprensión y expresión lectora
- 📝 Ortografía y redacción
- 🧮 Cálculo mental y agilidad numérica
- 🧩 Lógica y razonamiento
- 📅 Organización y hábitos de estudio

La inscripción guarda `required_until`, calculado como 365 días desde la creación del perfil. Después de esa fecha estos cursos dejan de ser obligatorios y podrán mantenerse de forma opcional.

Las actividades de Formación esencial deben ser ligeras, normalmente de 10–15 minutos, y no se diseñan como castigo ni como una racha obligatoria.

## 🔐 Seguridad

- Supabase Auth gestiona las cuentas.
- RLS limita perfiles, solicitudes, inscripciones, diagnósticos y actividades.
- El estudiante solo puede leer actividades publicadas de cursos en los que está inscrito.
- Las respuestas correctas del diagnóstico y de las nuevas preguntas configurables no se exponen al navegador.
- La lógica sensible usa funciones seguras del servidor cuando corresponde.

## 🔁 PMA

El PMA será un segundo intento opcional de una tarea, con el mismo valor de puntos. La nota oficial será automáticamente la mayor entre ambos intentos.

## 🏆 Sistema académico

| Etapa | Años | Nota mínima |
|---|---|---:|
| 🌱 Fundamentos | 1–2 | 60/100 |
| 📘 Intermedio | 3–4 | 65/100 |
| 🧠 Avanzado | 5–6 | 70/100 |
| 🎓 Superior | 7–8 | 75/100 |
| 🏆 Dominio | 9–10 | 80/100 |

Cada curso tendrá 4 bloques de hasta 100 puntos.

## 🗄️ Tablas principales actuales

- `profiles`
- `user_roles`
- `courses`
- `course_requests`
- `course_enrollments`
- `course_activities`
- `admin_notifications`
- `diagnostic_levels`
- `diagnostic_question_pools`
- `diagnostic_questions`
- `diagnostic_attempts`
- `diagnostic_attempt_questions`
- `diagnostic_answers`
- `diagnostic_results`
- `private.course_activity_answer_keys`

## 🚧 Próximos objetivos

1. Crear **Comenzar actividad**, intentos, respuestas persistentes y Entregar.
2. Ejecutar el cronómetro real y conservarlo aunque se recargue la página.
3. Crear el editor y publicación de **Clases**, organizadas por unidades/temas.
4. Implementar calificaciones por bloques y PMA.
5. Hacer que Tareas pendientes y Promedio actual del Dashboard provengan de datos reales.
6. Añadir recuperación de contraseña y completar pruebas multiusuario antes de abrir la beta a amigos.
7. Añadir presencia opcional **Conectados ahora**, XP Nexora, ligas y ranking semanal opcional.
8. Añadir IA educativa segura más adelante.

---

# 📒 Bitácora

## 30 de septiembre de 2026 — Inicio

- Se creó Academia Nexora y su repositorio.
- Se definieron cursos, tareas, ejercicios, calificaciones, PMA y etapas académicas.
- Se configuraron GitHub Pages y Supabase.

## 1 de octubre de 2026 — v0.3: cuentas y onboarding

- Registro, login y confirmación por correo.
- Identidad con nombre real, usuario y Carné Nexora.
- Roles, reglas, onboarding y solicitudes persistentes.

## 1 de octubre de 2026 — v0.4: banco de Matemática

- Banco permanente de 194 preguntas en 6 niveles.
- Respuestas correctas protegidas del frontend.

## 1 de octubre de 2026 — v0.5: diagnóstico funcional

- Intento único por materia.
- Preguntas sorteadas persistentes.
- Navegación por tarjetas numeradas.
- Siguiente y Mi límite.
- Corrección segura en Supabase.

## 1 de octubre de 2026 — v0.6: resultados e historial

- Resultados persistentes con ubicación estimada.
- Temas dominados y temas a reforzar.
- Nueva sección Diagnósticos.

## 1 de octubre de 2026 — v0.7: catálogo, cursos e inscripciones

- Se separó Solicitar curso de Cursos.
- Se creó el catálogo persistente y `course_enrollments`.
- Administración puede aceptar o rechazar solicitudes.
- Cada curso dispone de Resumen, Clases, Tareas, Ejercicios y Calificaciones.

## 1 de octubre de 2026 — v0.8: Panel Profesor

- Administración quedó enfocada en cursos e inscripciones.
- Se añadió Profesor dentro del panel de gestión.
- Profesor puede crear tareas y ejercicios con fechas, punteo y cronómetro opcional.

## 1 de octubre de 2026 — v0.9: vista publicada de actividades

- Se añadió Vista previa.
- Las actividades publicadas usan una hoja/cuaderno inspirada en el diagnóstico.
- Tareas y Ejercicios cargan actividades reales y respetan apertura/cierre.

## 1 de octubre de 2026 — v0.10: preguntas y Formación esencial

- Se añadió constructor por bloques para respuesta escrita, elección única, selección múltiple y verdadero/falso.
- Las claves correctas se separaron del contenido visible y se guardan en esquema privado.
- Las hojas publicadas renderizan el control de respuesta correspondiente a cada pregunta.
- Se crearon seis cursos de Formación esencial.
- Todos los perfiles actuales quedaron inscritos automáticamente y los nuevos perfiles también lo harán.
- Cada inscripción esencial conserva la fecha hasta la que es obligatoria durante los primeros 365 días.

---

> Este README funciona como **resumen general y bitácora del proyecto** y debe mantenerse actualizado con cada cambio importante.
