"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";

type SelfLevel = "casi_nada" | "basico" | "intermedio" | "avanzado" | "no_seguro";

type CourseRequest = {
  id: string;
  course_name: string;
  grade_level: string;
  self_level: SelfLevel;
  diagnostic_opt_in: boolean;
  status: "pending" | "in_review" | "handled";
  created_at: string;
};

const levelLabels: Record<SelfLevel, string> = {
  casi_nada: "Casi nada",
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  no_seguro: "No estoy seguro",
};

const statusLabels: Record<CourseRequest["status"], string> = {
  pending: "Pendiente",
  in_review: "En revisión",
  handled: "Atendida",
};

function getRecommendations(courseName: string) {
  const value = courseName.toLowerCase();

  if (value.includes("program") || value.includes("java") || value.includes("informat")) {
    return [
      ["Lógica y razonamiento", "Te ayuda a ordenar ideas y construir soluciones paso a paso."],
      ["Matemática", "Fortalece el pensamiento lógico que usarás al programar."],
      ["Inglés para tecnología", "Muchos términos, errores y recursos de programación están en inglés."],
    ];
  }

  if (value.includes("física") || value.includes("fisica")) {
    return [
      ["Matemática", "Te ayuda con fórmulas, despejes y resolución de problemas."],
      ["Álgebra", "Es una base muy útil para trabajar con variables y ecuaciones en Física."],
      ["Astronomía básica", "Una forma interesante de aplicar conceptos físicos al universo."],
    ];
  }

  if (value.includes("matem") || value.includes("álgebra") || value.includes("algebra")) {
    return [
      ["Lógica y razonamiento", "Refuerza patrones, estrategias y resolución de problemas."],
      ["Física", "Te permite aplicar las matemáticas a situaciones del mundo real."],
      ["Programación básica", "La lógica matemática ayuda mucho al aprender a programar."],
    ];
  }

  if (value.includes("inglés") || value.includes("ingles") || value.includes("idioma")) {
    return [
      ["Comprensión y expresión lectora", "Mejora cómo entiendes y expresas ideas en cualquier idioma."],
      ["Redacción y ortografía", "Fortalece estructuras que también ayudan al aprender otra lengua."],
      ["Inglés para tecnología", "Puedes aplicar el idioma directamente a informática y programación."],
    ];
  }

  if (value.includes("historia") || value.includes("geograf")) {
    return [
      ["Comprensión y expresión lectora", "Ayuda a interpretar textos, causas, consecuencias y contextos."],
      ["Cultura general", "Conecta acontecimientos, países y temas de distintas áreas."],
      ["Geografía", "Complementa el estudio de sociedades, territorios y cambios históricos."],
    ];
  }

  return [
    ["Comprensión y expresión lectora", "Es útil para entender instrucciones, textos y explicaciones de cualquier materia."],
    ["Lógica y razonamiento", "Ayuda a analizar problemas y encontrar mejores estrategias."],
    ["Hábitos de estudio", "Puede ayudarte a organizar mejor tus sesiones de aprendizaje."],
  ];
}

