# 🎓 Academia Nexora

**Academia Nexora** es una plataforma educativa multiusuario para aprender desde cero, avanzar por etapas y niveles y organizar cursos, clases, tareas, ejercicios, calificaciones y diagnósticos.

## 📌 Estado del proyecto

**Fase actual: v0.25 — retiro del Profesor IA y consolidación del sistema académico.**

Frontend: Next.js + TypeScript + CSS, publicado con GitHub Pages.  
Backend, autenticación, Storage y datos: Supabase.

Ya existen registro, confirmación por correo, recuperación de contraseña, perfiles, Carné Nexora, roles, onboarding, solicitudes e inscripciones, diagnóstico funcional de Matemática, historial de diagnósticos, creador manual de clases y actividades, preguntas configurables, Formación esencial, intentos persistentes, asignación individual, revisión firmada, calificaciones reales, tablero de tareas, archivos privados ligados a preguntas, relacionar parejas y presencia en línea para usuarios autenticados.

**Decisión de v0.25:** Nexora no dependerá de una API de IA de pago. El Profesor IA se retira del producto y las funciones académicas principales deben poder funcionar sin servicios de pago obligatorios.

## 🧭 Navegación principal

- 🏠 Inicio
- 📚 Cursos
- ➕ Solicitar curso
- 🧠 Diagnósticos
- 📝 Tareas
- 📊 Calificaciones
- 🟢 En línea
- 🏅 Perfil
- ⚙️ Administración, cuando la cuenta tiene permisos

## 👤 Identidad y roles

Cada cuenta usa nombre y apellido reales para espacios académicos, Carné Nexora único y permanente y nombre de usuario personal/decorativo.

Los roles disponibles son `student`, `teacher` y `admin`. Una cuenta puede tener varios roles al mismo tiempo.

## 📚 Catálogo, solicitudes e inscripciones

El catálogo persistente vive en `courses`. Una solicitud aceptada crea una inscripción real en `course_enrollments`.

Los cursos normales pueden solicitarse desde **Solicitar curso**. Administración también puede seleccionar un alumno y asignarle o retirarle materias directamente. Retirar un curso lo pausa y conserva su historial.

**Administración → Gestionar cursos** permite crear, editar, activar o desactivar materias normales. La clave interna (`course_key`) queda fija después de crear el curso para no romper rutas, historial o diagnósticos. Formación esencial permanece protegida.

Cada curso dispone de **Resumen, Clases, Tareas, Ejercicios y Calificaciones**.

## 🧠 Diagnósticos

El diagnóstico inicial es opcional, no da puntos y se realiza una sola vez por materia.

Actualmente Matemática dispone de un motor funcional con **194 preguntas permanentes** distribuidas en 6 niveles. Al finalizar se genera `diagnostic_results` con ubicación estimada, temas dominados y temas a reforzar. Las respuestas correctas permanecen protegidas del navegador.

## 👨‍🏫 Profesor y Administración

### Clases

Profesor puede crear clases vinculadas a cualquier curso y configurar unidad o tema, título, explicación, ejemplos guiados, recursos, orden y estado Borrador/Publicada.

Desde v0.24 el formulario **Crear y gestionar clases** también incluye **👥 Dar clase a**:

- **Todo el curso**;
- **Estudiantes específicos**.

Al elegir estudiantes específicos se muestran los alumnos activos del curso y se pueden marcar individualmente. La asignación se guarda en `course_lesson_assignments` y se valida también en servidor mediante `save_course_lesson`.

Al editar una clase, Nexora vuelve a cargar sus destinatarios anteriores.

### Actividades

Profesor puede crear y editar **Tareas de cuaderno**, **Tareas virtuales** y **Ejercicios prácticos**.

Cada actividad puede configurar curso, destinatarios, título, punteo cuando corresponda, **Bloque 1–4**, **1–20 intentos**, apertura, cierre, cronómetro opcional, estado Borrador/Publicada e instrucciones generales.

Cada actividad puede enviarse a **todo el curso** o a **estudiantes específicos** mediante `course_activity_assignments`.

Las tareas calificables alimentan el bloque y el promedio académico. Los ejercicios prácticos se califican sobre **100 puntos** como retroalimentación, pero no afectan el promedio académico.

