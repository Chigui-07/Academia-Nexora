# 🎓 Academia Nexora

**Academia Nexora** es una plataforma educativa multiusuario para aprender desde cero, avanzar por etapas y organizar cursos, clases, tareas, ejercicios, calificaciones y diagnósticos.

## 📌 Estado del proyecto

**Fase actual: v0.18 — Calificaciones por curso y administración por alumno.**

Frontend: Next.js + TypeScript + CSS, publicado con GitHub Pages.  
Backend, autenticación y datos: Supabase.

Ya existen registro, confirmación por correo, recuperación de contraseña, perfiles, Carné Nexora, roles, onboarding, solicitudes e inscripciones, diagnóstico funcional de Matemática, historial de diagnósticos, creador de clases y actividades, preguntas configurables, Formación esencial, intentos persistentes, asignación individual, revisión firmada con comentarios por pregunta, biblioteca de tareas/ejercicios, administración centrada en el alumno y calificaciones reales por curso y bloque.

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

Los cursos normales pueden solicitarse desde **Solicitar curso**. Además, Administración puede seleccionar un alumno y asignarle o retirarle materias directamente. Retirar un curso lo pausa y conserva su historial.

Cada curso dispone de **Resumen, Clases, Tareas, Ejercicios y Calificaciones**.

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

### Clases

Profesor puede crear clases vinculadas a cualquier curso. Cada clase puede guardar unidad o tema, título, explicación, ejemplos guiados, recursos o notas, posición para ordenar y estado Borrador/Publicada.

### Actividades

Profesor puede crear y editar **Tareas de cuaderno**, **Tareas virtuales** y **Ejercicios prácticos**.

Cada actividad puede configurar curso, título, punteo cuando corresponda, **Bloque 1–4**, **1–20 intentos**, apertura, cierre, cronómetro opcional, estado Borrador/Publicada e instrucciones generales.

Las tareas calificables alimentan el bloque y el promedio académico. Los ejercicios prácticos se califican sobre **100 puntos** como retroalimentación, pero no afectan el promedio académico.

Cada actividad puede enviarse a **todo el curso** o a **estudiantes específicos**. La selección individual se almacena en `course_activity_assignments` y también se valida en servidor.

### Constructor de preguntas

Profesor puede combinar **Respuesta escrita**, **Elección única**, **Selección múltiple** y **Verdadero o falso**.

Las claves correctas se almacenan en `private.course_activity_answer_keys` y no se envían al estudiante.

### Revisión y calificación

Administración está organizada por alumno. Al seleccionar un estudiante se pueden ver sus cursos y únicamente sus entregas.

Cada respuesta puede marcarse como:

- ✅ **Correcta**;
- ❌ **Incorrecta**.

También existe un **comentario amarillo independiente por pregunta**, además de la retroalimentación general final. Cada revisión queda firmada automáticamente con el nombre académico del profesor.

## ✍️ Experiencia del estudiante

Dentro de cada curso, Tareas y Ejercicios funcionan como bibliotecas de tarjetas acumulables. El estudiante selecciona una tarjeta para abrir la actividad.

Al comenzar un intento:

- las preguntas se muestran **una por una**;
- existe navegación lateral numerada inspirada en el diagnóstico;
- las respuestas se guardan automáticamente;
- el cronómetro es persistente y se controla en servidor;
- el botón de finalizar aparece al llegar al final del ejercicio o tarea.

Los ejercicios cerrados permanecen accesibles dentro del curso para consultar respuestas, revisión y calificación.

## 📊 Calificaciones y promedio

La sección global **Calificaciones** y la pestaña **Calificaciones de cada curso** usan datos reales.

- Cada tarea calificable pertenece a uno de los 4 bloques.
- Cada bloque muestra puntos obtenidos sobre los puntos ya calificados, por ejemplo `35/40`.
- Si una tarea tiene varios intentos revisados, cuenta el intento con mejor porcentaje.
- Los ejercicios prácticos no afectan el promedio.
- Dentro de cada materia se muestra **Promedio actual**, cuatro tarjetas de bloque y el detalle de tareas calificadas.
- El **Promedio actual** del Inicio usa las mejores notas de las tareas ya calificadas.

El cierre definitivo de bloques y el promedio final de los cuatro bloques todavía se implementarán como reglas académicas separadas.

## 🌱 Formación esencial — primeros 365 días

Cada usuario queda inscrito automáticamente durante su primer año en:

- ✍️ Caligrafía y escritura clara
- 📖 Comprensión y expresión lectora
- 📝 Ortografía y redacción
- 🧮 Cálculo mental y agilidad numérica
- 🧩 Lógica y razonamiento
- 📅 Organización y hábitos de estudio

