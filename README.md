# 🎓 Academia Nexora

**Academia Nexora** es una plataforma educativa multiusuario para aprender desde cero, avanzar por etapas y niveles y organizar cursos, clases, tareas, ejercicios, calificaciones y diagnósticos.

## 📌 Estado del proyecto

**Fase actual: v0.22 — Profesor IA personal, adjuntos privados y relacionar parejas.**

Frontend: Next.js + TypeScript + CSS, publicado con GitHub Pages.  
Backend, autenticación, Storage y datos: Supabase.

Ya existen registro, confirmación por correo, recuperación de contraseña, perfiles, Carné Nexora, roles, onboarding, solicitudes e inscripciones, diagnóstico funcional de Matemática, historial de diagnósticos, creador de clases y actividades, preguntas configurables, Formación esencial, intentos persistentes, asignación individual, revisión firmada con comentarios por pregunta, biblioteca de tareas/ejercicios, administración centrada en el alumno, calificaciones reales por curso, tablero de tareas en Inicio, gestión administrativa del catálogo, Profesor IA privado para la cuenta principal, archivos privados por intento y preguntas de relacionar parejas.

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

**Administración → Gestionar cursos** permite:

- crear una materia nueva;
- editar nombre, icono, categoría y descripción;
- activar o desactivar el curso sin borrar su historial;
- consultar cursos activos, inactivos y de Formación esencial;
- configurar el diagnóstico cuando existe un motor compatible.

La clave interna (`course_key`) queda fija después de crear el curso para no romper rutas, historial o diagnósticos. Los cursos de **Formación esencial** aparecen como protegidos y no pueden modificarse desde este gestor.

Cada curso dispone de **Resumen, Clases, Tareas, Ejercicios y Calificaciones**.

## 🧠 Diagnósticos

El diagnóstico inicial es opcional, no da puntos y se realiza una sola vez por materia.

Actualmente el motor funcional de diagnóstico está disponible para **Matemática**. Por eso el gestor de cursos permite activar o desactivar esa opción en Matemática, mientras que otras materias quedan preparadas para recibir su propio motor más adelante.

Matemática dispone de **194 preguntas permanentes** distribuidas en 6 niveles:

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

Desde v0.22 una clase también dispone en base de datos de `assignment_mode`, por lo que puede pertenecer al curso completo o a estudiantes concretos mediante `course_lesson_assignments`. Esto permite que las clases creadas por el Profesor IA sean privadas para la cuenta principal.

### Actividades

Profesor puede crear y editar **Tareas de cuaderno**, **Tareas virtuales** y **Ejercicios prácticos**.

Cada actividad puede configurar curso, título, punteo cuando corresponda, **Bloque 1–4**, **1–20 intentos**, apertura, cierre, cronómetro opcional, estado Borrador/Publicada e instrucciones generales.

Las tareas calificables alimentan el bloque y el promedio académico. Los ejercicios prácticos se califican sobre **100 puntos** como retroalimentación, pero no afectan el promedio académico.

Cada actividad puede enviarse a **todo el curso** o a **estudiantes específicos**. La selección individual se almacena en `course_activity_assignments` y también se valida en servidor.

### Constructor de preguntas

Profesor puede combinar:

- **Respuesta escrita**;
- **Elección única**;
- **Selección múltiple**;
- **Verdadero o falso**;
- **Relacionar parejas**.

Relacionar parejas guarda cada relación como `{id, left, right}` y al estudiante le muestra las opciones de la derecha mezcladas. La estructura se valida también en servidor antes de guardar una actividad publicada.

Las claves correctas se almacenan en `private.course_activity_answer_keys` y no se envían al estudiante.

### Archivos y fotografías de una entrega

Cada intento puede recibir hasta **5 archivos** desde la interfaz. El límite actual de Storage es **20 MB por archivo**.

El estudiante puede adjuntar, por ejemplo:

- fotografías del procedimiento de Física o Matemática;
- documentos PDF;
- archivos de Word u otros documentos;
- proyectos comprimidos u otros archivos solicitados por el profesor.

Los archivos viven en el bucket privado `activity-submissions`. El estudiante puede añadir o retirar sus archivos únicamente mientras el intento continúa abierto. Después de entregar, quedan bloqueados junto con ese intento.

Al revisar una entrega, Profesor puede abrir sus imágenes y archivos directamente desde el panel de calificación.

