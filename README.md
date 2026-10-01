# 🎓 Academia Nexora

**Academia Nexora** es una plataforma educativa multiusuario pensada para aprender desde cero, avanzar por etapas académicas y combinar clases, tareas, práctica, calificaciones, logros y actividades interactivas.

La plataforma tendrá un sistema académico propio. Las materias continúan a lo largo de los años y aumentan progresivamente en cantidad de temas, profundidad y dificultad.

## 📌 Estado del proyecto

**Fase actual:** v0.3 — Bienvenida y elección de cursos.

La interfaz está publicada mediante GitHub Pages y utiliza Supabase para autenticación y datos. Ya existe registro, confirmación por correo, inicio/cierre de sesión, perfiles, roles, onboarding y solicitudes persistentes de cursos.

## 🖥️ Interfaz actual

Incluye:

- Inicio de sesión real.
- Registro separado del login.
- Reglas de Academia Nexora aceptadas durante el registro.
- Confirmación de correo mediante Supabase Auth.
- Sesión almacenada solo durante la sesión del navegador mediante `sessionStorage`.
- Dashboard protegido.
- Bienvenida obligatoria para cuentas nuevas.
- Solicitud del primer curso después de confirmar la cuenta.
- Solicitudes de nuevos cursos disponibles permanentemente desde **Cursos**.
- Nivel/grado actual y autoevaluación de conocimiento por solicitud.
- Opción para solicitar un diagnóstico inicial.
- Recomendaciones básicas de cursos relacionados.
- Cola privada de solicitudes para Administración.
- Avisos de solicitudes nuevas visibles únicamente para administradores.
- Cursos, Tareas, Calificaciones, Perfil y Administración.
- Modo oscuro por defecto y modo claro opcional.

## 🧭 Menú principal

- **Cursos** — materias asignadas, solicitudes y recomendaciones.
- **Tareas** — actividades disponibles según fecha y hora de apertura/cierre.
- **Calificaciones** — notas por materia, bloque y promedio general.
- **Perfil** — progreso, etapa, año, logros e insignias.
- **Administración** — herramientas de profesor/administrador; las solicitudes de cursos son exclusivas de administradores.

## 📚 Solicitudes de cursos

Cada estudiante puede solicitar nuevos cursos desde su bienvenida inicial o desde la sección **Cursos**.

Por cada solicitud se guarda:

- curso solicitado;
- grado o nivel actual del estudiante;
- nivel que el propio estudiante cree tener en la materia;
- si desea realizar el diagnóstico opcional;
- estado de la solicitud: `Pendiente`, `En revisión` o `Atendida`.

Una solicitud **no crea ni asigna automáticamente** una materia. Administración debe revisarla.

### Recomendaciones

La plataforma puede mostrar tres tipos de sugerencias relacionadas con el curso elegido:

- 🧩 **Te puede ayudar**
- ⭐ **También podría gustarte**
- 🚀 **Recomendado para después**

Las recomendaciones iniciales se basan en reglas sencillas. Más adelante podrán aprovechar información académica e IA.

## 🧠 Diagnóstico inicial

El diagnóstico será **opcional** y no dará una calificación académica. Su objetivo es encontrar desde dónde conviene comenzar a enseñar una materia.

Antes de comenzar se recordará al estudiante que debe ser honesto. El diagnóstico aumentará progresivamente de dificultad y tendrá únicamente dos acciones principales:

- **Siguiente** — continuar a un nivel mayor.
- **Mi límite** — indicar que desde ese punto ya no está seguro de poder continuar.

Pulsar **Mi límite** no resta puntos ni representa un error. El resultado servirá para ajustar clases, tareas y ejercicios.

La estructura de base de datos para intentos y respuestas de diagnóstico ya está preparada. Las preguntas específicas se implementarán cuando exista el catálogo real de cursos y contenidos.

## 🌱 Formación esencial

