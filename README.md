# 🎓 Academia Nexora

**Academia Nexora** es una plataforma educativa multiusuario pensada para aprender desde cero, avanzar por etapas académicas y combinar clases, tareas, práctica, calificaciones, diagnósticos, logros y actividades interactivas.

La plataforma tendrá un sistema académico propio. Las materias continúan a lo largo de los años y aumentan progresivamente en cantidad de temas, profundidad y dificultad.

## 📌 Estado del proyecto

**Fase actual:** v0.4 — Identidad académica y primer banco de diagnóstico.

La interfaz está publicada mediante GitHub Pages y utiliza Supabase para autenticación y datos. Ya existen registro, confirmación por correo, inicio/cierre de sesión, perfiles, roles, onboarding, identidad académica, solicitudes persistentes de cursos y el primer banco permanente de diagnóstico de Matemática.

## 🖥️ Interfaz actual

Incluye:

- Inicio de sesión real y registro separado.
- Nombre y apellido reales obligatorios como identidad académica.
- Nombre de usuario único y personal/decorativo, donde sí se permiten apodos o sobrenombres.
- Carné Nexora único y permanente generado automáticamente para cada cuenta.
- Aviso durante el registro para guardar y recordar la contraseña.
- Reglas de Academia Nexora aceptadas durante el registro.
- Confirmación de correo mediante Supabase Auth.
- Sesión almacenada durante la sesión del navegador mediante `sessionStorage`.
- Dashboard protegido y bienvenida obligatoria para cuentas nuevas.
- Solicitudes persistentes de cursos con grado/nivel, autoevaluación y diagnóstico opcional.
- Recomendaciones básicas de cursos relacionados.
- Cola y avisos privados de solicitudes para Administración.
- Cursos, Tareas, Calificaciones, Perfil y Administración.
- Modo oscuro por defecto y modo claro opcional.

## 👤 Identidad académica

Cada usuario tiene tres elementos distintos:

- **Nombre y apellido reales** — se usan en tareas, calificaciones, registros y espacios profesionales.
- **Carné Nexora** — identificador único y permanente con formato similar a `NXR-26-4K7P`.
- **Nombre de usuario** — elemento personal del perfil; puede ser un apodo o sobrenombre.

El carné se genera automáticamente al crear la cuenta, no puede ser modificado por el estudiante y no sirve como contraseña ni como método de inicio de sesión. En vistas administrativas se utiliza **nombre real + carné** para evitar confusiones entre usuarios con nombres iguales.

## 🔐 Cuenta y contraseña

Durante el registro se recuerda al usuario que debe **guardar y recordar su contraseña**, porque la necesita para volver a iniciar sesión. También se recomienda no compartirla y usar un gestor de contraseñas si dispone de uno.

Después de crear una cuenta, el mensaje de confirmación vuelve a recordar que la contraseña será necesaria para entrar posteriormente.

## 📚 Solicitudes de cursos

Cada estudiante puede solicitar cursos desde la bienvenida inicial o desde **Cursos**. Por cada solicitud se guarda:

- curso solicitado;
- grado o nivel actual;
- nivel que el estudiante cree tener;
- si desea realizar el diagnóstico opcional;
- estado: `Pendiente`, `En revisión` o `Atendida`.

Una solicitud **no crea ni asigna automáticamente** una materia. Administración debe revisarla.

## 🧠 Diagnóstico inicial

El diagnóstico es **opcional** y no representa una calificación académica. Su objetivo es encontrar el punto adecuado desde donde comenzar a enseñar una materia.

La experiencia tendrá únicamente dos acciones principales:

- **Siguiente** — guardar la respuesta y continuar.
- **Mi límite** — terminar cuando el estudiante considera que ya no sabe continuar.

`Mi límite` no resta puntos ni cuenta como error. Durante el diagnóstico no es necesario mostrar inmediatamente si cada respuesta fue correcta o incorrecta; el análisis se presenta al terminar.

### Banco permanente de Matemática

Ya existe en Supabase el primer banco permanente de diagnóstico:

