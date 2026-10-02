# 🎓 Academia Nexora

**Academia Nexora** es una plataforma educativa multiusuario para aprender desde cero, avanzar por etapas y organizar cursos, clases, tareas, ejercicios, calificaciones, diagnósticos y logros.

## 📌 Estado del proyecto

**Fase actual: v0.9 — Vista publicada de actividades y previsualización.**

Frontend: Next.js + TypeScript + CSS, publicado con GitHub Pages.  
Backend, autenticación y datos: Supabase.

Ya existen registro, confirmación por correo, inicio/cierre de sesión, perfiles, Carné Nexora, roles, onboarding, solicitudes de cursos, diagnóstico funcional de Matemática, historial de diagnósticos, catálogo persistente de materias, inscripciones reales, creador de actividades para Profesor y visualización de tareas/ejercicios publicados.

## 🧭 Navegación principal

- 🏠 Inicio
- 📚 Cursos
- ➕ Solicitar curso
- 🧠 Diagnósticos
- 📝 Tareas
- 📊 Calificaciones
- 🏅 Perfil
- ⚙️ Administración, cuando la cuenta tiene permisos

**Cursos** muestra únicamente materias ya asignadas. Las solicitudes y diagnósticos viven en sus propias secciones para evitar confusiones.

## 👤 Identidad y roles

Cada cuenta usa nombre y apellido reales para espacios académicos, Carné Nexora único y permanente y nombre de usuario personal/decorativo.

Los roles disponibles son `student`, `teacher` y `admin`. Una cuenta puede tener varios roles al mismo tiempo.

## 📚 Catálogo y solicitudes

Supabase contiene un catálogo persistente en `courses`. El catálogo inicial incluye Matemática, Física, Inglés, Programación básica, Historia, Geografía, Química y Biología.

El estudiante entra a **Solicitar curso**, busca una materia y envía una solicitud indicando su grado/nivel actual y cuánto considera que conoce del tema.

Los estados actuales son `pending`, `in_review`, `handled` y `rejected`.

Una solicitud aceptada crea una inscripción real en `course_enrollments`. Una solicitud rechazada no crea inscripción y puede volver a solicitarse posteriormente.

## 🧠 Diagnósticos

El diagnóstico inicial es opcional, no da puntos y se realiza una sola vez por materia.

Actualmente Matemática dispone de diagnóstico funcional con **194 preguntas permanentes** distribuidas en 6 niveles. Las preguntas se seleccionan de grupos equilibrados y permanecen fijas durante el intento.

La interfaz muestra una pregunta a la vez, navegación lateral numerada, botones **Siguiente** y **Mi límite**, y guarda las respuestas sin mostrar durante la prueba si fueron correctas.

| Nivel | Contenido | Banco | Selección |
|---|---|---:|---:|
| 1 | Operaciones básicas y problemas | 44 | 14 |
| 2 | Números negativos, fracciones y decimales | 36 | 12 |
| 3 | Proporciones, porcentajes y conversiones | 30 | 10 |
| 4 | Álgebra básica | 30 | 10 |
| 5 | Álgebra intermedia y geometría | 30 | 10 |
| 6 | Razonamiento avanzado | 24 | 8 |
| **Total** | | **194** | **64 máximo** |

Al finalizar se genera `diagnostic_results`, que conserva ubicación estimada, nivel dominado de forma consecutiva, temas dominados, temas a reforzar, resumen por nivel y forma de finalización. Se usa un criterio de referencia del **70 %** para considerar dominado un nivel completo.

La sección **Diagnósticos** es el lugar permanente para iniciar, continuar y consultar diagnósticos.

## 📘 Cursos activos

`course_enrollments` relaciona cada estudiante con sus materias aceptadas.

Cada curso dispone de:

- Resumen
- Clases
- Tareas
- Ejercicios
- Calificaciones

Si existe resultado de diagnóstico, el curso guarda también el nivel y tema recomendado para comenzar.

Las pestañas **Tareas** y **Ejercicios** ya muestran actividades publicadas que se encuentran dentro de su ventana de disponibilidad.

## ⚙️ Administración

Administración se concentra en la estructura de la academia:

- catálogo de cursos;
- solicitudes;
- inscripciones;
- asignar o retirar cursos de los usuarios.

No es el área responsable de redactar tareas o ejercicios académicos.

## 👨‍🏫 Profesor

Dentro del área de gestión existe un apartado exclusivo para cuentas con rol `teacher`.

Profesor puede crear y editar:

- **Tareas de cuaderno**;
- **Tareas virtuales**;
- **Ejercicios prácticos**.