### Constructor de preguntas

Profesor puede añadir manualmente cualquiera de estos tipos de respuesta:

- **Respuesta escrita**;
- **Elección única**;
- **Selección múltiple**;
- **Verdadero o falso**;
- **Relacionar parejas**;
- **Subir archivo**.

**Relacionar parejas** guarda cada relación como `{id, left, right}` y muestra las opciones derechas mezcladas al estudiante.

**Subir archivo** solo aparece cuando Profesor lo agrega manualmente. Permite configurar cualquier archivo, imágenes, PDF, documentos o archivos comprimidos, con un máximo configurable de **1 a 5 archivos** por pregunta.

El límite de Storage es **20 MB por archivo**.

Las claves correctas de preguntas objetivas permanecen en `private.course_activity_answer_keys` y no se envían al estudiante.

### 📎 Respuestas por archivo

Cada archivo nuevo queda ligado a la **pregunta `file_upload` específica** que el profesor creó.

La ruta privada usa la estructura:

`usuario / intento / pregunta / archivo`

El estudiante puede subir o eliminar sus archivos únicamente mientras el intento está abierto. Después de entregar, quedan bloqueados con esa entrega.

Supabase comprueba que la pregunta realmente sea de tipo `file_upload`. Al calificar, Profesor puede abrir los archivos desde el panel de revisión.

### Revisión y calificación

Administración está organizada por alumno. Al seleccionar un estudiante se pueden ver sus cursos y sus entregas.

Cada respuesta puede marcarse como:

- ✅ **Correcta**;
- ❌ **Incorrecta**.

También existe comentario independiente por pregunta y retroalimentación general final. Cada revisión queda firmada automáticamente con el nombre académico del profesor.

La nota final sigue siendo **manual y personalizada**: Nexora no reparte automáticamente el punteo de cada pregunta; Profesor decide cuánto recibe cada alumno.

## ✍️ Experiencia del estudiante

Dentro de cada curso, Tareas y Ejercicios funcionan como bibliotecas acumulables.

Al comenzar un intento:

- las preguntas se muestran una por una;
- existe navegación lateral numerada;
- las respuestas se guardan automáticamente;
- el cronómetro es persistente y controlado por servidor;
- una pregunta **Subir archivo** muestra su selector únicamente cuando el profesor la añadió;
- el archivo queda asociado a esa pregunta;
- al entregar, respuestas y archivos quedan bloqueados.

Los ejercicios cerrados permanecen accesibles para consultar respuestas, revisión y calificación.

### Tareas en Inicio

Inicio separa las tareas en:

- **Pendientes**;
- **Próximas**;
- **Entregadas**;
- **Calificadas**;
- **Vencidas**.

Las tareas entregadas dejan de contarse como pendientes.

## 📊 Calificaciones y promedio

- Cada tarea calificable pertenece a uno de los 4 bloques.
- Cada bloque muestra puntos obtenidos sobre los puntos ya calificados, por ejemplo `35/40`.
- Si una tarea tiene varios intentos revisados, cuenta el intento con mejor porcentaje.
- Los ejercicios prácticos no afectan el promedio académico.
- Dentro de cada materia se muestra Promedio actual, Bloque 1–4 y detalle de tareas calificadas.

**Pendiente:** definir el cierre definitivo de cada bloque y el cálculo final de los cuatro bloques para decidir aprobación, PMA y ascenso académico.

## 🟢 Presencia en línea

Cada sesión autenticada envía un latido a Supabase aproximadamente cada 30 segundos mientras utiliza Nexora.

La plataforma distingue:

- 🟢 **En línea**: sesión reciente y actividad reciente;
- 🟡 **Inactivo**: sesión reciente pero sin interacción durante varios minutos;
- ⚫ **Desconectado**: dejaron de recibirse latidos recientes.

La sección **🟢 En línea** puede verla cualquier usuario autenticado. La vista general solo muestra nombre académico, nombre de usuario, estado y última conexión.

La tabla `user_presence` continúa protegida por RLS; los usuarios normales obtienen una vista sanitizada mediante `get_presence()`.

