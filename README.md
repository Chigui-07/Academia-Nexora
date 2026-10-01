# 🎓 Academia Nexora

**Academia Nexora** es una plataforma educativa multiusuario pensada para aprender desde cero, avanzar por etapas académicas y combinar estudio, tareas, práctica, calificaciones, logros y actividades interactivas.

La plataforma tendrá un sistema académico propio. Las materias se mantienen a lo largo de los años y aumentan progresivamente en cantidad de temas, profundidad y dificultad.

## 📌 Estado del proyecto

**Fase actual:** interfaz inicial v0.1.

Ya existe una primera interfaz navegable en la rama `feat/base-interface`. Esta versión utiliza datos de demostración y todavía no incluye autenticación real, base de datos ni IA.

## 🖥️ Interfaz v0.1

Actualmente incluye:

- Pantalla inicial de acceso / demostración.
- Dashboard principal.
- Cursos.
- Tareas semanales.
- Calificaciones.
- Perfil y futura zona de insignias.
- Panel de administración.
- Navegación compartida entre las principales secciones.
- Diseño adaptable básico para escritorio y pantallas pequeñas.

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

- **Frontend:** Next.js + TypeScript + CSS.
- **Hosting del frontend:** GitHub Pages mediante exportación estática y GitHub Actions.
- **Base de datos / Auth / Storage:** Supabase.
- **Backend y automatizaciones:** Supabase Edge Functions y servicios asociados.
- **IA:** OpenAI API, llamada únicamente desde backend seguro.

GitHub Pages alojará la interfaz pública. Las funciones que requieran servidor, autenticación sensible o claves privadas no se ejecutarán en Pages; se delegarán a Supabase.

## 🚀 Despliegue web

La rama incluye configuración para exportar Next.js como sitio estático y un workflow en `.github/workflows/deploy-pages.yml`.

Cuando los cambios lleguen a `main`, GitHub Actions podrá construir el directorio `out` y publicarlo en GitHub Pages.

## 🚧 Primera versión funcional

La primera versión debe priorizar:

1. Registro e inicio de sesión reales.
2. Dashboard conectado a datos del usuario.
3. Creación y asignación de cursos.
4. Creación de tareas.
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
- Se creó la rama `feat/base-interface`.
- Se inició el proyecto con Next.js y TypeScript.
- Se creó la primera identidad visual de Academia Nexora.
- Se implementó una pantalla inicial de acceso de demostración.
- Se implementó el dashboard de Fundamentos · Año 1.
- Se añadieron las pantallas de Cursos, Tareas, Calificaciones, Perfil y Administración.
- Se añadió navegación compartida y diseño adaptable básico.
- Se eligió **GitHub Pages** como hosting del frontend público.
- Se configuró Next.js para exportación estática.
- Se añadió un workflow de GitHub Actions para construir y desplegar la web en Pages desde `main`.
- Se decidió mantener las funciones de servidor, autenticación sensible e IA fuera de GitHub Pages mediante Supabase.

### Siguiente objetivo

Revisar la interfaz publicada y después conectar **Supabase Auth** para habilitar cuentas reales y usuarios persistentes.

---

> Este README funciona como **resumen general del proyecto y bitácora de desarrollo**. Debe mantenerse actualizado con cada cambio importante.