Durante los primeros **365 días** de una cuenta se planea incluir cursos base obligatorios que fortalezcan habilidades generales, por ejemplo:

- Caligrafía y escritura clara.
- Comprensión y expresión lectora.
- Ortografía y redacción.
- Cálculo mental.
- Lógica y razonamiento.
- Organización y hábitos de estudio.

Después del primer año dejarán de ser obligatorios y el usuario podrá decidir cuáles desea continuar.

## 📚 Estructura de cada curso

Cada curso tendrá:

- Clases y explicaciones.
- Tareas.
- Ejercicios.
- Calificaciones.

Cada materia se divide en **4 bloques** y cada bloque tiene un máximo de **100 puntos**.

## 📝 Actividades

### Tareas de cuaderno

- Tienen punteo.
- Tienen fecha y hora de apertura y cierre.
- Incluyen instrucciones/documento.
- Pueden solicitar respuestas dentro de la plataforma.
- Requieren fotografía del procedimiento cuando corresponda.
- Una vez entregadas, no se corrigen posteriormente.

### Tareas virtuales

- Se realizan dentro de Academia Nexora.
- Tienen punteo y calendario.
- No requieren fotografía del procedimiento.
- Podrán ser calificadas automáticamente por IA.

### Ejercicios

- Son actividades de práctica.
- No tienen punteo ni fecha límite.
- Se pueden corregir y volver a intentar.
- Algunos podrán convertirse en minijuegos educativos.

## 🔁 PMA

El PMA es un segundo intento opcional de una tarea. Conserva el mismo valor de puntos y Academia Nexora registra automáticamente como nota oficial la **más alta** entre ambos intentos.

## 🤖 Inteligencia artificial

Para la cuenta principal, una IA podrá actuar como profesor automático y crear clases/actividades según:

- progreso académico;
- temas estudiados;
- diagnóstico y fortalezas/debilidades;
- resultados anteriores;
- dificultad actual;
- calendario;
- puntos disponibles dentro del bloque.

Las reglas académicas importantes serán controladas por la plataforma y no dependerán únicamente de la IA.

## 👥 Usuarios y permisos

Academia Nexora usa **Supabase Auth**.

Al registrarse un usuario:

1. Supabase gestiona su identidad y contraseña.
2. Se crea automáticamente su registro en `profiles`.
3. Se asigna automáticamente `student` en `user_roles`.
4. Empieza en **Fundamentos · Año 1**.
5. Su tema inicial es **dark**.
6. Debe aceptar las reglas de Academia Nexora.
7. Después de confirmar el correo completa la bienvenida y solicita su primer curso.

Una cuenta puede tener varios roles: `student`, `teacher` y `admin`.

## 🔐 Seguridad

- Las tablas de usuarios, solicitudes, diagnósticos y avisos utilizan **Row Level Security (RLS)**.
- Los estudiantes solo pueden consultar sus propias solicitudes y datos permitidos.
- Las solicitudes de otros estudiantes y los avisos internos solo están disponibles para `admin`.
- Los usuarios pueden consultar sus propios roles, pero no asignarse permisos elevados.
- La web utiliza únicamente la **publishable key** de Supabase.
- `service_role` y otras claves privadas no se incluyen en el frontend.
- La Data API fue configurada sin exposición automática de tablas; los permisos del frontend se conceden explícitamente.
- La sesión se almacena en `sessionStorage`, no permanentemente en el navegador.

## 🏆 Logros e insignias

Los logros reconocerán aprendizaje, progreso y constancia sin castigar al usuario por no entrar todos los días. La plataforma debe motivar por contenido útil, no mediante presión o rachas molestas.

Está prevista una insignia especial al cumplir un año usando Academia Nexora, sin mostrar una cuenta regresiva constante hacia los 365 días.

## 🎓 Sistema académico