## 🖥️ Interfaz

La interfaz usa una distribución amplia en escritorio y vuelve a una sola columna en pantallas pequeñas.

La barra lateral ya muestra la progresión como **Etapa · Nivel** y obtiene `stage` y `level` desde `profiles`.

## 🌱 Formación esencial — primeros 365 días

Cada usuario queda inscrito automáticamente durante sus primeros 365 días en:

- ✍️ Caligrafía y escritura clara
- 📖 Comprensión y expresión lectora
- 📝 Ortografía y redacción
- 🧮 Cálculo mental y agilidad numérica
- 🧩 Lógica y razonamiento
- 📅 Organización y hábitos de estudio

## 🔐 Seguridad

- Supabase Auth gestiona cuentas y recuperación de contraseña.
- RLS limita perfiles, solicitudes, inscripciones, clases, diagnósticos, actividades, asignaciones, intentos y adjuntos.
- El estudiante solo puede leer contenido publicado que le corresponda.
- Las clases individuales solo son visibles para sus destinatarios, Profesor o Administración.
- Las respuestas correctas no se exponen al estudiante.
- Crear, guardar y entregar intentos pasa por funciones seguras del servidor.
- La calificación manual usa RPC protegida y firma del profesor.
- Los archivos viven en el bucket privado `activity-submissions`.
- Los archivos solo pueden subirse dentro de un intento propio abierto y vinculados a una pregunta `file_upload` válida.
- `get_presence()` exige autenticación y solo devuelve información pública de presencia; la tabla directa sigue protegida.

**Pendiente antes de una beta más amplia:** activar **Leaked Password Protection** en Supabase Auth.

## 🔁 PMA

PMA será una modalidad especial basada en el sistema actual de múltiples intentos. Añadirá reglas, ventana y etiqueta propias sin duplicar el almacenamiento de intentos.

Todavía falta definir exactamente:

- cuándo una materia entra a PMA;
- cuántas oportunidades ofrece;
- qué nota reemplaza o recupera;
- cómo afecta al cierre del nivel.

## 🏆 Sistema académico — Etapas y Niveles

Nexora **no usa años escolares** como medida de progreso. El avance se organiza mediante:

**Etapa → Nivel → Bloques → Materias**

Las materias se mantienen durante la progresión y aumentan en contenido, profundidad y dificultad.

| Etapa base | Nota mínima de referencia |
|---|---:|
| 🌱 Fundamentos | 60/100 |
| 📘 Intermedio | 65/100 |
| 🧠 Avanzado | 70/100 |
| 🎓 Superior | 75/100 |
| 🏆 Dominio | 80/100 |

Cada materia mantiene **4 bloques de hasta 100 puntos por nivel**.

### Base acordada para ascender

El ascenso será **académico, no por tiempo ni por XP**. La base de diseño es:

1. cerrar los cuatro bloques del nivel;
2. calcular la nota final de cada materia;
3. exigir la nota mínima correspondiente a la etapa;
4. permitir PMA cuando una materia no alcance el mínimo;
5. avanzar de nivel solo cuando se cumplan las reglas académicas definitivas.

**Todavía falta decidir cuántos niveles contiene cada etapa** y convertir estas reglas en lógica automática de Supabase.

## 🗄️ Datos principales

Tablas destacadas:

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
- `admin_notifications`
- tablas de diagnóstico
- `private.course_activity_answer_keys`

Storage privado:

- `activity-submissions`

Las migraciones administrativas quedan documentadas en `supabase-notes/`.

## ✅ Ya implementado

- Autenticación y recuperación de contraseña.
- Identidad académica, Carné Nexora y roles múltiples.
- Catálogo, solicitudes e inscripciones.
- Diagnóstico de Matemática con banco permanente.
- Clases manuales y asignación por curso o estudiantes específicos.
- Tareas de cuaderno, virtuales y ejercicios prácticos.
- Seis tipos de pregunta, incluyendo parejas y subida de archivos.
- Intentos persistentes, autosave y cronómetro.
- Revisión manual detallada y firma del profesor.
- Calificaciones por bloques y mejor intento revisado.
- Panel de tareas del estudiante.
- Gestión administrativa por alumno.
- Presencia En línea / Inactivo / Desconectado.
- Formación esencial durante los primeros 365 días.
- Base visual y de datos para Etapa y Nivel.

