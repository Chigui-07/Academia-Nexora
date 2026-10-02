# 🎓 Academia Nexora

**Academia Nexora** es una plataforma educativa multiusuario para aprender desde cero, avanzar por etapas y organizar cursos, clases, tareas, ejercicios, calificaciones, diagnósticos y logros.

## 📌 Estado del proyecto

**Fase actual: v0.14 — Calificaciones, bloques e intentos configurables.**

Frontend: Next.js + TypeScript + CSS, publicado con GitHub Pages.  
Backend, autenticación y datos: Supabase.

Ya existen registro, confirmación por correo, perfiles, Carné Nexora, roles, onboarding, solicitudes e inscripciones, diagnóstico funcional de Matemática, historial de diagnósticos, creador de clases y actividades para Profesor, preguntas configurables, Formación esencial, intentos persistentes, asignación individual, revisión manual firmada, calificaciones reales por bloque y promedio dinámico.

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

Cada actividad puede configurar curso, título, punteo cuando corresponda, **Bloque 1–4**, **cantidad de intentos permitidos (1–20)**, fecha/hora de apertura, fecha/hora de cierre, cronómetro opcional, estado Borrador/Publicada e instrucciones generales.

Las tareas calificables alimentan el bloque seleccionado y el promedio académico. Los ejercicios prácticos pueden organizarse por bloque y calificarse como retroalimentación, pero no afectan el promedio.

La hoja en blanco funciona como editor. Antes de publicar puede usarse **👁️ Vista previa**. Al publicarse, el estudiante ve una hoja/cuaderno centrada inspirada en el estilo del diagnóstico.

### Asignación de estudiantes

Cada actividad puede enviarse de dos maneras:

- **Todo el curso**: la reciben todos los estudiantes activos inscritos en esa materia.
- **Estudiantes específicos**: Profesor selecciona una o varias personas inscritas y únicamente ellas pueden verla e iniciarla.

La selección individual se almacena en `course_activity_assignments`. La protección también se aplica en RLS y en la función que inicia los intentos, por lo que otro estudiante del mismo curso no puede abrir una actividad individual aunque conozca su identificador.

### Constructor de preguntas

Profesor puede combinar **Respuesta escrita**, **Elección única**, **Selección múltiple** y **Verdadero o falso**.

Las claves correctas se almacenan en `private.course_activity_answer_keys` y no se envían al estudiante.

### Revisión y calificación manual

Las entregas terminadas aparecen en **Profesor → Revisar y calificar entregas**.

En cada pregunta, Profesor ve la respuesta del estudiante y puede marcarla como:

- ✅ **Correcta**;
- ❌ **Incorrecta**.

Al finalizar la revisión se coloca una calificación y existe un campo de **retroalimentación final**. Cada revisión guarda automáticamente el nombre académico del profesor que la realizó. El estudiante ve la marca correcta/incorrecta después de cada respuesta y, al final de la actividad, su nota, retroalimentación y firma del profesor.

## ✍️ Intentos y entregas del estudiante

Las actividades publicadas aparecen en **Tareas** o en las pestañas Tareas/Ejercicios de cada curso durante su ventana de disponibilidad y únicamente cuando fueron asignadas al estudiante.

El estudiante puede pulsar **Comenzar actividad**. Nexora crea un intento persistente en `activity_attempts` y, si existe un cronómetro, calcula su hora de vencimiento en el servidor.

Cada actividad tiene un límite configurable de intentos. Nexora muestra el intento actual (`1 de 3`, por ejemplo) y el servidor impide crear intentos por encima del máximo definido. Cada intento tiene su propio cronómetro cuando corresponde.

Durante un intento las respuestas se guardan automáticamente, recargar no reinicia el intento y entregar lo cierra. Si aún quedan intentos disponibles, el estudiante puede iniciar el siguiente. Para el promedio académico se conserva la **mejor nota** obtenida en cada tarea calificable.

Después de entregar, cada intento queda pendiente de revisión. Cuando Profesor lo califica, la misma hoja muestra el resultado de cada respuesta y la retroalimentación final.

## 📊 Calificaciones y promedio

La sección **Calificaciones** ya usa datos reales.

- Cada tarea calificable pertenece a uno de los 4 bloques.
- Cada bloque muestra los puntos obtenidos sobre los puntos ya calificados disponibles, por ejemplo `35/40`.
- Si una tarea tiene varios intentos revisados, se usa el de mejor porcentaje.
- Los ejercicios prácticos no afectan el promedio.
- El **Promedio actual** del Inicio se calcula con las mejores notas de las tareas ya calificadas.
- **Tareas pendientes** del Inicio también proviene de las actividades actualmente disponibles.

Cuando los cuatro bloques estén completos, cada curso podrá cerrar su nota final sobre la estructura de 4 bloques de hasta 100 puntos.

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
- El límite de intentos también se comprueba en servidor.
- La calificación manual pasa por una RPC protegida y la firma del profesor se obtiene en servidor.
- Las cuentas de estudiante no reciben permisos directos para modificar calificaciones ni revisiones.

## 🔁 PMA

El PMA seguirá siendo una modalidad especial de segundo intento. El nuevo sistema de múltiples intentos ya permite conservar la mejor nota; más adelante PMA añadirá sus reglas y ventana propias.

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
2. Convertir las tarjetas superiores de Administración en apartados funcionales para catálogo e inscripciones manuales.
3. Completar reglas de cierre de los 4 bloques y PMA.
4. Añadir el **Profesor IA únicamente para la cuenta principal**, usando el mismo sistema de cursos, clases, actividades y calificaciones.
5. Añadir presencia opcional **Conectados ahora**, XP Nexora, ligas y ranking semanal opcional.

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

## 1 de octubre de 2026 — v0.12: asignación individual

- Profesor puede enviar una actividad a todo un curso o a estudiantes específicos.
- Se añadió `course_activity_assignments`.
- El selector muestra nombre académico y Carné de los estudiantes activos del curso.
- RLS oculta una actividad individual a quienes no estén asignados.
- La función de iniciar intentos comprueba también la asignación en servidor.

## 1 de octubre de 2026 — v0.13: revisión y calificación manual

- Profesor dispone de una cola de entregas terminadas.
- Cada respuesta puede marcarse como correcta o incorrecta.
- Se añadió calificación numérica y retroalimentación final.
- Cada revisión queda firmada automáticamente con el nombre académico del profesor.
- El estudiante ve la corrección después de cada respuesta y la retroalimentación al final de la hoja.

## 1 de octubre de 2026 — v0.14: calificaciones, bloques e intentos

- Cada actividad puede configurar entre 1 y 20 intentos.
- El límite de intentos se valida en Supabase y no puede saltarse desde el navegador.
- Cada tarea puede asignarse a Bloque 1, 2, 3 o 4.
- Calificaciones muestra puntos reales por curso y bloque.
- El mejor intento de cada tarea es el que cuenta para el promedio.
- Los ejercicios prácticos quedan fuera del promedio académico.
- Inicio calcula **Tareas pendientes** y **Promedio actual** con datos reales.
- El flujo de límite de intentos se probó dentro de una transacción y luego se revirtió.

---

> Este README funciona como **resumen general y bitácora del proyecto** y debe mantenerse actualizado con cada cambio importante.