| Nivel | Contenido | Banco | Selección por intento |
|---|---|---:|---:|
| 1 | Operaciones básicas y problemas | 44 | 14 |
| 2 | Números negativos, fracciones y decimales | 36 | 12 |
| 3 | Proporciones, porcentajes y conversiones | 30 | 10 |
| 4 | Álgebra básica | 30 | 10 |
| 5 | Álgebra intermedia y geometría | 30 | 10 |
| 6 | Razonamiento avanzado | 24 | 8 |
| **Total** |  | **194** | **64 máximo si completa todos los niveles** |

Las preguntas se dividen en grupos internos para que la selección no sea aleatoria sin control. Por ejemplo, en el Nivel 1 se garantiza una combinación de suma, resta, operaciones combinadas, multiplicación, división y problemas.

Las preguntas permanecen guardadas y pueden reutilizarse en futuros intentos; cada intento seleccionará un subconjunto equilibrado del banco.

### Seguridad del banco

- Las preguntas y metadatos necesarios pueden ser consultados por el frontend autenticado.
- **Las respuestas correctas (`answer_key`) no tienen permiso de lectura para el usuario autenticado.**
- Las respuestas del estudiante se guardarán en sus intentos de diagnóstico.
- La calificación debe realizarse mediante lógica segura, sin enviar la clave de respuestas al navegador.
- El banco completo con respuestas no se mantiene como documento público en GitHub.

La base de datos ya contiene `diagnostic_levels`, `diagnostic_question_pools`, `diagnostic_questions`, `diagnostic_attempts` y `diagnostic_answers`. El siguiente paso es conectar este banco con la interfaz y el motor real del diagnóstico.

## 🌱 Formación esencial

Durante los primeros **365 días** de una cuenta se planea incluir cursos base obligatorios:

- Caligrafía y escritura clara.
- Comprensión y expresión lectora.
- Ortografía y redacción.
- Cálculo mental y agilidad numérica.
- Lógica y razonamiento.
- Organización y hábitos de estudio.

Después del primer año dejarán de ser obligatorios y el usuario decidirá cuáles desea continuar. No se mostrará una cuenta regresiva constante de días ni se usarán rachas que presionen al estudiante.

## 📚 Estructura de cada curso

Cada curso tendrá:

- clases y explicaciones;
- tareas;
- ejercicios;
- calificaciones.

Cada materia se divide en **4 bloques** y cada bloque tiene un máximo de **100 puntos**.

## 📝 Actividades

### Tareas de cuaderno

- Tienen punteo y fecha/hora de apertura y cierre.
- Incluyen instrucciones/documentos.
- Pueden solicitar respuestas dentro de la plataforma.
- Requieren fotografía del procedimiento cuando corresponda.
- Una vez entregadas, no se corrigen posteriormente.

### Tareas virtuales

- Se realizan dentro de Academia Nexora.
- Tienen punteo y calendario.
- No requieren fotografía del procedimiento.
- Podrán ser calificadas automáticamente mediante lógica segura/IA.

### Ejercicios

- Son de práctica y no tienen punteo ni fecha límite.
- Se pueden corregir y volver a intentar.
- Algunos podrán convertirse en minijuegos educativos.

## 🔁 PMA

El PMA es un segundo intento opcional de una tarea. Conserva el mismo valor de puntos y Academia Nexora registra automáticamente como nota oficial la **más alta** entre ambos intentos.

## 🤖 Inteligencia artificial

Para la cuenta principal, una IA podrá actuar como profesor automático y crear clases/actividades según progreso, diagnóstico, resultados anteriores, dificultad, calendario y puntos disponibles. Las reglas académicas importantes serán controladas por la plataforma y no dependerán únicamente de la IA.

## 👥 Usuarios y permisos

Academia Nexora usa **Supabase Auth**. Al registrarse un usuario:

1. escribe nombre y apellido reales;
2. elige un nombre de usuario único;
3. crea correo y contraseña;
4. acepta las reglas;
5. Supabase crea su identidad;
6. se crea su perfil y Carné Nexora;
7. recibe el rol `student`;
8. comienza en **Fundamentos · Año 1**;
9. usa tema oscuro inicialmente;
10. confirma su correo y completa el onboarding.

Una cuenta puede tener varios roles: `student`, `teacher` y `admin`.