Cada actividad puede configurar curso, título, punteo cuando corresponda, fecha/hora de apertura, fecha/hora de cierre, cronómetro opcional entre 1 y 1440 minutos, estado `draft` o `published` y contenido completo.

El cronómetro está diseñado para comenzar cuando el estudiante pulse **Comenzar actividad**, no simplemente al abrir la página.

### Hoja de actividad y vista previa

El creador incluye una **hoja en blanco** grande que funciona como editor. Profesor puede escribir directamente allí el enunciado, instrucciones, ejercicios, problemas y preguntas.

Antes de publicar existe **👁️ Vista previa**, que muestra cómo verá el estudiante la actividad.

Al publicarse, el textarea del editor no se muestra al estudiante. El contenido se transforma a una **hoja/cuaderno centrada** con líneas, margen, metadatos, punteo, fechas y tiempo, siguiendo el lenguaje visual usado en el diagnóstico de Matemática.

Las actividades se almacenan en `course_activities` y pueden volver a abrirse para modificar contenido, fechas, punteo, tiempo o estado.

## 📝 Tareas del estudiante

La pestaña general **Tareas** consulta actividades publicadas de los cursos en los que el estudiante está inscrito.

Solo aparecen tareas cuya apertura ya ocurrió y cuyo cierre todavía no pasó. Las tareas de cuaderno y virtuales se muestran con el formato de hoja/cuaderno. Los ejercicios prácticos se muestran en la pestaña **Ejercicios** del curso.

Todavía falta implementar la sesión de resolución, respuestas persistentes, entregas y ejecución real del cronómetro.

## 🔐 Seguridad

- Supabase Auth gestiona las cuentas.
- RLS limita perfiles, solicitudes, inscripciones, diagnósticos y actividades según usuario y rol.
- Solo Profesor puede crear o modificar `course_activities`.
- Los estudiantes únicamente pueden leer actividades publicadas de cursos en los que estén inscritos.
- Las claves correctas del diagnóstico no se envían al navegador.
- La corrección del diagnóstico se realiza en lógica segura del servidor.

## 🔁 PMA

El PMA será un segundo intento opcional de una tarea, con el mismo valor de puntos. La nota oficial será automáticamente la mayor entre ambos intentos.

## 🌱 Formación esencial

Durante los primeros 365 días se planean actividades breves de Caligrafía y escritura clara, Comprensión y expresión lectora, Ortografía y redacción, Cálculo mental y agilidad numérica, Lógica y razonamiento y Organización y hábitos de estudio. Después del primer año pasarán a ser opcionales.

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

## 🚧 Próximos objetivos

1. Implementar **Comenzar actividad** y el cronómetro real durante el intento.
2. Crear respuestas, intentos y entregas persistentes de estudiantes.
3. Crear el editor y publicación de **Clases**, organizadas por unidades/temas.
4. Implementar calificaciones por bloques y PMA.
5. Hacer que Tareas pendientes y Promedio actual del Dashboard provengan de datos reales.
6. Añadir recuperación de contraseña y terminar pruebas de seguridad/errores antes de invitar más usuarios.
7. Añadir Formación esencial e IA educativa segura.

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

- Se separó **Solicitar curso** de **Cursos**.
- Se creó el catálogo persistente `courses` y `course_enrollments`.
- Administración puede aceptar o rechazar solicitudes.
- Cada curso dispone de Resumen, Clases, Tareas, Ejercicios y Calificaciones.
- Los resultados de diagnóstico se sincronizan con el punto de inicio del curso.

## 1 de octubre de 2026 — v0.8: Panel Profesor

- Administración quedó enfocada en cursos, solicitudes e inscripciones de usuarios.
- Se añadió un apartado Profesor dentro del panel de gestión.
- Se creó `course_activities` con RLS.
- Profesor puede crear tareas de cuaderno, tareas virtuales y ejercicios prácticos.
- Se añadieron apertura, cierre, punteo y cronómetro opcional.
- Se añadió estado Borrador/Publicada.
- Se creó una hoja en blanco para redactar el contenido completo de cada actividad.
- Las actividades guardadas pueden volver a editarse.

## 1 de octubre de 2026 — v0.9: vista publicada de actividades

- Se añadió **Vista previa** al editor del Profesor.
- La actividad publicada se transforma a una hoja/cuaderno con el estilo visual del diagnóstico.
- Se muestran curso, tipo de actividad, puntos, apertura, cierre y límite de tiempo.
- La pestaña general Tareas ahora carga tareas publicadas y disponibles.
- Las pestañas Tareas y Ejercicios de cada curso cargan actividades reales.
- Las actividades fuera de su ventana de apertura/cierre no aparecen como disponibles.

---

> Este README funciona como **resumen general y bitácora del proyecto** y debe mantenerse actualizado con cada cambio importante.
