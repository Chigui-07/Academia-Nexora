# 🎓 Academia Nexora

**Academia Nexora** es una plataforma educativa multiusuario pensada para aprender desde cero, avanzar por etapas académicas y combinar clases, tareas, ejercicios, calificaciones, diagnósticos, logros y actividades interactivas.

La plataforma utiliza un sistema académico propio. Las materias continúan a lo largo de los años y aumentan progresivamente en cantidad de temas, profundidad y dificultad.

## 📌 Estado del proyecto

**Fase actual:** v0.6 — Resultado e historial de diagnósticos.

La interfaz está publicada mediante GitHub Pages y utiliza Supabase para autenticación y datos. Ya existen registro, confirmación por correo, inicio/cierre de sesión, perfiles, roles, onboarding, identidad académica, solicitudes persistentes de cursos, banco de diagnóstico de Matemática, diagnóstico funcional y resultados persistentes.

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
- Menú con Inicio, Cursos, **Diagnósticos**, Tareas, Calificaciones, Perfil y Administración cuando corresponde.
- Modo oscuro por defecto y modo claro opcional.

## 👤 Identidad académica

Cada usuario tiene tres elementos distintos:

- **Nombre y apellido reales** — se usan en tareas, calificaciones, registros y espacios profesionales.
- **Carné Nexora** — identificador único y permanente con formato similar a `NXR-26-4K7P`.
- **Nombre de usuario** — elemento personal del perfil; puede ser un apodo o sobrenombre.

El carné se genera automáticamente al crear la cuenta, no puede ser modificado por el estudiante y no sirve como contraseña ni como método de inicio de sesión. En vistas administrativas se utiliza **nombre real + carné**.

## 🔐 Cuenta y contraseña

Durante el registro se recuerda al usuario que debe **guardar y recordar su contraseña**, porque la necesita para volver a iniciar sesión. También se recomienda no compartirla y utilizar un gestor de contraseñas si dispone de uno.

Después de crear una cuenta, el mensaje de confirmación vuelve a recordar que la contraseña será necesaria para entrar posteriormente.

## 📚 Solicitudes de cursos

Cada estudiante puede solicitar cursos desde la bienvenida inicial o desde **Cursos**. Por cada solicitud se guarda:

- curso solicitado;
- grado o nivel actual;
- nivel que el estudiante cree tener;
- si desea realizar el diagnóstico opcional;
- estado: `Pendiente`, `En revisión` o `Atendida`.

Una solicitud no crea ni asigna automáticamente una materia. Administración debe revisarla.

## 🧠 Diagnóstico inicial

El diagnóstico es **opcional**, no da puntos y no representa una calificación académica. Su objetivo es encontrar el mejor punto desde donde comenzar a enseñar una materia.

### Regla de un solo intento

El diagnóstico inicial de una materia se realiza **una sola vez**.

- Si el usuario cierra la página mientras está en progreso, puede continuar el mismo intento más tarde.
- Las preguntas sorteadas quedan guardadas para que no cambien al volver.
- Una vez terminado como `completed` o `limit_reached`, no puede crear otro intento de esa materia.
- Pulsar **Mi límite** termina el diagnóstico y registra el nivel en el que el estudiante decidió detenerse.

### Interfaz de preguntas

La primera interfaz funcional está implementada para Matemática:

- se muestra **una pregunta a la vez**;
- la pregunta aparece dentro de una tarjeta con estilo de hoja/cuaderno;
- a la izquierda aparece un navegador con pequeñas tarjetas numeradas;
- tocar un número permite volver a una pregunta del nivel actual;
- las preguntas ya respondidas cambian visualmente de estado;
- el usuario puede escribir su respuesta y pulsar **Siguiente**;
- **Mi límite** está disponible en cualquier momento;
- no se muestra durante la prueba si una respuesta fue correcta o incorrecta;
- al cambiar de pregunta, una respuesta escrita puede guardarse sin avanzar de nivel.

Para evitar una columna con hasta 64 números, el navegador muestra únicamente las preguntas del **nivel actual**. Al terminar un nivel, se cargan las preguntas del siguiente.

### Banco permanente de Matemática

El banco de Matemática contiene **194 preguntas permanentes**:

| Nivel | Contenido | Banco | Selección por intento |
|---|---|---:|---:|
| 1 | Operaciones básicas y problemas | 44 | 14 |
| 2 | Números negativos, fracciones y decimales | 36 | 12 |
| 3 | Proporciones, porcentajes y conversiones | 30 | 10 |
| 4 | Álgebra básica | 30 | 10 |
| 5 | Álgebra intermedia y geometría | 30 | 10 |
| 6 | Razonamiento avanzado | 24 | 8 |
| **Total** |  | **194** | **64 máximo** |

Las preguntas se dividen en grupos internos para que la selección sea equilibrada y no dependa de azar sin control.

### Resultado de colocación

Al terminar Matemática se genera automáticamente un resultado persistente. El cálculo utiliza un umbral de referencia del **70 %** para considerar dominado un nivel completo.

El resultado guarda:

- **ubicación estimada**: primer nivel que todavía necesita refuerzo;
- nivel hasta el que existe una base dominada de forma consecutiva;
- temas que el diagnóstico detectó como dominados;
- temas que conviene reforzar;
- resumen por nivel con respuestas, aciertos y porcentaje;
- si el diagnóstico terminó normalmente o mediante **Mi límite**.

Si todos los niveles alcanzan el criterio de dominio, la ubicación queda en Nivel 6 y se registra que la base del diagnóstico completo fue dominada.

### Historial de Diagnósticos

