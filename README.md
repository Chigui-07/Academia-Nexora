# 🎓 Academia Nexora

**Academia Nexora** es una plataforma educativa multiusuario para estudiar, organizar cursos y avanzar mediante un sistema propio de etapas y niveles.

## 📌 Estado del proyecto

**Fase actual: v0.31.1 — base académica pública con contenido en hojas navegables y parejas aleatorias.**

- Frontend: Next.js + TypeScript + CSS.
- Publicación: GitHub Pages.
- Backend, Auth, Storage y datos: Supabase.
- El proyecto no depende de APIs de IA de pago.

La base incluye registro, perfiles, Carné Nexora, roles, cursos, solicitudes e inscripciones, diagnósticos, clases, tablas dentro de clases, clases guardadas por estudiante, tareas, ejercicios, preguntas configurables, archivos privados, intentos persistentes, revisión y calificación manual, presencia en línea, Formación esencial, PMA, etapas, niveles, bloques, historial académico y ascenso automático.

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

El diagnóstico inicial es opcional, se realiza una vez por materia y no da puntos académicos.

Nexora dispone de un motor universal de diagnósticos por niveles. Matemática conserva un banco amplio de 194 preguntas y los demás cursos activos pueden tener sus propios niveles y bancos de preguntas.

Administración cuenta con un **Constructor de diagnósticos** para buscar cualquier curso creado, definir niveles, cantidad de preguntas, dificultad y respuestas aceptadas.

Los intentos guardan progreso en Supabase y permiten continuar más tarde. Al completar las preguntas de un nivel, el diagnóstico avanza automáticamente al siguiente. También existe **Mi límite** para cerrar honestamente la prueba cuando el estudiante llega a contenido que ya no domina.

## 👨‍🏫 Clases y actividades

Profesor puede crear clases y decidir si se publican para todo el curso o para estudiantes específicos.

Las clases admiten:

- explicación principal;
- una o varias **tablas editables** con título, filas y columnas;
- ejemplos guiados;
- recursos y notas adicionales;
- vista previa antes de publicar.

Las tablas se guardan junto con el contenido de la clase sin romper las clases creadas anteriormente.

En la vista del estudiante, las clases aparecen como **tarjetas compactas**, igual que los ejercicios. Al seleccionar una tarjeta se abre la clase completa y al final aparece el acceso **✏️ Haz el ejercicio para reforzar el tema**, que lleva a la pestaña de ejercicios del mismo curso.

Desde v0.31, el contenido usa un sistema de **hojas navegables**. Las clases separan explicación, cada tabla, ejemplos y recursos en hojas distintas; las tareas y ejercicios muestran una pregunta por hoja. La navegación indica **Hoja X de Y** y permite avanzar o retroceder sin cargar todo el contenido de golpe.

Cada estudiante puede marcar una clase con **🔖 Guardar clase**. Los marcadores se almacenan por cuenta en Supabase y la pestaña Clases permite alternar entre **Todas** y **Guardadas**. Quitar el marcador no elimina ni modifica la clase original.

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

En las preguntas de **Relacionar parejas**, las opciones de la derecha se mezclan de forma distinta para cada fila y mantienen ese orden mientras el estudiante responde, evitando pistas por posición.

Los archivos viven en el bucket privado `activity-submissions`, con hasta **20 MB por archivo** y entre **1 y 5 archivos** configurables por pregunta de subida.

Las respuestas correctas objetivas permanecen protegidas en `private.course_activity_answer_keys`.

## ✍️ Intentos y revisión

Los intentos son persistentes, guardan automáticamente las respuestas y pueden tener cronómetro. Al entregar, respuestas y archivos quedan bloqueados.

Profesor revisa cada pregunta con una de tres decisiones:

- ✅ Correcta
- — Neutral
- ❌ Incorrecta

Neutral cuenta como decisión tomada y por tanto no deja la pregunta pendiente. El profesor puede escribir comentarios individuales y retroalimentación general, y decide manualmente la nota final del intento. Cada revisión queda firmada.

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

Nexora crea un borrador de recuperación que conserva automáticamente materia, tipo de actividad, punteo, bloque, etapa, nivel y destinatarios.

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

Perfil muestra automáticamente etapa y nivel actuales, progreso dentro de la etapa, nota mínima, estado académico, estado de cada materia y sus cuatro bloques, e historial de niveles completados.

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

- RLS protege perfiles, cursos, solicitudes, inscripciones, clases, marcadores personales, actividades, intentos, historial y archivos.
- El estudiante solo recibe contenido publicado que le corresponde.
- Cada usuario solo puede leer, crear y quitar sus propios marcadores de clases.
- Las claves correctas no se exponen al navegador del estudiante.
- Crear, guardar y entregar intentos pasa por funciones de servidor.
- PMA valida servidor a servidor su relación con la tarea original.
- El historial académico no admite escritura directa del estudiante.
- Los RPC académicos públicos usan wrappers `SECURITY INVOKER`; las operaciones privilegiadas permanecen en funciones privadas con comprobaciones explícitas de autenticación y roles.

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