## 🚧 Próximos objetivos

1. Definir cuántos **Niveles** contiene cada Etapa.
2. Definir cierre de bloques, nota final de materia y aprobación del Nivel.
3. Definir e implementar las reglas completas de **PMA**.
4. Implementar ascenso automático de Nivel y Etapa en Supabase.
5. Hacer dinámicas todas las reglas académicas mostradas en Perfil e interfaz.
6. Activar **Leaked Password Protection** antes de una beta más amplia.
7. Revisar pruebas, errores y experiencia móvil antes de abrir una beta.

Los minijuegos no forman parte actualmente del plan de desarrollo.

---

# 📒 Bitácora

## 30 de septiembre de 2026 — Inicio

- Se creó Academia Nexora y su repositorio.
- Se definieron cursos, tareas, ejercicios, calificaciones, PMA y progresión académica.
- Se configuraron GitHub Pages y Supabase.

## 1 de octubre de 2026 — v0.3 a v0.14

- Registro, login, identidad académica, Carné Nexora y roles.
- Diagnóstico funcional de Matemática y banco permanente de preguntas.
- Catálogo, solicitudes e inscripciones.
- Creador de tareas, ejercicios y clases.
- Intentos persistentes, autosave, cronómetro y revisión manual.
- Asignación individual de actividades y bloques 1–4.

## 2 de octubre de 2026 — v0.15 a v0.20

- Recuperación de contraseña.
- Biblioteca acumulativa de tareas y ejercicios.
- Corrección detallada y comentarios por pregunta.
- Administración organizada por alumno.
- Calificaciones dentro de cada curso.
- Tareas organizadas en Inicio.
- Gestión administrativa de cursos e interfaz ampliada.

## 2 de octubre de 2026 — v0.21: Profesor IA exclusivo

- Se creó experimentalmente un acceso de Profesor IA para la cuenta principal.
- Se desplegó `nexora-ai-teacher` con JWT y comprobación de acceso.

## 2 de octubre de 2026 — v0.22: contenido personal, archivos y parejas

- La función experimental de IA podía publicar contenido individual.
- Se añadieron clases individuales en base de datos.
- Se creó Storage privado para entregas.
- Se añadió **Relacionar parejas**.
- El sistema académico pasó a **Etapas + Niveles**.

## 2 de octubre de 2026 — v0.23: presencia en línea

- Se creó `user_presence` y el latido periódico.
- Se añadieron estados En línea, Inactivo y Desconectado.
- La primera interfaz de presencia se colocó dentro de Administración.
- La barra lateral pasó definitivamente de Año a Nivel.

## 2 de octubre de 2026 — v0.24 / v0.24.1

- **Crear clases** permite escoger Todo el curso o Estudiantes específicos.
- Editar una clase vuelve a cargar sus destinatarios.
- Se añadió **Subir archivo** como sexto tipo manual del constructor de preguntas.
- Profesor puede definir tipo de archivo y máximo de 1 a 5 archivos.
- Cada archivo nuevo se liga a su pregunta mediante `question_id`.
- Storage valida que el archivo corresponda realmente a una pregunta `file_upload`.
- **En línea** pasó a la navegación general para todos los usuarios autenticados.
- v0.24.1 corrigió permisos de la RPC de presencia.

## 2 de octubre de 2026 — v0.25: retiro de IA

- Se decidió que las funciones principales de Nexora no dependerán de APIs de pago.
- Se retiró **Profesor IA** del panel de Administración.
- Se eliminaron sus componentes y estilos dedicados del frontend.
- Se retiró la migración dedicada antigua y se añadió `v025-remove-ai-teacher.sql` para limpiar funciones y tabla exclusivas de IA en Supabase.
- La Edge Function `nexora-ai-teacher` y el secreto asociado deben retirarse también del proyecto Supabase.
- El desarrollo vuelve a centrarse en progresión académica, bloques y PMA.

---

> Este README funciona como **resumen general y bitácora del proyecto** y debe mantenerse actualizado con cada cambio importante.