El menú principal incluye **🧠 Diagnósticos**. Esta sección funciona como una fotografía del punto de partida del estudiante:

- muestra diagnósticos en progreso y permite continuarlos;
- conserva permanentemente los resultados finalizados;
- recuerda qué temas dominaba el usuario cuando comenzó;
- recuerda qué temas necesitaba reforzar;
- permite desplegar el detalle de cómo le fue en cada nivel.

La idea es que, meses después, el estudiante pueda mirar el diagnóstico original y reconocer temas que antes no sabía o no recordaba y que ahora ya domina.

### Motor del diagnóstico

Supabase contiene:

- `diagnostic_levels` — niveles del diagnóstico;
- `diagnostic_question_pools` — grupos y cantidad de preguntas a escoger;
- `diagnostic_questions` — banco permanente;
- `diagnostic_attempts` — intento único de cada estudiante por materia;
- `diagnostic_attempt_questions` — preguntas sorteadas y orden fijo de cada intento;
- `diagnostic_answers` — respuestas realizadas;
- `diagnostic_results` — fotografía persistente del resultado final.

El motor dispone de RPC para iniciar o recuperar el intento, obtener preguntas del nivel actual, guardar respuestas, avanzar con **Siguiente** y finalizar con **Mi límite**. La creación del resultado ocurre dentro de la lógica segura de Supabase cuando el intento termina.

### Seguridad del diagnóstico

- El frontend puede leer los enunciados necesarios, pero no `answer_key`.
- La respuesta correcta se compara mediante lógica privilegiada aislada en Supabase.
- Los RPC públicos se ejecutan como `SECURITY INVOKER`; las operaciones privilegiadas están aisladas fuera del esquema público expuesto.
- El estudiante no tiene permisos directos para insertar/modificar intentos ni para escribir `is_correct`.
- El estudiante tampoco puede consultar directamente `is_correct` durante la prueba.
- `diagnostic_results` permite al estudiante leer su propio resumen, pero no modificarlo.
- RLS limita intentos, preguntas seleccionadas, respuestas y resultados al usuario correspondiente.

## 🌱 Formación esencial

Durante los primeros **365 días** de una cuenta se planea incluir cursos base obligatorios:

- Caligrafía y escritura clara.
- Comprensión y expresión lectora.
- Ortografía y redacción.
- Cálculo mental y agilidad numérica.
- Lógica y razonamiento.
- Organización y hábitos de estudio.

Después del primer año dejarán de ser obligatorios y el usuario decidirá cuáles desea continuar. No se utilizarán rachas que castiguen al estudiante por no entrar todos los días.

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
- **Backend seguro:** Supabase PostgreSQL/RPC y futuras Edge Functions.
- **IA futura:** OpenAI API desde backend seguro.

## 🚧 Próximos objetivos

1. Probar el diagnóstico completo y su resultado con la primera cuenta real.
2. Convertir la cuenta principal en `student + teacher + admin`.
3. Implementar el catálogo persistente de materias y asignaciones.
4. Usar el resultado del diagnóstico para decidir el primer tema de cada curso.
5. Implementar Formación esencial.
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
- El Nivel 1 quedó con 44 preguntas y se equilibraron multiplicaciones, divisiones y operaciones combinadas.
- Cada nivel define cuántas preguntas se extraen de cada grupo.
- Las respuestas correctas permanecen en Supabase sin permiso de lectura para el frontend autenticado.

## 1 de octubre de 2026 — v0.5: diagnóstico funcional

- Se cambió la regla del diagnóstico para permitir **un solo intento por materia**.
- Un intento en progreso puede continuarse, pero uno terminado no puede repetirse.
- Se creó `diagnostic_attempt_questions` para conservar las preguntas sorteadas y su orden.
- Se implementó la selección equilibrada de preguntas del banco.
- Se creó una interfaz con estilo de hoja/cuaderno y una pregunta a la vez.
- Se añadió el panel lateral de números para navegar entre preguntas del nivel actual.
- Las preguntas respondidas muestran un estado visual diferente.
- Se implementaron **Siguiente** y **Mi límite**.
- Las respuestas se pueden guardar al navegar sin mostrar si son correctas.
- Se creó un acceso al diagnóstico desde la sección **Cursos** cuando existe una solicitud de Matemática con diagnóstico activado.
- Se endurecieron permisos para que el frontend no pueda modificar directamente intentos ni consultar `is_correct`.
- La lógica privilegiada quedó aislada de los RPC públicos.

## 1 de octubre de 2026 — v0.6: resultado e historial

- Se creó `diagnostic_results` para conservar una fotografía permanente del diagnóstico inicial.
- Se definió un criterio del **70 %** para considerar dominado un nivel completo.
- El sistema calcula la primera zona que necesita refuerzo y la usa como ubicación estimada.
- Se guardan temas dominados, temas a reforzar y un resumen por nivel.
- El resultado se genera automáticamente tanto al completar los seis niveles como al pulsar **Mi límite**.
- La pantalla final muestra la ubicación estimada y los temas detectados.
- Se añadió **Diagnósticos** al menú principal.
- La nueva sección permite revisar resultados antiguos y continuar intentos que siguen abiertos.
- El diagnóstico completado desde Cursos ahora enlaza al historial en vez de quedar como un botón deshabilitado.
- El estudiante puede leer su resultado, pero no modificarlo.

### Siguiente objetivo

Probar el flujo completo con la primera cuenta real y utilizar el resultado para elegir automáticamente el primer contenido de Matemática.

---

> Este README funciona como **resumen general del proyecto y bitácora de desarrollo** y debe mantenerse actualizado con cada cambio importante.
