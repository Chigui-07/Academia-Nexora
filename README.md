# 🎓 Academia Nexora

**Academia Nexora** es una plataforma educativa multiusuario pensada para aprender desde cero, avanzar por etapas académicas y combinar estudio, tareas, práctica, calificaciones, logros y actividades interactivas.

La plataforma tendrá un sistema académico propio. Las materias se mantienen a lo largo de los años y aumentan progresivamente en cantidad de temas, profundidad y dificultad.

## 📌 Estado del proyecto

**Fase actual:** diseño inicial e interfaz.

La base funcional y académica ya está definida. El siguiente objetivo es construir la primera interfaz y, posteriormente, conectar autenticación, base de datos, entregas, calificaciones e IA.

## 🧭 Menú principal

- **Cursos** — materias disponibles para cada usuario.
- **Tareas** — tareas activas de todas las materias según su fecha y hora de apertura/cierre.
- **Calificaciones** — notas por materia, bloque y promedio general.
- **Perfil** — progreso, etapa, año, logros e insignias.
- **Administración** — disponible únicamente para usuarios con permisos administrativos.

## 📚 Estructura de cada curso

Cada curso tendrá:

- Tareas
- Ejercicios
- Calificaciones

Cada materia se divide en **4 bloques** y cada bloque tiene un máximo de **100 puntos**.

## 📝 Actividades

### Tareas de cuaderno

- Tienen punteo.
- Tienen fecha y hora de apertura y cierre.
- Incluyen instrucciones/documento.
- Pueden solicitar respuestas dentro de la plataforma.
- Requieren subir una fotografía del procedimiento cuando corresponda.
- Una vez entregadas, no se corrigen posteriormente.

### Tareas virtuales

- Se realizan completamente dentro de Academia Nexora.
- Tienen punteo y calendario.
- No requieren fotografía del procedimiento.
- Pueden ser calificadas automáticamente por IA.

### Ejercicios

- Son actividades de práctica.
- No tienen punteo ni fecha límite.
- Se pueden corregir y volver a intentar.
- Algunos ejercicios podrán convertirse en **minijuegos educativos**.

## 🔁 PMA

El PMA no es una actividad independiente. Algunas tareas pueden habilitar un **segundo intento** con el mismo valor de la tarea original.

La plataforma conserva ambas calificaciones y registra automáticamente como nota oficial la **más alta**.

## 🤖 Inteligencia artificial

Para la cuenta principal, una IA podrá actuar como profesor automático y crear actividades según:

- progreso académico;
- temas estudiados;
- resultados anteriores;
- dificultad actual;
- calendario;
- puntos disponibles dentro del bloque.

La IA también podrá ayudar a calificar tareas virtuales asignadas a otros usuarios.

Las reglas importantes, como el máximo de 100 puntos por bloque, serán controladas por la plataforma y no dependerán únicamente de la IA.

## 👥 Usuarios y permisos

La plataforma requerirá iniciar sesión para guardar el progreso individual.

### Estudiante

Puede realizar actividades, consultar cursos, calificaciones, progreso y logros.

### Administrador / Profesor

Puede crear materias, tareas de cuaderno, tareas virtuales, ejercicios, calendarios, PMA y asignar actividades a otros usuarios.

La cuenta principal tendrá permisos de **estudiante + profesor + administrador**.

## 🏆 Logros e insignias

Academia Nexora contará con logros opcionales para reconocer progreso, constancia y resultados especiales. Algunos podrán mostrarse públicamente en el perfil del estudiante.

## 🎓 Sistema académico

La progresión se divide en etapas con varios años escolares.

| Etapa | Años iniciales | Nota mínima |
|---|---|---:|
| 🌱 Fundamentos | 1–2 | 60/100 |
| 📘 Intermedio | 3–4 | 65/100 |
| 🧠 Avanzado | 5–6 | 70/100 |
| 🎓 Superior | 7–8 | 75/100 |
| 🏆 Dominio | 9–10 | 80/100 |

La cantidad de etapas y años podrá ampliarse en el futuro.

## 🛠️ Tecnología propuesta

- **Frontend:** Next.js
- **Base de datos / Auth / Storage:** Supabase
- **IA:** OpenAI API
- **Despliegue:** Vercel

La arquitectura definitiva podrá ajustarse durante el desarrollo.

## 🚧 Primera versión

La primera versión funcional debe priorizar:

1. Registro e inicio de sesión.
2. Inicio / Dashboard.
3. Cursos.
4. Tareas.
5. Resolución de tareas virtuales.
6. Entregas.
7. Calificaciones.
8. Panel básico de administración.

Después se añadirán PMA, IA automática, ejercicios avanzados, imágenes de procedimientos, insignias y minijuegos.

---

# 📒 Bitácora

## 30 de septiembre de 2026 — Inicio del proyecto

- Se creó el repositorio de **Academia Nexora**.
- Se definió la idea general de una plataforma educativa multiusuario.
- Se estableció el menú principal: Cursos, Tareas y Calificaciones.
- Se definieron tareas de cuaderno, tareas virtuales y ejercicios.
- Se creó el sistema de PMA como segundo intento que conserva la nota más alta.
- Se definió el sistema de 4 bloques de 100 puntos por materia.
- Se establecieron etapas académicas progresivas.
- Se decidió exigir cuentas de usuario para conservar el progreso.
- Se definieron permisos de estudiante, profesor y administrador.
- Se añadió la idea de un profesor IA automático para la cuenta principal.
- Se añadieron logros, insignias y ejercicios opcionales en formato de minijuego.
- Comienza la fase de diseño de interfaz.

---

> Este README funciona como **resumen general del proyecto y bitácora de desarrollo**. Debe mantenerse actualizado con cada cambio importante.
