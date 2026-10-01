"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";

type Tab = "resumen" | "clases" | "tareas" | "ejercicios" | "calificaciones";

type Course = {
  id: string;
  course_key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
};

type Enrollment = {
  id: string;
  starting_level: number | null;
  starting_title: string | null;
  enrolled_at: string;
};

const tabs: { key: Tab; label: string }[] = [
  { key: "resumen", label: "Resumen" },
  { key: "clases", label: "Clases" },
  { key: "tareas", label: "Tareas" },
  { key: "ejercicios", label: "Ejercicios" },
  { key: "calificaciones", label: "Calificaciones" },
];

export default function CoursePage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("resumen");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const courseKey = new URLSearchParams(window.location.search).get("course");
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

      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("id, course_key, name, description, icon, category")
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
        .select("id, starting_level, starting_title, enrolled_at")
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
          <p className="eyebrow">{course.category}</p>
          <h1>{course.icon} {course.name}</h1>
          <p>{course.description}</p>
        </div>
        <span className="status-pill status-open">Curso activo</span>
      </div>

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
            <p className="eyebrow">Tu punto de inicio</p>
            <h2>{enrollment.starting_level ? `Nivel ${enrollment.starting_level}` : "Por definir"}</h2>
            <p className="muted-copy">
              {enrollment.starting_title
                ? `El diagnóstico recomendó comenzar alrededor de: ${enrollment.starting_title}.`
                : "Todavía no hay un resultado de diagnóstico asociado. Podremos definir el punto de inicio al preparar tus primeras clases."}
            </p>
          </article>
          <article className="panel">
            <p className="eyebrow">Estructura</p>
            <h2>4 bloques académicos</h2>
            <p className="muted-copy">Las clases, tareas, ejercicios y calificaciones de esta materia se organizarán aquí.</p>
          </article>
        </section>
      )}

      {activeTab === "clases" && <article className="panel"><h2>📖 Clases</h2><div className="empty-state">Todavía no hay clases publicadas en este curso.</div></article>}
      {activeTab === "tareas" && <article className="panel"><h2>📝 Tareas</h2><div className="empty-state">Todavía no hay tareas publicadas en este curso.</div></article>}
      {activeTab === "ejercicios" && <article className="panel"><h2>✏️ Ejercicios</h2><div className="empty-state">Todavía no hay ejercicios disponibles en este curso.</div></article>}
      {activeTab === "calificaciones" && <article className="panel"><h2>📊 Calificaciones</h2><div className="empty-state">Las calificaciones aparecerán aquí cuando haya actividades calificadas.</div></article>}
    </AppShell>
  );
}