### Revisión y calificación

Administración está organizada por alumno. Al seleccionar un estudiante se pueden ver sus cursos y únicamente sus entregas.

Cada respuesta puede marcarse como:

- ✅ **Correcta**;
- ❌ **Incorrecta**.

También existe un **comentario amarillo independiente por pregunta**, además de la retroalimentación general final. Cada revisión queda firmada automáticamente con el nombre académico del profesor.

La nota final sigue siendo **manual y personalizada**: Nexora puede mostrar la respuesta esperada como referencia, pero Profesor decide cuánto punteo recibe cada alumno.

### 🤖 Profesor IA personal

La cuenta principal autorizada dispone de un panel privado **Profesor IA** dentro de Administración.

Su función no es dar IA a todos los estudiantes. Es actuar como profesor personal de la cuenta autorizada mientras esa misma cuenta continúa siendo el profesor humano de los demás usuarios.

Flujo actual:

- elegir curso;
- elegir si se quiere generar una **Clase**, **Tarea de cuaderno**, **Tarea virtual** o **Ejercicio práctico**;
- indicar tema y dificultad;
- configurar preguntas, punteo, bloque, intentos y cronómetro cuando corresponda;
- generar una propuesta estructurada;
- revisar la propuesta;
- pulsar **Publicar para mí**.

Al aprobarla, Nexora:

- activa la inscripción de la cuenta principal en esa materia si todavía no estaba activa;
- publica el contenido;
- usa asignación individual;
- asigna como único destinatario a la cuenta autorizada.

Por tanto, ningún otro alumno recibe las clases, tareas o ejercicios creados por el Profesor IA.

El acceso está protegido también en Supabase mediante un único registro en `ai_teacher_access`; ocultar el panel en el frontend no es la única barrera. La Edge Function `nexora-ai-teacher` requiere sesión válida y vuelve a comprobar ese permiso antes de generar contenido.

La conexión con OpenAI se realiza únicamente desde la Edge Function. La clave `OPENAI_API_KEY` debe vivir como secreto del servidor en Supabase y **nunca** en el frontend ni en GitHub. Si ese secreto todavía no está configurado, el panel indica **Conexión pendiente** y no intenta generar contenido.

## ✍️ Experiencia del estudiante

Dentro de cada curso, Tareas y Ejercicios funcionan como bibliotecas de tarjetas acumulables. El estudiante selecciona una tarjeta para abrir la actividad.

Al comenzar un intento:

- las preguntas se muestran **una por una**;
- existe navegación lateral numerada inspirada en el diagnóstico;
- las respuestas se guardan automáticamente;
- el cronómetro es persistente y se controla en servidor;
- se pueden adjuntar imágenes y archivos mientras el intento esté abierto;
- los adjuntos se bloquean al entregar;
- el botón de finalizar aparece al llegar al final del ejercicio o tarea.

Los ejercicios cerrados permanecen accesibles dentro del curso para consultar respuestas, archivos, revisión y calificación.

### Tareas en Inicio

Inicio incluye un tablero real de tareas con cinco estados:

- **Pendientes**: disponibles o en curso;
- **Próximas**: publicadas pero todavía no abiertas;
- **Entregadas**: terminadas y esperando revisión;
- **Calificadas**: ya revisadas por Profesor;
- **Vencidas**: cerradas sin entrega.

Cada tarjeta muestra materia, bloque, puntos, intentos, cronómetro cuando existe y fecha relevante. Desde la tarjeta se puede abrir directamente la pestaña **Tareas** de la materia correspondiente.

## 📊 Calificaciones y promedio

La sección global **Calificaciones** y la pestaña **Calificaciones de cada curso** usan datos reales.

- Cada tarea calificable pertenece a uno de los 4 bloques.
- Cada bloque muestra puntos obtenidos sobre los puntos ya calificados, por ejemplo `35/40`.
- Si una tarea tiene varios intentos revisados, cuenta el intento con mejor porcentaje.
- Los ejercicios prácticos no afectan el promedio.
- Dentro de cada materia se muestra **Promedio actual**, cuatro tarjetas de bloque y el detalle de tareas calificadas.
- El **Promedio actual** del Inicio usa las mejores notas de las tareas ya calificadas.
- Las tareas entregadas dejan de contarse como pendientes en Inicio.

El cierre definitivo de bloques y el promedio final de los cuatro bloques todavía se implementarán como reglas académicas separadas.

