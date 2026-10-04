"use client";

import { useEffect, useState } from "react";
import { goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";

type Course = {
  id: string;
  course_key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  is_essential: boolean;
};

type Enrollment = {
  id: string;
  status: string;
  starting_level: number | null;
  starting_title: string | null;
  required_until: string | null;
  courses: Course | null;
};

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

function CourseCards({ items }: { items: Enrollment[] }) {
  return (
    <section className="card-grid">
      {items.map((enrollment) => {
        const course = enrollment.courses;
        if (!course) return null;

        return (
          <article className="course-card" key={enrollment.id}>
            <div className="course-icon">{course.icon}</div>
            <p className="eyebrow">{course.category}</p>
            <h3>{course.name}</h3>
            <p>{course.description}</p>
            {enrollment.starting_level && (
              <small>📍 Inicio recomendado: Nivel {enrollment.starting_level}{enrollment.starting_title ? ` · ${enrollment.starting_title}` : ""}</small>
            )}
            <button
              className="primary-button"
              type="button"
              onClick={() => goTo(`/course/?course=${encodeURIComponent(course.course_key)}`)}
            >
              Entrar al curso
            </button>
          </article>
        );
      })}
    </section>
  );
}

function EssentialSubjectCard({ items }: { items: Enrollment[] }) {
  const requiredDates = items
    .map((item) => item.required_until)
    .filter((value): value is string => Boolean(value))
    .sort();
  const requiredUntil = formatRequiredUntil(requiredDates.at(-1) ?? null);

  return (
    <article className="course-card" style={{ maxWidth: 720 }}>
      <div className="course-icon">🌱</div>
      <p className="eyebrow">Materia obligatoria · único año</p>
      <h3>Formación esencial</h3>
      <p>
        Una sola materia anual que reúne escritura clara, comprensión lectora, ortografía y redacción,
        cálculo mental, lógica y hábitos de estudio.
      </p>
      <small><strong>🏆 2400 pts anuales</strong> · 600 pts por bloque · 400 pts por cada una de sus 6 áreas.</small>
      {requiredUntil && <small>🌱 Obligatoria hasta {requiredUntil}</small>}
      <small>🔒 Se cursa una sola vez: al terminar los 365 días no se vuelve a asignar ni se puede repetir.</small>
      <button className="primary-button" type="button" onClick={() => goTo("/course/?course=essential-overview")}>
        Entrar a Formación esencial
      </button>
    </article>
  );
}

export default function EnrolledCourses() {
  const [items, setItems] = useState<Enrollment[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        goTo("/");
        return;
      }

      const { data, error: loadError } = await supabase
        .from("course_enrollments")
        .select("id, status, starting_level, starting_title, required_until, courses(id, course_key, name, description, icon, category, is_essential)")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .order("enrolled_at", { ascending: false });

      if (loadError) throw loadError;
      setItems((data ?? []) as unknown as Enrollment[]);
      setReady(true);
    }

    load().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar tus cursos.");
      setReady(true);
    });
  }, []);

  if (!ready) return <div className="empty-state">Cargando tus cursos...</div>;
  if (error) return <div className="auth-message auth-error">{error}</div>;

  const essential = items.filter((item) => item.courses?.is_essential && !isExpired(item.required_until));
  const regular = items.filter((item) => !item.courses?.is_essential);

  if (essential.length === 0 && regular.length === 0) {
    return (
      <article className="panel">
        <div className="course-icon">📚</div>
        <h2>Aún no tienes cursos activos</h2>
        <p className="muted-copy">Cuando Administración acepte una solicitud, el curso aparecerá aquí.</p>
        <button className="primary-button" type="button" onClick={() => goTo("/request-course/")}>
          Solicitar un curso
        </button>
      </article>
    );
  }

  return (
    <div style={{ display: "grid", gap: 28 }}>
      {essential.length > 0 && (
        <section>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Únicos primeros 365 días</p>
              <h2>🌱 Formación esencial</h2>
              <p className="muted-copy">Las seis áreas obligatorias se presentan como una sola materia anual y no se repiten en años posteriores.</p>
            </div>
          </div>
          <EssentialSubjectCard items={essential} />
        </section>
      )}

      {regular.length > 0 && (
        <section>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Materias asignadas</p>
              <h2>📚 Mis otros cursos</h2>
            </div>
          </div>
          <CourseCards items={regular} />
        </section>
      )}
    </div>
  );
}
