"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";

type SelfLevel = "casi_nada" | "basico" | "intermedio" | "avanzado" | "no_seguro";
type RequestStatus = "pending" | "in_review" | "handled" | "rejected";

type Course = {
  id: string;
  course_key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
};

type CourseRequest = {
  id: string;
  course_id: string | null;
  course_name: string;
  grade_level: string;
  self_level: SelfLevel;
  status: RequestStatus;
  created_at: string;
};

type SubmittedRequest = { id: string; course: Course };

const levelLabels: Record<SelfLevel, string> = {
  casi_nada: "Casi nada",
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  no_seguro: "No estoy seguro",
};

const statusLabels: Record<RequestStatus, string> = {
  pending: "Pendiente",
  in_review: "En revisión",
  handled: "Aceptada",
  rejected: "Rechazada",
};

export default function CourseRequestForm({ onboarding = false }: { onboarding?: boolean }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [requests, setRequests] = useState<CourseRequest[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [selfLevel, setSelfLevel] = useState<SelfLevel>("no_seguro");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SubmittedRequest | null>(null);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? null;
  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return courses;
    return courses.filter((course) => `${course.name} ${course.description} ${course.category}`.toLowerCase().includes(term));
  }, [courses, search]);

  async function loadData() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) { goTo("/"); return; }

    const [courseResponse, requestResponse] = await Promise.all([
      supabase
        .from("courses")
        .select("id, course_key, name, description, icon, category")
        .eq("active", true)
        .neq("category", "Formación esencial")
        .order("name"),
      supabase
        .from("course_requests")
        .select("id, course_id, course_name, grade_level, self_level, status, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (courseResponse.error) throw courseResponse.error;
    if (requestResponse.error) throw requestResponse.error;
    setCourses((courseResponse.data ?? []) as Course[]);
    setRequests((requestResponse.data ?? []) as CourseRequest[]);
    setReady(true);
  }

  useEffect(() => {
    loadData().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo cargar el catálogo.");
      setReady(true);
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!selectedCourse) {
      setError("Selecciona un curso del catálogo antes de enviar la solicitud.");
      return;
    }

    const duplicate = requests.find(
      (request) => request.course_id === selectedCourse.id && ["pending", "in_review", "handled"].includes(request.status),
    );
    if (duplicate) {
      setError(duplicate.status === "handled" ? "Este curso ya fue aceptado para tu cuenta." : "Ya tienes una solicitud activa para este curso.");
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) throw new Error("Tu sesión terminó. Inicia sesión nuevamente.");

      const { data: inserted, error: insertError } = await supabase
        .from("course_requests")
        .insert({
          user_id: session.user.id,
          course_id: selectedCourse.id,
          course_name: selectedCourse.name,
          grade_level: gradeLevel.trim(),
          self_level: selfLevel,
        })
        .select("id")
        .single();

      if (insertError) {
        if (insertError.code === "23505") throw new Error("Ya tienes una solicitud activa para este curso.");
        throw insertError;
      }

      if (onboarding) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ onboarding_completed_at: new Date().toISOString() })
          .eq("id", session.user.id);
        if (profileError) throw profileError;
      }

      setSubmitted({ id: inserted.id, course: selectedCourse });
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo enviar la solicitud.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return <div className="empty-state">Cargando catálogo de cursos...</div>;

  if (submitted) {
    return (
      <article className="panel" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="course-icon" style={{ marginBottom: 12 }}>{submitted.course.icon}</div>
        <p className="eyebrow">Solicitud enviada</p>
        <h2>{submitted.course.name}</h2>
        <p className="muted-copy">Administración revisará tu solicitud. El curso aparecerá en <strong>Cursos</strong> cuando sea aceptado.</p>
        <div className="request-actions" style={{ marginTop: 18 }}>
          <button className="primary-button" type="button" onClick={() => goTo("/dashboard/")}>Ir al inicio</button>
          {!onboarding && (
            <button className="secondary-button" type="button" onClick={() => {
              setSubmitted(null);
              setSelectedCourseId("");
              setSearch("");
              setGradeLevel("");
              setSelfLevel("no_seguro");
            }}>Solicitar otro curso</button>
          )}
        </div>
      </article>
    );
  }

  return (
    <div className="course-request-layout">
      <form className="panel course-request-form" onSubmit={handleSubmit}>
        <div className="section-heading">
          <div><p className="eyebrow">Catálogo</p><h2>Busca tu curso</h2></div>
          <span className="status-pill status-open">Administración lo revisará</span>
        </div>

        <p className="muted-copy">Elige una materia del catálogo. Formación esencial se asigna automáticamente durante tu primer año.</p>

        <div className="form-group">
          <label htmlFor="course-search">Buscar materia</label>
          <input id="course-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ej. Matemática, Física, Inglés..." />
        </div>

        <div className="recommendation-list" style={{ marginBottom: 20 }}>
          {filteredCourses.length === 0 ? (
            <div className="empty-state">No encontramos ese curso en el catálogo actual.</div>
          ) : filteredCourses.map((course) => {
            const selected = course.id === selectedCourseId;
            return (
              <button
                className="recommendation-card"
                type="button"
                key={course.id}
                onClick={() => setSelectedCourseId(course.id)}
                style={selected ? { borderColor: "var(--primary)", boxShadow: "0 0 0 2px var(--primary)" } : undefined}
              >
                <strong>{course.icon} {course.name}</strong>
                <span>{course.description}</span>
                <small>{course.category}</small>
              </button>
            );
          })}
        </div>

        {selectedCourse && <div className="auth-message auth-success">Seleccionaste <strong>{selectedCourse.name}</strong>.</div>}

        <div className="form-group">
          <label htmlFor="grade-level">¿En qué grado o nivel estudias actualmente?</label>
          <input id="grade-level" value={gradeLevel} onChange={(event) => setGradeLevel(event.target.value)} placeholder="Ej. 3.º básico, diversificado, estudio por mi cuenta..." maxLength={60} required />
        </div>

        <div className="form-group">
          <label htmlFor="self-level">¿Qué tanto crees que sabes de esta materia?</label>
          <select id="self-level" value={selfLevel} onChange={(event) => setSelfLevel(event.target.value as SelfLevel)}>
            <option value="casi_nada">Casi nada</option>
            <option value="basico">Básico</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
            <option value="no_seguro">No estoy seguro</option>
          </select>
        </div>

        {error && <div className="auth-message auth-error">{error}</div>}
        <button className="primary-button" type="submit" disabled={loading || !selectedCourse}>{loading ? "Enviando..." : "Enviar solicitud"}</button>
      </form>

      <aside className="panel recommendations-panel">
        <p className="eyebrow">Cómo funciona</p>
        <h2>De solicitud a curso</h2>
        <div className="recommendation-list">
          <div className="recommendation-card"><strong>1. 🔎 Elige una materia</strong><span>Busca en el catálogo y dinos tu nivel actual.</span></div>
          <div className="recommendation-card"><strong>2. 📩 Envía la solicitud</strong><span>Administración la revisará y decidirá si asigna el curso.</span></div>
          <div className="recommendation-card"><strong>3. ✅ Administración acepta</strong><span>Cuando sea aprobada, la materia aparecerá en Cursos.</span></div>
        </div>
      </aside>

      {!onboarding && (
        <section className="panel requests-history">
          <div className="section-heading"><div><p className="eyebrow">Seguimiento</p><h2>Mis solicitudes</h2></div></div>
          {requests.length === 0 ? <div className="empty-state">Todavía no has solicitado ningún curso.</div> : (
            <div className="request-list">
              {requests.map((request) => (
                <article className="request-row" key={request.id}>
                  <div><strong>{request.course_name}</strong><span>{request.grade_level} · {levelLabels[request.self_level]}</span></div>
                  <span className={`status-pill ${request.status === "handled" ? "status-open" : "status-soon"}`}>{statusLabels[request.status]}</span>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
