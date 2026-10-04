"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import StudentActivityList from "@/components/StudentActivityList";
import StudentCourseGrades from "@/components/StudentCourseGrades";
import StudentExerciseSheetList from "@/components/StudentExerciseSheetList";
import StudentLessonList from "@/components/StudentLessonList";
import { goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";

type Tab = "resumen" | "clases" | "tareas" | "ejercicios" | "hoja-ejercicios" | "calificaciones";

type Course = {
  id: string;
  course_key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  is_essential?: boolean;
};

type Enrollment = {
  id: string;
  required_until: string | null;
};

type EssentialAreaEnrollment = Enrollment & {
  courses: Course | null;
};

const tabs: { key: Tab; label: string }[] = [
  { key: "resumen", label: "Resumen" },
  { key: "clases", label: "Clases" },
  { key: "tareas", label: "Tareas" },
  { key: "ejercicios", label: "Ejercicios" },
  { key: "hoja-ejercicios", label: "Hoja de ejercicios" },
  { key: "calificaciones", label: "Calificaciones" },
];

function formatRequiredUntil(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function isExpired(value: string | null) {
  return Boolean(value && new Date(value).getTime() <= Date.now());
}

export default function CoursePage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [essentialAreas, setEssentialAreas] = useState<EssentialAreaEnrollment[] | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("resumen");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams(window.location.search);
      const courseKey = params.get("course");
      const requestedTab = params.get("tab");
      if (requestedTab && tabs.some((tab) => tab.key === requestedTab)) {
        setActiveTab(requestedTab as Tab);
      }

      if (!courseKey) {
        setError("No se indicó qué curso abrir.");
        setReady(true);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        goTo("/");
        return;
      }

      if (courseKey === "essential-overview") {
        const { data, error: essentialError } = await supabase
          .from("course_enrollments")
          .select("id, required_until, courses!inner(id, course_key, name, description, icon, category, is_essential)")
          .eq("user_id", session.user.id)
          .eq("status", "active")
          .eq("courses.is_essential", true)
          .order("enrolled_at", { ascending: true });

        if (essentialError) throw essentialError;
        const loadedAreas = ((data ?? []) as unknown as EssentialAreaEnrollment[])
          .filter((item) => !isExpired(item.required_until));

        if (loadedAreas.length === 0) {
          setError("Tu único año de Formación esencial ya terminó o todavía no está asignado a tu cuenta.");
          setReady(true);
          return;
        }

        setEssentialAreas(loadedAreas);
        setReady(true);
        return;
      }

      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("id, course_key, name, description, icon, category, is_essential")
        .eq("course_key", courseKey)
        .maybeSingle();

      if (courseError) throw courseError;
      if (!courseData) {
        setError("Este curso no existe o todavía no está disponible.");
        setReady(true);
        return;
      }

      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from("course_enrollments")
        .select("id, required_until")
        .eq("user_id", session.user.id)
        .eq("course_id", courseData.id)
        .eq("status", "active")
        .maybeSingle();

      if (enrollmentError) throw enrollmentError;
      if (!enrollmentData) {
        setError("Este curso todavía no está asignado a tu cuenta.");
        setReady(true);
        return;
      }

      if (courseData.is_essential && isExpired(enrollmentData.required_until)) {
        setError("Tu único año obligatorio de Formación esencial ya terminó. Esta área no se vuelve a cursar.");
        setReady(true);
        return;
      }

      setCourse(courseData as Course);
      setEnrollment(enrollmentData as Enrollment);
      setReady(true);
    }

    load().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo abrir el curso.");
      setReady(true);
    });
  }, []);

  if (!ready) {
    return <AppShell><div className="empty-state">Abriendo curso...</div></AppShell>;
  }

  if (essentialAreas) {
    const requiredDates = essentialAreas
      .map((item) => item.required_until)
      .filter((value): value is string => Boolean(value))
      .sort();
    const requiredUntil = formatRequiredUntil(requiredDates.at(-1) ?? null);

    return (
      <AppShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Materia obligatoria · único año</p>
            <h1>🌱 Formación esencial</h1>
            <p>Una sola materia anual formada por seis áreas básicas. Se cursa únicamente durante tus primeros 365 días en Nexora.</p>
          </div>
          <span className="status-pill status-open">Obligatoria una sola vez</span>
        </div>

        <section className="dashboard-grid" style={{ marginBottom: 24 }}>
          <article className="panel">
            <p className="eyebrow">Peso anual</p>
            <h2>🏆 2400 puntos</h2>
            <p className="muted-copy">Cada una de las 6 áreas aporta hasta 400 puntos durante el año.</p>
          </article>
          <article className="panel">
            <p className="eyebrow">Por bloque</p>
            <h2>📊 600 puntos</h2>
            <p className="muted-copy">Cada bloque reúne 100 puntos de cada área. Son 4 bloques en total.</p>
          </article>
          <article className="panel">
            <p className="eyebrow">Duración única</p>
            <h2>📅 365 días</h2>
            <p className="muted-copy">{requiredUntil ? `Obligatoria hasta ${requiredUntil}. Después queda finalizada y no se repite.` : "Después del primer año queda finalizada y no se vuelve a asignar."}</p>
          </article>
        </section>

        <section className="panel" style={{ marginBottom: 20 }}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Áreas internas</p>
              <h2>📚 Tus 6 áreas esenciales</h2>
              <p className="muted-copy">Son partes de una misma materia, no seis materias independientes. Sus clases, tareas y notas se conservan durante todo el año aunque avances de nivel.</p>
            </div>
          </div>
        </section>

        <section className="card-grid">
          {essentialAreas.map((item) => {
            const area = item.courses;
            if (!area) return null;
            return (
              <article className="course-card" key={item.id}>
                <div className="course-icon">{area.icon}</div>
                <p className="eyebrow">Área de Formación esencial</p>
                <h3>{area.name}</h3>
                <p>{area.description}</p>
                <small>🎯 400 pts anuales · 100 pts por bloque</small>
                <button className="primary-button" type="button" onClick={() => goTo(`/course/?course=${encodeURIComponent(area.course_key)}`)}>
                  Entrar al área
                </button>
              </article>
            );
          })}
        </section>

        <div style={{ marginTop: 22 }}>
          <button className="secondary-button" type="button" onClick={() => goTo("/courses/")}>← Volver a Mis cursos</button>
        </div>
      </AppShell>
    );
  }

  if (error || !course || !enrollment) {
    return (
      <AppShell>
        <article className="panel">
          <h2>No pudimos abrir el curso</h2>
          <div className="auth-message auth-error">{error ?? "Curso no disponible."}</div>
          <button className="secondary-button" type="button" onClick={() => goTo("/courses/")}>Volver a Cursos</button>
        </article>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">{course.is_essential ? "Área de Formación esencial" : course.category}</p>
          <h1>{course.icon} {course.name}</h1>
          <p>{course.description}</p>
        </div>
        <span className="status-pill status-open">{course.is_essential ? "Área esencial anual" : "Curso activo"}</span>
      </div>

      {course.is_essential && (
        <article className="panel" style={{ marginBottom: 18 }}>
          <p className="eyebrow">Formación esencial</p>
          <strong>Esta es una de las 6 áreas de tu única materia anual Formación esencial.</strong>
          <p className="muted-copy">Aporta hasta 100 puntos por bloque y 400 puntos durante el año. No se reinicia al subir de nivel y no se repite en años posteriores.</p>
          <button className="secondary-button" type="button" onClick={() => goTo("/course/?course=essential-overview")}>← Volver a Formación esencial</button>
        </article>
      )}

      <div className="request-actions" style={{ marginBottom: 18, flexWrap: "wrap" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? "primary-button" : "secondary-button"}
            type="button"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "resumen" && (
        <section className="dashboard-grid">
          <article className="panel">
            <p className="eyebrow">Estado de inscripción</p>
            <h2>✅ Curso asignado</h2>
            <p className="muted-copy">Tu inscripción está activa. Desde aquí puedes consultar las clases, tareas, ejercicios, hoja de ejercicios y calificaciones disponibles para esta materia.</p>
          </article>
          <article className="panel">
            <p className="eyebrow">Estructura</p>
            <h2>4 bloques académicos</h2>
            <p className="muted-copy">{course.is_essential ? "Esta área aporta hasta 100 puntos en cada bloque de Formación esencial, para 400 puntos anuales." : "Las clases, tareas, ejercicios y calificaciones de esta materia se organizan aquí."}</p>
          </article>
        </section>
      )}

      {activeTab === "clases" && (
        <StudentLessonList
          courseId={course.id}
          courseName={course.name}
          courseIcon={course.icon}
          isEssentialCourse={Boolean(course.is_essential)}
        />
      )}

      {activeTab === "tareas" && (
        <>
          <article className="panel" style={{ marginBottom: 18 }}>
            <p className="eyebrow">Actividades del curso</p>
            <h2>📝 Tareas</h2>
            <p className="muted-copy">Selecciona una tarjeta para abrir la tarea. Las anteriores quedan acumuladas aquí para consultar entregas y calificaciones.</p>
          </article>
          <StudentActivityList
            courseId={course.id}
            types={["notebook_task", "virtual_task"]}
            includeClosed
            selectableCards
            isEssentialCourse={Boolean(course.is_essential)}
            emptyMessage="Todavía no hay tareas publicadas en este curso."
          />
        </>
      )}

      {activeTab === "ejercicios" && (
        <>
          <article className="panel" style={{ marginBottom: 18 }}>
            <p className="eyebrow">Práctica del curso</p>
            <h2>✏️ Ejercicios</h2>
            <p className="muted-copy">Cada ejercicio queda como una tarjeta. Selecciónalo para practicar o volver a consultar respuestas, revisión y calificación.</p>
          </article>
          <StudentActivityList
            courseId={course.id}
            types={["practice"]}
            includeClosed
            selectableCards
            isEssentialCourse={Boolean(course.is_essential)}
            emptyMessage="Todavía no hay ejercicios publicados en este curso."
          />
        </>
      )}

      {activeTab === "hoja-ejercicios" && (
        <>
          <article className="panel" style={{ marginBottom: 18 }}>
            <p className="eyebrow">Puntos por práctica realizada</p>
            <h2>📄 Hoja de ejercicios</h2>
            <p className="muted-copy">Cuando tu profesor cree una Hoja de ejercicios para esta materia y bloque, aquí podrás marcar los ejercicios que realizaste. La hoja vale hasta 10 puntos académicos y la nota la asigna manualmente el profesor.</p>
          </article>
          <StudentExerciseSheetList
            courseId={course.id}
            courseName={course.name}
            courseIcon={course.icon}
            isEssentialCourse={Boolean(course.is_essential)}
          />
        </>
      )}

      {activeTab === "calificaciones" && (
        <StudentCourseGrades
          courseId={course.id}
          courseName={course.name}
          courseIcon={course.icon}
          isEssentialCourse={Boolean(course.is_essential)}
        />
      )}
    </AppShell>
  );
}