## 🖥️ Interfaz

La interfaz principal usa una distribución amplia en escritorio y vuelve automáticamente a una sola columna en pantallas pequeñas.

El objetivo es que formularios, tarjetas, actividades, archivos y fichas de alumnos puedan utilizarse cómodamente tanto desde computadora como desde dispositivos móviles.

## 🌱 Formación esencial — primeros 365 días

Cada usuario queda inscrito automáticamente durante sus primeros 365 días en:

- ✍️ Caligrafía y escritura clara
- 📖 Comprensión y expresión lectora
- 📝 Ortografía y redacción
- 🧮 Cálculo mental y agilidad numérica
- 🧩 Lógica y razonamiento
- 📅 Organización y hábitos de estudio

La inscripción guarda `required_until`, calculado como 365 días desde la creación del perfil.

## 🔐 Seguridad

- Supabase Auth gestiona las cuentas y recuperación de contraseña.
- RLS limita perfiles, solicitudes, inscripciones, clases, diagnósticos, actividades, asignaciones, intentos y adjuntos.
- El estudiante solo puede leer contenido publicado que le corresponda.
- Las clases individuales solo son visibles para sus destinatarios, Profesor o Administración.
- Las respuestas correctas del diagnóstico y de actividades no se exponen al estudiante.
- Crear, guardar y entregar intentos pasa por funciones seguras del servidor.
- El límite de intentos se comprueba también en servidor.
- La calificación manual pasa por RPC protegida y la firma del profesor se obtiene en servidor.
- Los archivos de actividades viven en un bucket **privado** y se descargan mediante sesión/RLS o URL firmada temporal.
- Un alumno solo puede subir archivos dentro de sus propios intentos abiertos.
- Profesor solo puede leer archivos de entregas que le corresponde revisar; Administración puede revisarlos por su rol.
- La creación y edición del catálogo usa `admin_save_course`, que vuelve a comprobar el rol `admin` en Supabase.
- Profesor IA usa un acceso dedicado de un solo usuario, una Edge Function con JWT obligatorio y un RPC de guardado que vuelve a validar el permiso.
- El contenido aprobado del Profesor IA se asigna únicamente a la cuenta autorizada.
- Las cuentas de estudiante no reciben permisos directos para modificar calificaciones, revisiones, el catálogo ni el Profesor IA.

Pendiente de seguridad antes de una beta más amplia: activar **Leaked Password Protection** en Supabase Auth.

## 🔁 PMA

PMA será una modalidad especial basada sobre el sistema actual de múltiples intentos. Más adelante añadirá reglas, ventana y etiqueta propias sin duplicar el almacenamiento de intentos.

## 🏆 Sistema académico — Etapas y Niveles

Nexora **no usa años escolares** como medida de progreso. El avance se organiza mediante:

**Etapa → Nivel → Bloques → Materias**

Las materias se mantienen durante la progresión. Todas comienzan desde nivel básico y añaden nuevos temas, profundidad y dificultad en niveles posteriores.

Las etapas base actuales son:

| Etapa base | Nota mínima de referencia |
|---|---:|
| 🌱 Fundamentos | 60/100 |
| 📘 Intermedio | 65/100 |
| 🧠 Avanzado | 70/100 |
| 🎓 Superior | 75/100 |
| 🏆 Dominio | 80/100 |

Estas etapas **no están limitadas a dos niveles** ni representan años reales. Cada etapa podrá contener tantos niveles como necesite el plan académico y en el futuro se pueden añadir nuevas etapas.

Cada materia mantiene **4 bloques de hasta 100 puntos por nivel**.

El ascenso de nivel no ocurrirá por tiempo. Se implementará un motor de promoción con condiciones académicas. Como base se evaluarán los cuatro bloques, las materias obligatorias y la nota mínima correspondiente a la etapa. Las condiciones definitivas de promoción todavía deben cerrarse antes de activar el ascenso automático.

## 🗄️ Tablas principales actuales

- `profiles`
- `user_roles`
- `courses`
- `course_requests`
- `course_enrollments`
- `course_lessons`
- `course_lesson_assignments`
- `course_activities`
- `course_activity_assignments`
- `activity_attempts`
- `activity_attempt_attachments`
- `admin_notifications`
- `ai_teacher_access`
- `diagnostic_levels`
- `diagnostic_question_pools`
- `diagnostic_questions`
- `diagnostic_attempts`
- `diagnostic_attempt_questions`
- `diagnostic_answers`
- `diagnostic_results`
- `private.course_activity_answer_keys`

