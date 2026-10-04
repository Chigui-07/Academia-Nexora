# 🎓 Academia Nexora

**Academia Nexora** es una plataforma educativa multiusuario para estudiar, organizar cursos y avanzar mediante un sistema propio de etapas y niveles.

## 📌 Estado del proyecto

**Fase actual: v0.37.1 — Hoja de ejercicios automática y limpieza segura de actividades.**

- Frontend: Next.js + TypeScript + CSS.
- Publicación: GitHub Pages.
- Backend, Auth, Storage y datos: Supabase.
- El proyecto no depende de APIs de IA de pago.

La base incluye registro, perfiles, Carné Nexora, roles, cursos, solicitudes e inscripciones, clases, seguimiento de clases nuevas/revisadas, tablas dentro de clases, clases guardadas por estudiante, tareas, ejercicios, Hoja de ejercicios automática, preguntas configurables con valor manual, archivos privados, intentos persistentes, confirmaciones de lectura/revisión, revisión y calificación manual, presencia en línea, Formación esencial anual, PMA, etapas, niveles, bloques, historial académico y ascenso automático.

## 🧭 Navegación

- 🏠 Inicio
- 📚 Cursos
- ➕ Solicitar curso
- 📝 Tareas
- 📊 Calificaciones
- 🟢 En línea
- 🏅 Perfil
- ⚙️ Administración, para cuentas con permiso de profesor o administrador

Las cuentas con permiso de gestión tienen acceso a **⚙️ Administración** tanto desde el menú lateral como desde la barra superior.

En **Inicio**, las clases disponibles se separan en **🆕 Nuevas** y **✅ Revisadas**. Una clase pasa a Revisadas automáticamente cuando el estudiante la abre por primera vez; puede volver a consultarla después sin que este estado afecte notas o entregas.

## ⚙️ Administración

Desde v0.34, Administración funciona como un menú de herramientas. Cada apartado es un botón y **solo una sección permanece abierta a la vez**.

Secciones disponibles:

- 📝 Tareas y ejercicios
- 📖 Clases
- 📚 Cursos
- 👥 Alumnos
- 📩 Solicitudes
- 🎓 Progresión académica

La sección **Tareas y ejercicios** se abre inicialmente para facilitar la creación rápida de actividades y archivos para los alumnos.

Desde **v0.37.1**, esta sección también incluye **🗑️ Eliminar tareas y ejercicios** con filtros por curso y tipo. Las actividades nunca utilizadas pueden borrarse; los ejercicios con intentos pueden archivarse para conservar su historial; y las tareas con entregas quedan protegidas para evitar alterar notas ya registradas. Las Hojas de ejercicios automáticas no se eliminan manualmente.

## 👤 Cuentas y roles

Cada usuario dispone de nombre académico, nombre de usuario y Carné Nexora único. Los roles son `student`, `teacher` y `admin`; una misma cuenta puede tener más de un rol.

Supabase Auth gestiona registro, confirmación por correo, inicio de sesión y recuperación de contraseña.

## 📚 Cursos

Los cursos viven en `courses`. Una inscripción activa vive en `course_enrollments`.

Administración puede crear, editar, activar o desactivar materias, aceptar solicitudes y asignar o retirar cursos directamente. Retirar una materia conserva su historial.

Cada curso dispone de **Resumen, Clases, Tareas, Ejercicios, Hoja de ejercicios y Calificaciones**.

Desde **v0.34.2**, la pantalla de curso ya no consulta los antiguos campos `starting_level` y `starting_title` que pertenecían al sistema de diagnósticos eliminado. El acceso usa únicamente la inscripción activa y los datos vigentes del curso.

Las seis áreas de Formación esencial permanecen internamente como cursos del sistema para conservar clases, actividades e historial, pero el estudiante las ve agrupadas como **una sola materia anual**.

## 👨‍🏫 Clases y actividades

Profesor puede crear clases y decidir si se publican para todo el curso o para estudiantes específicos.

Las clases admiten:

- explicación principal;
- una o varias tablas editables;
- ejemplos guiados;
- recursos y notas adicionales;
- vista previa antes de publicar.

En la vista del estudiante, las clases aparecen como **tarjetas compactas**. Al abrir una clase se muestra su contenido y al final existe el acceso **✏️ Haz el ejercicio para reforzar el tema**.

Desde **v0.36**, Inicio muestra un panel **📖 Tus clases** con dos estados:

- **🆕 Nuevas:** clases publicadas y accesibles que el estudiante todavía no ha abierto;
- **✅ Revisadas:** clases que ya abrió al menos una vez.

El estado se guarda por usuario en `lesson_views`. Abrir una tarjeta desde Inicio lleva directamente a esa clase dentro de su curso y actualiza su fecha de revisión. Este seguimiento es únicamente de organización: no entrega actividades, no modifica notas y no sustituye **🔖 Guardar clase**.