export default function CourseRequestForm({ onboarding = false }: { onboarding?: boolean }) {
  const [courseName, setCourseName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [selfLevel, setSelfLevel] = useState<SelfLevel>("no_seguro");
  const [diagnostic, setDiagnostic] = useState(true);
  const [requests, setRequests] = useState<CourseRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(false);

  const recommendations = useMemo(() => getRecommendations(courseName), [courseName]);

  async function loadRequests() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      goTo("/");
      return;
    }

    const { data } = await supabase
      .from("course_requests")
      .select("id, course_name, grade_level, self_level, diagnostic_opt_in, status, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    setRequests((data ?? []) as CourseRequest[]);
    setReady(true);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) throw new Error("Tu sesión terminó. Inicia sesión nuevamente.");

      const { error: insertError } = await supabase.from("course_requests").insert({
        user_id: session.user.id,
        course_name: courseName.trim(),
        grade_level: gradeLevel.trim(),
        self_level: selfLevel,
        diagnostic_opt_in: diagnostic,
      });

      if (insertError) throw insertError;

      if (onboarding) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ onboarding_completed_at: new Date().toISOString() })
          .eq("id", session.user.id);

        if (profileError) throw profileError;
        setOnboardingDone(true);
      }

      setMessage(
        diagnostic
          ? "Solicitud enviada. También registramos que quieres hacer el diagnóstico opcional de este curso."
          : "Solicitud enviada a Administración."
      );
      setCourseName("");
      setSelfLevel("no_seguro");
      setDiagnostic(true);
      await loadRequests();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo enviar la solicitud.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return <div className="empty-state">Cargando tus solicitudes...</div>;
  }

  return (
    <div className="course-request-layout">
      <form className="panel course-request-form" onSubmit={handleSubmit}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Nuevo curso</p>
            <h2>¿Qué te gustaría aprender?</h2>
          </div>
          <span className="status-pill status-open">Administración lo revisará</span>
        </div>

        <p className="muted-copy">
          Solicita un curso por vez. Así podremos conocer mejor tu nivel y preparar un aprendizaje adecuado para cada materia.
        </p>

        <div className="form-group">
          <label htmlFor="course-name">Curso que te interesa</label>
          <input
            id="course-name"
            value={courseName}
            onChange={(event) => setCourseName(event.target.value)}
            placeholder="Ej. Física, Inglés, Programación..."
            minLength={2}
            maxLength={80}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="grade-level">¿En qué grado o nivel estudias actualmente?</label>
          <input
            id="grade-level"
            value={gradeLevel}
            onChange={(event) => setGradeLevel(event.target.value)}
            placeholder="Ej. 3.º básico, diversificado, estudio por mi cuenta..."
            maxLength={60}
            required
          />
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

        <label className="check-card">
          <input type="checkbox" checked={diagnostic} onChange={(event) => setDiagnostic(event.target.checked)} />
          <span>
            <strong>Quiero hacer el diagnóstico opcional</strong>
            <small>Nos ayudará a encontrar desde dónde conviene comenzar, sin afectar tus calificaciones.</small>
          </span>
        </label>

        <div className="diagnostic-honesty-note">
          🧠 <strong>Sé honesto contigo mismo.</strong> Cuando el diagnóstico esté disponible, si llegas a una parte que ya no sabes resolver, pulsa <strong>Mi límite</strong>. No perderás puntos por hacerlo.
        </div>

        {error && <div className="auth-message auth-error">{error}</div>}
        {message && <div className="auth-message auth-success">{message}</div>}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Enviando..." : "Enviar solicitud"}
        </button>

        {onboardingDone && (
          <button className="secondary-button full-width" type="button" onClick={() => goTo("/dashboard/")}>Entrar a Academia Nexora</button>
        )}
      </form>

      <aside className="panel recommendations-panel">
        <p className="eyebrow">Descubre algo nuevo</p>
        <h2>Cursos que podrían ayudarte o gustarte</h2>
        <p className="muted-copy">Las sugerencias cambian según el curso que escribas.</p>

        <div className="recommendation-list">
          {recommendations.map(([name, reason], index) => (
            <button
              className="recommendation-card"
              type="button"
              key={`${name}-${index}`}
              onClick={() => setCourseName(name)}
            >
              <strong>{index === 0 ? "🧩" : index === 1 ? "⭐" : "🚀"} {name}</strong>
              <span>{reason}</span>
            </button>
          ))}
        </div>
      </aside>

      {!onboarding && (
        <section className="panel requests-history">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Seguimiento</p>
              <h2>Mis solicitudes</h2>
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="empty-state">Todavía no has solicitado ningún curso.</div>
          ) : (
            <div className="request-list">
              {requests.map((request) => (
                <article className="request-row" key={request.id}>
                  <div>
                    <strong>{request.course_name}</strong>
                    <span>{request.grade_level} · {levelLabels[request.self_level]}</span>
                    {request.diagnostic_opt_in && <small>🧠 Diagnóstico solicitado</small>}
                  </div>
                  <span className={`status-pill ${request.status === "handled" ? "status-open" : "status-soon"}`}>
                    {statusLabels[request.status]}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