Storage privado usado por las entregas:

- `activity-submissions`

Las funciones y migraciones administrativas se documentan en `supabase-notes/`.

## 🚧 Próximos objetivos

1. Añadir **presencia en línea**: conectado, inactivo, desconectado y última conexión, con panel para Administración.
2. Definir e implementar las condiciones definitivas para subir de **Nivel** y luego de **Etapa**.
3. Completar reglas de cierre de los 4 bloques y PMA.
4. Hacer dinámicos en toda la interfaz la etapa y el nivel del perfil, eliminando textos fijos como `Fundamentos · Año 1`.
5. Activar **Leaked Password Protection** y cerrar la revisión final de seguridad para la Beta de amigos.
6. Conectar el secreto `OPENAI_API_KEY` en Supabase si el panel Profesor IA indica **Conexión pendiente**.
7. Más adelante: mejorar el Profesor IA para utilizar historial, calificaciones y progreso antes de decidir la siguiente clase o práctica personal.

Los minijuegos no forman parte actualmente del plan de desarrollo.

---

# 📒 Bitácora

## 30 de septiembre de 2026 — Inicio

- Se creó Academia Nexora y su repositorio.
- Se definieron cursos, tareas, ejercicios, calificaciones, PMA y progresión académica.
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
- Formación esencial automática durante los primeros 365 días.

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

## 2 de octubre de 2026 — v0.19: tareas organizadas en Inicio

- Inicio muestra un tablero real de tareas por estado.
- Se separan Pendientes, Próximas, Entregadas, Calificadas y Vencidas.
- Las tarjetas muestran materia, bloque, puntos, intentos, cronómetro y fechas.
- Las tareas entregadas dejan de aparecer como pendientes.
- Desde Inicio se puede saltar directamente a la pestaña Tareas del curso correspondiente.

## 2 de octubre de 2026 — v0.20: gestión de cursos e interfaz ampliada

- Administración permite crear y editar cursos normales desde la web.
- Los cursos pueden activarse o desactivarse sin borrar historial.
- La clave interna queda bloqueada después de crear el curso.
- Formación esencial aparece protegida contra cambios accidentales.
- La edición se guarda mediante un RPC que comprueba el rol administrador en Supabase.
- Se documentó la migración del gestor en `supabase-notes/admin-course-management.sql`.
- Se amplió la interfaz para mejorar la legibilidad.

## 2 de octubre de 2026 — v0.21: Profesor IA exclusivo

- Se reservó un único acceso de Profesor IA para la cuenta principal.
- Se desplegó la Edge Function `nexora-ai-teacher` con JWT obligatorio y validación de acceso en servidor.
- El panel puede preparar clases, tareas de cuaderno, tareas virtuales y ejercicios prácticos.
- La generación usa salida estructurada para convertir la propuesta en el formato real de Nexora.
- Las claves de respuestas permanecen en almacenamiento privado.
- En v0.21 la generación se guardaba primero como borrador para revisión manual.

## 2 de octubre de 2026 — v0.22: Profesor IA personal, archivos y parejas

- El Profesor IA pasó de generador de borradores generales a **profesor personal de la cuenta autorizada**.
- Después de revisar una propuesta, **Publicar para mí** la publica y asigna únicamente a esa cuenta.
- Si la materia no estaba inscrita, el guardado personal activa su inscripción automáticamente.
- Se añadieron clases individuales mediante `course_lesson_assignments`.
- Se creó el bucket privado `activity-submissions` con límite de 20 MB por archivo.
- Cada intento puede adjuntar hasta 5 imágenes o archivos desde la interfaz.
- Los archivos solo pueden modificarse mientras el intento está abierto y Profesor puede consultarlos al calificar.
- Se añadió **Relacionar parejas** como quinto tipo de pregunta.
- Las parejas incompletas se bloquean también mediante validación de Supabase al publicar.
- Se retiraron los minijuegos de la hoja de ruta actual.
- El sistema académico se redefinió como **Etapas + Niveles**, sin usar años escolares como progreso.
- Presencia en línea pasó a ser el siguiente objetivo funcional.

---

> Este README funciona como **resumen general y bitácora del proyecto** y debe mantenerse actualizado con cada cambio importante.
