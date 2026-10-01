# 🎓 Academia Nexora

**Academia Nexora** es una plataforma educativa multiusuario pensada para aprender desde cero, avanzar por etapas académicas y combinar estudio, tareas, práctica, calificaciones, logros y actividades interactivas.

La plataforma tendrá un sistema académico propio. Las materias se mantienen a lo largo de los años y aumentan progresivamente en cantidad de temas, profundidad y dificultad.

## 📌 Estado del proyecto

**Fase actual:** v0.2 — Cuentas y usuarios.

La interfaz base ya está publicada en GitHub Pages y el proyecto de Supabase ya está conectado. La rama `feat/auth` incorpora registro, inicio de sesión, confirmación por correo, perfiles persistentes, roles y cierre de sesión.

## 🖥️ Interfaz actual

Incluye:

- Inicio de sesión real.
- Registro de usuarios.
- Confirmación de correo mediante Supabase Auth.
- Dashboard protegido por sesión.
- Cursos.
- Tareas semanales.
- Calificaciones.
- Perfil y futura zona de insignias.
- Panel de administración visible solo para roles autorizados.
- Navegación compartida entre las principales secciones.
- Diseño adaptable básico.
- Modo oscuro por defecto y modo claro opcional.
- Preferencia de tema guardada localmente y sincronizada con el perfil cuando hay sesión.

## 🧭 Menú principal

- **Cursos** — materias disponibles para cada usuario.
- **Tareas** — tareas activas de todas las materias según su fecha y hora de apertura/cierre.
- **Calificaciones** — notas por materia, bloque y promedio general.
- **Perfil** — progreso, etapa, año, logros e insignias.
- **Administración** — disponible únicamente para usuarios con rol de profesor o administrador.

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

Academia Nexora usa **Supabase Auth** para las cuentas.

Al registrarse un usuario:

1. Supabase guarda su identidad y credenciales de forma segura.
2. Se crea automáticamente un registro en `profiles`.
3. Se asigna automáticamente el rol `student` en `user_roles`.
4. Empieza en **Fundamentos · Año 1**.
5. Su tema inicial es **dark**.

### Estudiante

Puede realizar actividades, consultar cursos, calificaciones, progreso y logros.

### Profesor

Puede gestionar actividades de los estudiantes cuando se habilite el módulo correspondiente.

### Administrador

Puede gestionar materias, usuarios, tareas, ejercicios, calendarios, PMA y configuración académica.

Una misma cuenta puede tener varios roles.

## 🔐 Seguridad

- Las tablas `profiles` y `user_roles` tienen **Row Level Security (RLS)**.
- Cada estudiante solo puede consultar y modificar su propio perfil.
- Los usuarios pueden consultar sus propios roles, pero no asignarse roles elevados.
- La clave utilizada por el frontend es únicamente la **publishable key** de Supabase.
- Las claves privadas y `service_role` no se almacenan en el frontend.

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

## 🛠️ Tecnología

- **Frontend:** Next.js + TypeScript + CSS.
- **Hosting del frontend:** GitHub Pages mediante exportación estática y GitHub Actions.
- **Base de datos / Auth / Storage:** Supabase.
- **Backend y automatizaciones:** Supabase Edge Functions y servicios asociados.
- **IA:** OpenAI API desde backend seguro.

GitHub Pages aloja la interfaz pública. Las funciones que requieran servidor, autenticación sensible o claves privadas se delegarán a Supabase.

## 🚀 Despliegue web

La aplicación está configurada para exportar Next.js como sitio estático y desplegarlo mediante `.github/workflows/deploy-pages.yml`.

Cuando los cambios llegan a `main`, GitHub Actions construye el directorio `out` y lo publica en GitHub Pages.

## 🚧 Próximos objetivos

1. Probar el flujo completo de registro y confirmación de correo.
2. Asignar permisos de profesor y administrador a la cuenta principal.
3. Crear materias persistentes.
4. Crear asignación de cursos por usuario.
5. Crear tareas reales.
6. Implementar entregas y calificaciones.
7. Añadir recuperación de contraseña.
8. Continuar con PMA, IA automática, imágenes de procedimiento, insignias y minijuegos.

---

# 📒 Bitácora

## 30 de septiembre de 2026 — Inicio del proyecto

- Se creó el repositorio de **Academia Nexora**.
- Se definió la idea general de una plataforma educativa multiusuario.
- Se estableció el menú principal y el sistema académico.
- Se definieron tareas de cuaderno, tareas virtuales, ejercicios y PMA.
- Se definieron 4 bloques de 100 puntos por materia y etapas académicas progresivas.
- Se establecieron roles de estudiante, profesor y administrador.
- Se añadieron ideas de profesor IA, logros, insignias y minijuegos educativos.
- Se creó la primera interfaz con Next.js y TypeScript.
- Se publicaron Dashboard, Cursos, Tareas, Calificaciones, Perfil y Administración.
- Se eligió GitHub Pages como hosting del frontend.
- Se configuró el despliegue automático mediante GitHub Actions.
- Se añadió modo oscuro y claro con persistencia.
- Se creó el proyecto **Academia Nexora** en Supabase.
- Se configuró Supabase Auth con correo y contraseña y confirmación por email.
- Se configuraron las URLs de producción y desarrollo local.
- Se crearon las tablas `profiles` y `user_roles` con RLS.
- Se añadió un trigger que crea automáticamente perfil y rol `student` al registrarse.
- Se estableció `dark` como tema inicial de nuevas cuentas.
- Se revisó la configuración con Supabase Security Advisor y se corrigieron los avisos detectados.
- Se creó la rama `feat/auth`.
- Se conectó el frontend con la publishable key de Supabase.
- Se sustituyó el acceso de demostración por registro e inicio de sesión reales.
- Se añadió confirmación de correo, sesión persistente y cierre de sesión.
- Se restringió el panel de administración según roles.
- El modo visual elegido ahora también puede sincronizarse con el perfil del usuario.

### Siguiente objetivo

Probar una primera cuenta real de principio a fin y convertir la cuenta principal en **estudiante + profesor + administrador**.

---

> Este README funciona como **resumen general del proyecto y bitácora de desarrollo**. Debe mantenerse actualizado con cada cambio importante.
