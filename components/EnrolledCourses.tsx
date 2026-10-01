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
};

type Enrollment = {
  id: string;
  status: string;
  starting_level: number | null;
  starting_title: string | null;
  courses: Course | null;
};

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
        .select("id, status, starting_level, starting_title, courses(id, course_key, name, description, icon, category)")
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

  if (items.length === 0) {
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