## 🔐 Seguridad

- Row Level Security (RLS) en las tablas que contienen datos de usuarios y flujos académicos.
- Los estudiantes solo consultan sus propios datos permitidos.
- Solicitudes globales y avisos internos son exclusivos de `admin`.
- Los usuarios no pueden asignarse permisos elevados.
- El Carné Nexora no es editable por usuarios normales.
- El frontend utiliza únicamente la **publishable key** de Supabase.
- `service_role` y otras claves privadas no se incluyen en GitHub Pages.
- Los permisos de Data API se conceden explícitamente.
- Las claves de respuestas de los diagnósticos no están disponibles para el frontend autenticado.

## 🏆 Sistema académico

| Etapa | Años | Nota mínima |
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

1. Crear el **motor del diagnóstico de Matemática** que seleccione preguntas equilibradas desde el banco.
2. Implementar la pantalla de pregunta con **Siguiente** y **Mi límite**.
3. Guardar los intentos y respuestas reales del estudiante.
4. Calificar desde lógica segura y generar el resultado de colocación.
5. Probar la primera cuenta real y convertir la cuenta principal en `student + teacher + admin`.
6. Implementar el catálogo persistente de materias y asignaciones.
7. Crear Formación esencial, clases, tareas, entregas y calificaciones.
8. Añadir recuperación de contraseña.
9. Continuar con PMA, IA automática, insignias y minijuegos.

---

# 📒 Bitácora

## 30 de septiembre de 2026 — Inicio del proyecto

- Se creó Academia Nexora y su repositorio.
- Se definieron Cursos, Tareas, Calificaciones, Perfil y Administración.
- Se definieron tareas de cuaderno, tareas virtuales, ejercicios y PMA.
- Se definieron 4 bloques de 100 puntos y etapas académicas progresivas.
- Se creó la interfaz inicial con Next.js y TypeScript.
- Se eligió GitHub Pages y se configuró el despliegue automático.
- Se creó y conectó Supabase.
- Se configuró autenticación, perfiles y roles.

## 1 de octubre de 2026 — v0.3: onboarding e identidad

- Se separó Login y Registro.
- Se añadieron reglas de Academia Nexora.
- Nombre y apellido reales pasaron a ser obligatorios.
- El nombre de usuario quedó como elemento personal/decorativo.
- Se creó el Carné Nexora único y permanente.
- Se añadió onboarding y solicitudes persistentes de cursos.
- Se preparó la estructura inicial de diagnósticos.
- Se crearon avisos privados para Administración.
- Se configuró `sessionStorage` para la sesión del navegador.
- Se definió Formación esencial para los primeros 365 días.

## 1 de octubre de 2026 — v0.4: banco de diagnóstico de Matemática

- Se añadió al registro un aviso explícito para **guardar y recordar la contraseña**.
- Se creó la estructura persistente de niveles, grupos y preguntas de diagnóstico.
- Se creó el banco completo de Matemática con **194 preguntas permanentes** distribuidas en 6 niveles.
- El Nivel 1 quedó con 44 preguntas: 10 de suma/resta, 25 de multiplicación/división/combinadas y 9 problemas.
- Se equilibró el bloque del Nivel 1 en **8 multiplicaciones, 8 divisiones y 9 operaciones combinadas** dentro de sus grupos correspondientes.
- Los niveles 2–6 cubren números/fracciones, proporciones, álgebra, geometría y razonamiento avanzado.
- Cada nivel define cuántas preguntas se extraen de cada grupo para mantener una prueba equilibrada.
- Las respuestas correctas permanecen en Supabase pero **no pueden ser consultadas por el frontend autenticado**.
- Se comprobó que el banco mantiene exactamente 44, 36, 30, 30, 30 y 24 preguntas por nivel.
- Supabase Security Advisor se mantiene sin avisos de seguridad.

### Siguiente objetivo

Convertir este banco en un diagnóstico funcional: **selección de preguntas → respuesta → Siguiente / Mi límite → evaluación segura → resultado de colocación**.

---

> Este README funciona como **resumen general del proyecto y bitácora de desarrollo** y debe mantenerse actualizado con cada cambio importante.
