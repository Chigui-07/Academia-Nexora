"use client";

import { useEffect, useState } from "react";
import { goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";

type MathRequest = {
  id: string;
  course_name: string;
};

type MathAttempt = {
  status: "in_progress" | "limit_reached" | "completed";
};

export default function MathDiagnosticLauncher() {
  const [request, setRequest] = useState<MathRequest | null>(null);
  const [attempt, setAttempt] = useState<MathAttempt | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) return;

      const { data: requests } = await supabase
        .from("course_requests")
        .select("id, course_name")
        .eq("user_id", session.user.id)
        .eq("diagnostic_opt_in", true)
        .order("created_at", { ascending: false });

      const mathRequest = ((requests ?? []) as MathRequest[]).find((item) =>
        item.course_name.toLowerCase().includes("matem")
      );

      if (!mathRequest) {
        setReady(true);
        return;
      }

      setRequest(mathRequest);

      const { data: attempts } = await supabase
        .from("diagnostic_attempts")
        .select("status")
        .eq("user_id", session.user.id)
        .eq("course_key", "matematica")
        .limit(1);

      setAttempt(((attempts ?? [])[0] as MathAttempt | undefined) ?? null);
      setReady(true);
    }

    load();
  }, []);

  if (!ready || !request) return null;

  const finished = attempt?.status === "completed" || attempt?.status === "limit_reached";
  const label = finished
    ? "Diagnóstico de Matemática completado"
    : attempt?.status === "in_progress"
      ? "Continuar diagnóstico de Matemática"
      : "Iniciar diagnóstico de Matemática";

  return (
    <article className="panel" style={{ marginBottom: 18 }}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Diagnóstico inicial</p>
          <h2>🧠 Matemática</h2>
        </div>
        <span className={`status-pill ${finished ? "status-open" : "status-soon"}`}>
          {finished ? "Realizado" : "Una sola vez"}
        </span>
      </div>

      <p className="muted-copy">
        Este diagnóstico sirve para encontrar tu nivel inicial. Puedes salir y continuar después mientras esté en progreso, pero una vez finalizado no se puede repetir.
      </p>

      <button
        className={finished ? "secondary-button" : "primary-button"}
        type="button"
        disabled={finished}
        onClick={() => goTo(`/diagnostic/math/?request=${request.id}`)}
      >
        {label}
      </button>
    </article>
  );
}