El contenido usa un sistema de **hojas navegables**. Las clases separan explicación, tablas, ejemplos y recursos; las tareas y ejercicios muestran una pregunta por hoja mediante **Hoja X de Y**.

Cada estudiante puede marcar una clase con **🔖 Guardar clase**. Los marcadores son personales por cuenta.

Las actividades disponibles son:

- 📝 Tarea de cuaderno
- 💻 Tarea virtual
- ✏️ Ejercicio práctico
- 📄 Hoja de ejercicios automática

Una actividad puede configurar curso, destinatarios, título, bloque, punteo, intentos, apertura, cierre, cronómetro, instrucciones, preguntas y estado Borrador/Publicada.

Desde **v0.35**, cada pregunta puede tener un **valor manual en puntos**. Desde **v0.35.1**, ese valor también puede usar hasta **2 decimales**, por ejemplo `2.5`, `1.25` o `0.75`. Al publicar, Supabase valida que cada valor esté entre 0 y 100 y que la suma coincida con el punteo total de la tarea. En ejercicios prácticos, la suma debe ser exactamente 100. Los valores aparecen en la hoja del estudiante y también durante la revisión del profesor. La calificación final continúa siendo manual.

Desde **v0.34.1**, la edición de clases vuelve a cargar correctamente los estudiantes específicos asignados. Las tareas y ejercicios se guardan mediante una sola operación atómica en Supabase: datos principales, preguntas, respuestas correctas y destinatarios se confirman juntos. Si algo falla, Nexora no deja un guardado parcial y muestra el error antes de limpiar el editor.

Las tareas de cuaderno pueden cerrar con **✅ Enterado**. Las tareas virtuales y los ejercicios prácticos pueden cerrar con **✅ Revisado**. La confirmación guarda fecha y hora, pero no entrega la actividad ni modifica la calificación.

Los ejercicios prácticos se califican sobre 100 como retroalimentación, pero no afectan directamente el promedio académico.

### 📄 Hoja de ejercicios

Desde **v0.37**, Nexora crea y mantiene automáticamente una **Hoja de ejercicios** para cada curso, bloque y nivel que tenga ejercicios prácticos publicados.

- La hoja vale **10 puntos académicos** y sí forma parte de los 100 puntos del bloque.
- Los ejercicios prácticos continúan calificándose sobre 100 solo como retroalimentación.
- Los ejercicios publicados aparecen automáticamente como casillas de selección múltiple.
- El estudiante marca únicamente los ejercicios que realmente realizó.
- La hoja tiene un solo intento y, una vez entregada, queda pendiente de revisión.
- El profesor asigna manualmente una calificación entre **0 y 10**; Nexora no calcula la nota por cantidad de casillas marcadas.
- Si se publica, renombra, mueve de bloque o retira un ejercicio, la hoja se sincroniza automáticamente.
- Cuando un ejercicio está asignado solo a ciertos estudiantes, la hoja respeta esos destinatarios y cada estudiante ve únicamente los ejercicios que le corresponden.
- El servidor valida la selección al guardar y entregar para impedir que se registren ejercicios no asignados.
- La Hoja de ejercicios no admite PMA.

Como esos 10 puntos cuentan dentro del bloque, al existir una Hoja de ejercicios quedan **90 puntos** disponibles para las demás actividades académicas de ese bloque.

### Tipos de pregunta

- Respuesta escrita
- Elección única
- Selección múltiple
- Verdadero o falso
- Relacionar parejas
- Subir archivo

En **Relacionar parejas**, las opciones de la derecha se mezclan de forma distinta para cada fila y mantienen su orden mientras el estudiante responde.

Los archivos viven en el bucket privado `activity-submissions`, con hasta 20 MB por archivo y entre 1 y 5 archivos configurables por pregunta.

## ✍️ Intentos y revisión

Los intentos guardan automáticamente las respuestas y pueden tener cronómetro. Al entregar, respuestas y archivos quedan bloqueados.

Profesor revisa cada pregunta con una de tres decisiones:

- ✅ Correcta
- — Neutral
- ❌ Incorrecta

Neutral cuenta como decisión tomada. El profesor puede dejar comentarios individuales, retroalimentación general y una nota final manual.

La Hoja de ejercicios usa una revisión neutral automática para su lista de casillas: el profesor solo decide la calificación final de 0 a 10 y puede añadir retroalimentación.

Si una actividad permite varios intentos, Nexora conserva para el promedio el mejor resultado válido.

## 🏆 Sistema académico

Nexora usa:

**Etapa → Nivel → Bloques → Materias**

