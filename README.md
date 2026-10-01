# 🎓 Academia Nexora

**Academia Nexora** es una plataforma educativa multiusuario para aprender desde cero, avanzar por etapas y organizar cursos, clases, tareas, ejercicios, calificaciones, diagnósticos y logros.

## 📌 Estado del proyecto

**Fase actual: v0.7 — Catálogo, solicitudes e inscripciones reales.**

Frontend: Next.js + TypeScript + CSS, publicado con GitHub Pages.  
Backend, autenticación y datos: Supabase.

Ya existen registro, confirmación por correo, inicio/cierre de sesión, perfiles, Carné Nexora, roles, onboarding, solicitudes de cursos, diagnóstico funcional de Matemática, historial de diagnósticos, catálogo persistente de materias e inscripciones reales.

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

Cada cuenta usa:

- nombre y apellido reales para espacios académicos;
- Carné Nexora único y permanente;
- nombre de usuario personal/decorativo.

Los roles disponibles son `student`, `teacher` y `admin`. Una cuenta puede tener varios roles al mismo tiempo.

## 📚 Catálogo y solicitudes

Supabase contiene un catálogo persistente en `courses`. El catálogo inicial incluye:

- Matemática
- Física
- Inglés
- Programación básica
- Historia
- Geografía
- Química
- Biología

El estudiante entra a **Solicitar curso**, busca una materia y envía una solicitud indicando su grado/nivel actual y cuánto considera que conoce del tema.

Los estados actuales son:

- `pending` — pendiente;
- `in_review` — en revisión;
- `handled` — aceptada;
- `rejected` — rechazada.

Una solicitud aceptada crea una inscripción real en `course_enrollments`. Una solicitud rechazada no crea inscripción y puede volver a solicitarse posteriormente.

## 🧠 Diagnósticos

El diagnóstico inicial es opcional, no da puntos y se realiza una sola vez por materia.

Actualmente Matemática dispone de diagnóstico funcional con **194 preguntas permanentes** distribuidas en 6 niveles. Las preguntas se seleccionan de grupos equilibrados y permanecen fijas durante el intento.

La interfaz muestra una pregunta a la vez, navegación lateral numerada, botones **Siguiente** y **Mi límite**, y guarda las respuestas sin mostrar durante la prueba si fueron correctas.

El banco de Matemática:

| Nivel | Contenido | Banco | Selección |
|---|---|---:|---:|
| 1 | Operaciones básicas y problemas | 44 | 14 |
| 2 | Números negativos, fracciones y decimales | 36 | 12 |
| 3 | Proporciones, porcentajes y conversiones | 30 | 10 |
| 4 | Álgebra básica | 30 | 10 |
| 5 | Álgebra intermedia y geometría | 30 | 10 |
| 6 | Razonamiento avanzado | 24 | 8 |
| **Total** | | **194** | **64 máximo** |

Al finalizar se genera `diagnostic_results`, que conserva:

- ubicación estimada;
- nivel dominado de forma consecutiva;
- temas dominados;
- temas a reforzar;
- resumen por nivel;
- si terminó normalmente o con **Mi límite**.

Se usa un criterio de referencia del **70 %** para considerar dominado un nivel completo.

La sección **Diagnósticos** es ahora el único lugar permanente para iniciar, continuar y consultar diagnósticos. Al solicitar una materia que tenga diagnóstico, Nexora ofrece inmediatamente **Comenzar diagnóstico** o **Ir al inicio**. Si el estudiante decide hacerlo después, seguirá apareciendo como disponible en Diagnósticos.

## 📘 Cursos activos

`course_enrollments` relaciona cada estudiante con sus materias aceptadas.

Al entrar a un curso se dispone de un espacio propio con pestañas:

- Resumen
- Clases
- Tareas
- Ejercicios
- Calificaciones

Si existe resultado de diagnóstico, el curso guarda también el nivel y tema recomendado para comenzar. Si el diagnóstico termina después de la inscripción, el resultado se sincroniza automáticamente con el curso.

## ⚙️ Administración

Administración puede revisar solicitudes y ver:

- nombre académico y Carné Nexora;
- materia solicitada;
- grado/nivel;
- autoevaluación del estudiante;
- estado del diagnóstico cuando existe.

Acciones disponibles:

- **En revisión**;
- **Aceptar curso** — crea/reactiva la inscripción;
- **Rechazar**.

## 🔐 Seguridad

- Supabase Auth gestiona las cuentas.
- RLS limita perfiles, solicitudes, inscripciones y diagnósticos según usuario y rol.
- Las claves correctas del diagnóstico no se envían al navegador.
- La corrección se realiza en lógica segura del servidor.
- El estudiante no puede modificar directamente `is_correct` ni sus resultados finales.
- Las acciones administrativas sensibles verifican el rol `admin` dentro de Supabase.

## 📝 Actividades planificadas

### Tareas de cuaderno

- puntos;
- apertura y cierre;
- instrucciones/documentos;
- respuestas;
- fotografía del procedimiento cuando corresponda;
- sin corrección posterior a la entrega.

### Tareas virtuales

- se realizan dentro de Nexora;
- tienen puntos y calendario;
- podrán ser calificadas automáticamente de forma segura.

### Ejercicios

- práctica sin puntos;
- se pueden corregir y repetir;
- algunos podrán ser minijuegos.

Cuando se desarrolle el rol Profesor, tareas y ejercicios podrán tener un **cronómetro opcional configurado por el profesor**.

## 🔁 PMA

El PMA será un segundo intento opcional de una tarea, con el mismo valor de puntos. La nota oficial será automáticamente la mayor entre ambos intentos.

## 🌱 Formación esencial

Durante los primeros 365 días se planean actividades breves de:

- Caligrafía y escritura clara
- Comprensión y expresión lectora
- Ortografía y redacción
- Cálculo mental y agilidad numérica
- Lógica y razonamiento
- Organización y hábitos de estudio

Después del primer año pasarán a ser opcionales.

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
- `admin_notifications`
- `diagnostic_levels`
- `diagnostic_question_pools`
- `diagnostic_questions`
- `diagnostic_attempts`
- `diagnostic_attempt_questions`
- `diagnostic_answers`
- `diagnostic_results`

## 🚧 Próximos objetivos

1. Probar aceptar la primera solicitud y abrir el primer curso real.
2. Hacer que el Dashboard calcule cursos activos, tareas pendientes y promedio con datos reales.
3. Desarrollar el rol Profesor.
4. Crear clases, tareas, ejercicios y entregas persistentes.
5. Añadir cronómetro opcional a tareas y ejercicios.
6. Implementar calificaciones por bloques y PMA.
7. Añadir Formación esencial.
8. Añadir recuperación de contraseña e IA educativa segura.

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
- Formación esencial definida para los primeros 365 días.

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
- Cursos ahora muestra únicamente materias aceptadas.
- Se creó el catálogo persistente `courses`.
- Se creó `course_enrollments`.
- Administración puede aceptar o rechazar solicitudes.
- Aceptar crea una inscripción real.
- Cada curso dispone de Resumen, Clases, Tareas, Ejercicios y Calificaciones.
- Diagnósticos quedó como sección exclusiva para iniciar, continuar y consultar pruebas de nivel.
- Después de solicitar Matemática se puede comenzar el diagnóstico o volver al inicio.
- Los resultados de diagnóstico se sincronizan con el punto de inicio del curso.
- Se registró el cronómetro configurable como función futura del rol Profesor.

---

> Este README funciona como **resumen general y bitácora del proyecto** y debe mantenerse actualizado con cada cambio importante.