La inscripción guarda `required_until`, calculado como 365 días desde la creación del perfil.

## 🔐 Seguridad

- Supabase Auth gestiona las cuentas y recuperación de contraseña.
- RLS limita perfiles, solicitudes, inscripciones, clases, diagnósticos, actividades, asignaciones e intentos.
- El estudiante solo puede leer contenido publicado que le corresponda.
- Las respuestas correctas del diagnóstico y de actividades no se exponen al estudiante.
- Crear, guardar y entregar intentos pasa por funciones seguras del servidor.
- El límite de intentos se comprueba también en servidor.
- La calificación manual pasa por RPC protegida y la firma del profesor se obtiene en servidor.
- Las cuentas de estudiante no reciben permisos directos para modificar calificaciones ni revisiones.

Pendiente de seguridad antes de una beta más amplia: activar **Leaked Password Protection** en Supabase Auth.

## 🔁 PMA

PMA será una modalidad especial basada sobre el sistema actual de múltiples intentos. Más adelante añadirá reglas, ventana y etiqueta propias sin duplicar el almacenamiento de intentos.

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
- `course_lessons`
- `course_activities`
- `course_activity_assignments`
- `activity_attempts`
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

1. Mostrar **Tareas disponibles** en Inicio con estados claros.
2. Hacer funcional **Gestionar cursos** para crear, editar, activar/desactivar y configurar diagnóstico.
3. Completar reglas de cierre de los 4 bloques y PMA.
4. Terminar la revisión de seguridad para la Beta de amigos.
5. Añadir el **Profesor IA únicamente para la cuenta principal**.
6. Después de la Beta: presencia opcional, XP Nexora, ligas, ranking, logros y minijuegos.

---

# 📒 Bitácora

## 30 de septiembre de 2026 — Inicio

- Se creó Academia Nexora y su repositorio.
- Se definieron cursos, tareas, ejercicios, calificaciones, PMA y etapas académicas.
- Se configuraron GitHub Pages y Supabase.

## 1 de octubre de 2026 — v0.3 a v0.7

- Registro, login, confirmación, identidad académica, Carné Nexora y roles.
- Banco permanente de 194 preguntas de Matemática.
- Diagnóstico funcional, resultados e historial.
- Catálogo persistente, solicitudes e inscripciones.

## 1 de octubre de 2026 — v0.8 a v0.10

- Panel Profesor y creador de tareas/ejercicios.
- Vista previa y hoja publicada.
- Constructor de preguntas.
- Formación esencial automática durante el primer año.

## 1 de octubre de 2026 — v0.11 a v0.14

- Creador y publicación de clases.
- Intentos persistentes, autosave, entrega y cronómetro.
- Asignación individual de actividades.
- Revisión manual firmada.
- Bloques 1–4, múltiples intentos y mejor intento para promedio.
- Calificaciones globales y estadísticas reales de Inicio.

## 2 de octubre de 2026 — v0.15: recuperación de contraseña

- Se añadió flujo completo de recuperación por correo con Supabase Auth.
- Se corrigió el manejo de la sesión temporal de recuperación.

## 2 de octubre de 2026 — v0.16: biblioteca y corrección detallada

- Tareas y Ejercicios se acumulan como tarjetas dentro del curso.
- Las preguntas se resuelven una por una con navegación lateral numerada.
- Los ejercicios cerrados conservan su historial y calificación.
- Se añadió comentario amarillo persistente por pregunta.
- Los ejercicios prácticos se califican sobre 100.
- Inscripciones manuales permiten asignar o pausar cursos sin borrar historial.

## 2 de octubre de 2026 — v0.17: administración por alumno

- Administración se reorganizó alrededor de la ficha de cada estudiante.
- La lista muestra cursos activos y entregas pendientes.
- Cada alumno dispone de pestañas Cursos y Entregas.
- La cola de calificación puede filtrarse por estudiante.

## 2 de octubre de 2026 — v0.18: calificaciones dentro del curso

- La pestaña Calificaciones de cada materia muestra el promedio actual.
- Se añadieron cuatro tarjetas para Bloque 1–4.
- Cada bloque muestra puntos obtenidos, puntos calificados y porcentaje actual.
- Se añadió detalle de tareas calificadas, mejor intento, profesor y fecha de revisión.
- Los ejercicios prácticos permanecen fuera del promedio académico.

---

> Este README funciona como **resumen general y bitácora del proyecto** y debe mantenerse actualizado con cada cambio importante.