Existen 5 etapas de 10 niveles cada una:

| Etapa | Niveles | Nota mínima |
|---|---:|---:|
| 🌱 Fundamentos | 1–10 | 60/100 |
| 📘 Intermedio | 1–10 | 65/100 |
| 🧠 Avanzado | 1–10 | 70/100 |
| 🎓 Superior | 1–10 | 75/100 |
| 🏆 Dominio | 1–10 | 80/100 |

En materias normales, cada clase y actividad pertenece a una etapa y nivel concretos.

### 📊 Bloques

Cada materia normal tiene 4 bloques por nivel, con exactamente 100 puntos publicados por bloque.

Cuando el bloque tiene ejercicios prácticos publicados, su **Hoja de ejercicios ocupa 10 de esos 100 puntos**.

Formación esencial también usa 4 bloques, pero cada bloque reúne sus 6 áreas:

- 100 puntos por área;
- 600 puntos por bloque;
- 2400 puntos durante todo el único año obligatorio.

### Nota final

En materias normales, cuando los cuatro bloques están completos:

`(Bloque 1 + Bloque 2 + Bloque 3 + Bloque 4) / 4`

Las notas se expresan sobre 100.

## 🔁 PMA

Administración puede escoger una tarea original y aplicar PMA.

El PMA conserva materia, tipo de actividad, punteo, bloque, etapa, nivel y destinatarios. El profesor escribe ejercicios distintos del mismo tema.

El PMA no agrega puntos nuevos al bloque: original y PMA ocupan el mismo espacio y se conserva el resultado más alto. Las Hojas de ejercicios automáticas no pueden ser actividades PMA.

## ⬆️ Ascenso automático

Después de cada calificación, Supabase recalcula el progreso académico de las materias normales.

Para aprobar un nivel:

1. cada materia normal activa debe tener sus cuatro bloques completos;
2. Nexora calcula la nota final de cada materia;
3. todas deben alcanzar el mínimo de la etapa.

Formación esencial tiene su propio recorrido anual y no se repite ni bloquea un nuevo nivel académico.

## 🌱 Formación esencial

Formación esencial es una sola materia obligatoria durante los primeros 365 días y se cursa una sola vez.

Áreas internas:

- ✍️ Caligrafía y escritura clara
- 📖 Comprensión y expresión lectora
- 📝 Ortografía y redacción
- 🧮 Cálculo mental y agilidad numérica
- 🧩 Lógica y razonamiento
- 📅 Organización y hábitos de estudio

Peso anual:

- 400 puntos por área;
- 600 puntos por bloque;
- 2400 puntos durante todo el año.

Las clases, tareas, ejercicios, hojas de ejercicios y calificaciones permanecen disponibles durante ese año aunque el estudiante cambie de etapa o nivel. Al cumplirse `required_until`, la materia deja de ser obligatoria y no se vuelve a asignar.

## 🟢 Presencia

Cada sesión autenticada actualiza `user_presence`. Nexora distingue:

- 🟢 En línea
- 🟡 Inactivo
- ⚫ Desconectado

## 🔐 Seguridad

- RLS protege perfiles, cursos, solicitudes, inscripciones, clases, marcadores, vistas de clases, actividades, intentos, confirmaciones, historial y archivos.
- `lesson_views` solo permite a cada estudiante leer, crear y actualizar sus propias marcas de revisión.
- El estudiante solo recibe contenido publicado que le corresponde.
- Crear, guardar y entregar intentos pasa por funciones de servidor.
- La selección de una Hoja de ejercicios se valida contra los ejercicios realmente publicados y asignados al estudiante.
- El guardado completo de una actividad pasa por un RPC que valida autenticación, rol, propiedad, curso, destinatarios, configuración y distribución de puntos antes de confirmar los cambios.
- Las eliminaciones de tareas y ejercicios pasan por `remove_course_activity`; el rol autenticado no tiene `DELETE` directo sobre `course_activities`.
- PMA valida servidor a servidor su relación con la tarea original.
- El historial académico no admite escritura directa del estudiante.
- El acceso visual a Administración no sustituye los controles reales de rol y RLS.

## 🗄️ Datos principales

- `profiles`
- `user_roles`
- `user_presence`
- `courses`
- `course_requests`
- `course_enrollments`
- `course_lessons`
- `course_lesson_assignments`
- `lesson_bookmarks`
- `lesson_views`
- `course_activities`
- `course_activity_assignments`
- `activity_attempts`
- `activity_attempt_attachments`
- `activity_acknowledgements`
- `academic_level_history`
- `admin_notifications`
- `private.course_activity_answer_keys`

Storage privado: `activity-submissions`.

Desde v0.34, el antiguo sistema de diagnósticos fue eliminado por completo del frontend y de Supabase.