| Etapa | Años iniciales | Nota mínima |
|---|---|---:|
| 🌱 Fundamentos | 1–2 | 60/100 |
| 📘 Intermedio | 3–4 | 65/100 |
| 🧠 Avanzado | 5–6 | 70/100 |
| 🎓 Superior | 7–8 | 75/100 |
| 🏆 Dominio | 9–10 | 80/100 |

## 🛠️ Tecnología

- **Frontend:** Next.js + TypeScript + CSS.
- **Hosting:** GitHub Pages + GitHub Actions.
- **Base de datos / Auth / Storage:** Supabase.
- **Backend seguro:** Supabase Edge Functions.
- **IA futura:** OpenAI API desde backend seguro.

## 🚧 Próximos objetivos

1. Probar la primera cuenta real de principio a fin.
2. Convertir la cuenta principal en `student + teacher + admin`.
3. Implementar el catálogo persistente de materias y asignaciones.
4. Crear el contenido del primer diagnóstico real por materia.
5. Implementar los cursos de Formación esencial de los primeros 365 días.
6. Crear clases, tareas, entregas y calificaciones reales.
7. Añadir recuperación de contraseña.
8. Continuar con PMA, IA automática, insignias y minijuegos.

---

# 📒 Bitácora

## 30 de septiembre de 2026 — Inicio del proyecto

- Se creó Academia Nexora y su repositorio.
- Se definieron Cursos, Tareas, Calificaciones, Perfil y Administración.
- Se definieron tareas de cuaderno, tareas virtuales, ejercicios y PMA.
- Se definieron 4 bloques de 100 puntos y etapas académicas progresivas.
- Se creó la interfaz inicial con Next.js y TypeScript.
- Se eligió GitHub Pages y se configuró el despliegue automático.
- Se añadió modo oscuro y claro.
- Se creó y conectó Supabase.
- Se configuró Auth por correo/contraseña y confirmación por email.
- Se crearon `profiles` y `user_roles` con RLS.
- Se añadió registro, login, sesión, cierre de sesión y roles.

## 1 de octubre de 2026 — v0.3: onboarding y solicitudes

- Se separó formalmente el flujo de Login y Registro.
- Se incorporaron las reglas de Academia Nexora al registro y se guarda su aceptación.
- Se añadió una bienvenida para nuevas cuentas después de confirmar el correo.
- Se creó `course_requests` para solicitudes persistentes de materias.
- Se añadieron grado/nivel actual, autoevaluación y opción de diagnóstico.
- Se crearon `diagnostic_attempts` y `diagnostic_answers` como base del diagnóstico adaptativo.
- Se eliminó la opción **No sé** del diseño del diagnóstico; quedan únicamente **Siguiente** y **Mi límite**.
- Se creó `admin_notifications` y un trigger para avisar a Administración cada vez que llega una solicitud.
- Se restringieron solicitudes y avisos globales exclusivamente a administradores.
- Se añadieron estados de solicitud: Pendiente, En revisión y Atendida.
- Se añadió una sección permanente para solicitar cursos desde **Cursos**.
- Se añadieron recomendaciones iniciales de materias relacionadas.
- Se añadió un contador de avisos nuevos en Administración.
- Se configuraron permisos explícitos de la Data API y se mantuvo RLS.
- Supabase Security Advisor quedó sin avisos después de las migraciones.
- Se cambió la persistencia de Auth a `sessionStorage` para no conservar sesiones indefinidamente en el navegador.
- Se definió la Formación esencial obligatoria durante los primeros 365 días y opcional después.
- Se acordó que Academia Nexora motivará mediante aprendizaje y progreso real, evitando sistemas de presión similares a rachas obligatorias.

### Siguiente objetivo

Probar una primera cuenta real con el nuevo flujo completo: **Registro → reglas → confirmación → bienvenida → solicitud de curso → Administración**.

---

> Este README funciona como **resumen general del proyecto y bitácora de desarrollo** y debe mantenerse actualizado con cada cambio importante.
