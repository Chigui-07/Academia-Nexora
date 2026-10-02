# 🎓 Academia Nexora

**Academia Nexora** es una plataforma educativa multiusuario para aprender desde cero, avanzar por etapas y organizar cursos, clases, tareas, ejercicios, calificaciones, diagnósticos y logros.

## 📌 Estado del proyecto

**Fase actual: v0.12 — Asignación individual de actividades.**

Frontend: Next.js + TypeScript + CSS, publicado con GitHub Pages.  
Backend, autenticación y datos: Supabase.

Ya existen registro, confirmación por correo, perfiles, Carné Nexora, roles, onboarding, solicitudes e inscripciones, diagnóstico funcional de Matemática, historial de diagnósticos, creador de clases y actividades para Profesor, preguntas configurables, Formación esencial, intentos persistentes y asignación de actividades por curso o por estudiantes específicos.

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

### Clases

Profesor puede crear clases vinculadas a cualquier curso. Cada clase puede guardar unidad o tema, título, explicación, ejemplos guiados, recursos o notas, posición para ordenar y estado Borrador/Publicada.

Las clases publicadas aparecen en la pestaña **Clases** del curso. Los estudiantes únicamente pueden leer clases publicadas de cursos en los que están inscritos.

### Actividades

Profesor puede crear y editar **Tareas de cuaderno**, **Tareas virtuales** y **Ejercicios prácticos**.

Cada actividad puede configurar curso, título, punteo cuando corresponda, fecha/hora de apertura, fecha/hora de cierre, cronómetro opcional, estado Borrador/Publicada e instrucciones generales.

La hoja en blanco funciona como editor. Antes de publicar puede usarse **👁️ Vista previa**. Al publicarse, el estudiante ve una hoja/cuaderno centrada inspirada en el estilo del diagnóstico.

### Asignación de estudiantes

Cada actividad puede enviarse de dos maneras:

- **Todo el curso**: la reciben todos los estudiantes activos inscritos en esa materia.
- **Estudiantes específicos**: Profesor selecciona una o varias personas inscritas y únicamente ellas pueden verla e iniciarla.

La selección individual se almacena en `course_activity_assignments`. La protección también se aplica en RLS y en la función que inicia los intentos, por lo que otro estudiante del mismo curso no puede abrir una actividad individual aunque conozca su identificador.

### Constructor de preguntas

Profesor puede combinar **Respuesta escrita**, **Elección única**, **Selección múltiple** y **Verdadero o falso**.

Las claves correctas se almacenan en `private.course_activity_answer_keys` y no se envían al estudiante.

## ✍️ Intentos y entregas del estudiante

Las actividades publicadas aparecen en **Tareas** o en las pestañas Tareas/Ejercicios de cada curso durante su ventana de disponibilidad y únicamente cuando fueron asignadas al estudiante.

El estudiante puede pulsar **Comenzar actividad**. Nexora crea un intento persistente en `activity_attempts` y, si existe un cronómetro, calcula su hora de vencimiento en el servidor.

Durante un intento las respuestas se guardan automáticamente, recargar no reinicia el intento, el cronómetro continúa desde la hora original y **Entregar actividad** cierra el intento. Al llegar a cero se conserva lo respondido y el intento termina por tiempo. Las tareas normales quedan cerradas tras entregar y los ejercicios prácticos permiten nuevos intentos.

La corrección automática, calificaciones y PMA se desarrollarán después de estabilizar la beta.

## 🌱 Formación esencial — primeros 365 días

Cada usuario queda inscrito automáticamente durante su primer año en seis cursos breves:

- ✍️ Caligrafía y escritura clara
- 📖 Comprensión y expresión lectora
- 📝 Ortografía y redacción
- 🧮 Cálculo mental y agilidad numérica
- 🧩 Lógica y razonamiento
- 📅 Organización y hábitos de estudio

La inscripción guarda `required_until`, calculado como 365 días desde la creación del perfil. Después de esa fecha estos cursos dejan de ser obligatorios y podrán mantenerse de forma opcional.

## 🔐 Seguridad

- Supabase Auth gestiona las cuentas.
- RLS limita perfiles, solicitudes, inscripciones, clases, diagnósticos, actividades, asignaciones e intentos.
- El estudiante solo puede leer contenido publicado que le corresponda.
- Los intentos solo pueden ser leídos por su estudiante o por personal autorizado.
- Las respuestas correctas del diagnóstico y de las actividades no se exponen al navegador.
- Crear, guardar y entregar intentos pasa por funciones seguras del servidor.

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

1. Añadir **recuperación de contraseña** y cerrar la preparación mínima de la Beta para amigos.
2. Convertir las tarjetas superiores de Administración en apartados funcionales para catálogo e inscripciones.
3. Implementar corrección, calificaciones por bloques y PMA.
4. Hacer que Tareas pendientes y Promedio actual del Dashboard provengan de datos reales.
5. Añadir presencia opcional **Conectados ahora**, XP Nexora, ligas y ranking semanal opcional.
6. Añadir mejoras de contenido, recursos y posteriormente IA educativa segura.

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
- Se crearon seis cursos de Formación esencial y se asignan durante los primeros 365 días.

## 1 de octubre de 2026 — v0.11: clases e intentos

- Profesor puede crear, ordenar, previsualizar y publicar clases.
- Las clases publicadas aparecen dentro de cada curso.
- Se creó `activity_attempts` para conservar el trabajo de cada estudiante.
- Se añadió **Comenzar actividad**, guardado automático, **Entregar actividad** y cronómetro persistente.
- Los ejercicios prácticos permiten iniciar nuevos intentos.

## 1 de octubre de 2026 — v0.12: asignación individual

- Profesor puede enviar una actividad a todo un curso o a estudiantes específicos.
- Se añadió `course_activity_assignments`.
- El selector muestra nombre académico y Carné de los estudiantes activos del curso.
- RLS oculta una actividad individual a quienes no estén asignados.
- La función de iniciar intentos comprueba también la asignación en servidor.
- El flujo de guardado de asignaciones se probó dentro de una transacción y se revirtió después de la comprobación.

---

> Este README funciona como **resumen general y bitácora del proyecto** y debe mantenerse actualizado con cada cambio importante.
