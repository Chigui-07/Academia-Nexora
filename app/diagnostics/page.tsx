"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./diagnostics.module.css";

type Attempt = {
  id: string;
  course_request_id: string;
  course_key: string;
  status: "in_progress" | "limit_reached" | "completed";
  current_level: number;
  limit_level: number | null;
  started_at: string;
  completed_at: string | null;
};

type CourseRequest = {
  id: string;
  course_name: string;
  diagnostic_opt_in: boolean;
};

type TopicSummary = {
  level: number;
  key: string;
  topic: string;
  correct: number;
  total: number;
  limit_here?: boolean;
};

type LevelSummary = {
  level: number;
  title: string;
  answered: number;
  total: number;
  correct: number;
  percentage: number;
  mastered: boolean;
};

type DiagnosticResult = {
  attempt_id: string;
  course_key: string;
  course_name: string;
  final_status: "limit_reached" | "completed";
  placement_level: number;
  placement_title: string;
  mastered_through_level: number;
  mastered_topics: TopicSummary[];
  reinforce_topics: TopicSummary[];
  level_summary: LevelSummary[];
  created_at: string;
};

type DiagnosticItem = {
  attempt: Attempt;
  courseName: string;
  result: DiagnosticResult | null;
};

function formatDate(value: string | null) {
  if (!value) return "En progreso";
  return new Intl.DateTimeFormat("es-GT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export default function DiagnosticsPage() {
  const [items, setItems] = useState<DiagnosticItem[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDiagnostics() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;

        if (!session) {
          goTo("/");
          return;
        }

        const [attemptResponse, resultResponse, requestResponse] = await Promise.all([
          supabase
            .from("diagnostic_attempts")
            .select("id, course_request_id, course_key, status, current_level, limit_level, started_at, completed_at")
            .eq("user_id", session.user.id)
            .order("started_at", { ascending: false }),
          supabase
            .from("diagnostic_results")
            .select("attempt_id, course_key, course_name, final_status, placement_level, placement_title, mastered_through_level, mastered_topics, reinforce_topics, level_summary, created_at")
            .eq("user_id", session.user.id),
          supabase
            .from("course_requests")
            .select("id, course_name, diagnostic_opt_in")
            .eq("user_id", session.user.id)
            .eq("diagnostic_opt_in", true),
        ]);

        if (attemptResponse.error) throw attemptResponse.error;
        if (resultResponse.error) throw resultResponse.error;
        if (requestResponse.error) throw requestResponse.error;

        const attempts = (attemptResponse.data ?? []) as Attempt[];
        const results = (resultResponse.data ?? []) as DiagnosticResult[];
        const requests = (requestResponse.data ?? []) as CourseRequest[];

        const resultByAttempt = new Map(results.map((result) => [result.attempt_id, result]));
        const requestById = new Map(requests.map((request) => [request.id, request]));

        setItems(
          attempts.map((attempt) => ({
            attempt,
            courseName:
              resultByAttempt.get(attempt.id)?.course_name ??
              requestById.get(attempt.course_request_id)?.course_name ??
              attempt.course_key,
            result: resultByAttempt.get(attempt.id) ?? null,
          }))
        );
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar tus diagnósticos.");
      } finally {
        setReady(true);
      }
    }

    loadDiagnostics();
  }, []);

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Tu punto de partida</p>
          <h1>Diagnósticos</h1>
          <p>
            Aquí queda guardado cómo estabas al comenzar cada materia, para que más adelante puedas recordar qué dominabas y qué necesitabas reforzar.
          </p>
        </div>
      </div>

      {!ready ? (
        <div className="empty-state">Cargando tus diagnósticos...</div>
      ) : error ? (
        <div className="auth-message auth-error">{error}</div>
      ) : items.length === 0 ? (
        <article className="panel">
          <div className={styles.emptyIcon}>🧠</div>
          <h2>Aún no has comenzado ningún diagnóstico</h2>
          <p className="muted-copy">
            Cuando realices el diagnóstico inicial de una materia, su resultado quedará guardado aquí de forma permanente.
          </p>
          <button className="secondary-button" type="button" onClick={() => goTo("/courses/")}>
            Ir a Cursos
          </button>
        </article>
      ) : (
        <div className={styles.list}>
          {items.map(({ attempt, courseName, result }) => {
            const inProgress = attempt.status === "in_progress";
            const masteredTopics = result?.mastered_topics ?? [];
            const reinforceTopics = result?.reinforce_topics ?? [];
            const levels = result?.level_summary ?? [];

            return (
              <article className={styles.card} key={attempt.id}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className="eyebrow">Diagnóstico inicial</p>
                    <h2>{courseName}</h2>
                    <span className={styles.dateText}>
                      {inProgress ? `Comenzado el ${formatDate(attempt.started_at)}` : `Realizado el ${formatDate(attempt.completed_at)}`}
                    </span>
                  </div>
                  <span className={`${styles.status} ${inProgress ? styles.statusProgress : styles.statusDone}`}>
                    {inProgress ? "En progreso" : attempt.status === "limit_reached" ? "Mi límite" : "Finalizado"}
                  </span>
                </div>

                {inProgress ? (
                  <div className={styles.progressPanel}>
                    <div>
                      <strong>Nivel {attempt.current_level}</strong>
                      <span>Tu intento sigue guardado. Continuarás con las mismas preguntas.</span>
                    </div>
                    {attempt.course_key === "matematica" && (
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() => goTo(`/diagnostic/math/?request=${attempt.course_request_id}`)}
                      >
                        Continuar diagnóstico
                      </button>
                    )}
                  </div>
                ) : result ? (
                  <>
                    <div className={styles.placement}>
                      <span className={styles.placementIcon}>📍</span>
                      <div>
                        <small>Ubicación estimada al comenzar</small>
                        <strong>Nivel {result.placement_level}: {result.placement_title}</strong>
                        <p>
                          {result.mastered_through_level === 6
                            ? "Mostraste dominio de los seis niveles del diagnóstico."
                            : result.mastered_through_level > 0
                              ? `Tu base quedó dominada hasta el Nivel ${result.mastered_through_level}.`
                              : "El diagnóstico recomendó comenzar reforzando desde las bases."}
                        </p>
                      </div>
                    </div>

                    <div className={styles.topicColumns}>
                      <section>
                        <h3>✅ Lo que dominabas</h3>
                        {masteredTopics.length > 0 ? (
                          <div className={styles.chips}>
                            {masteredTopics.map((topic) => (
                              <span className={styles.goodChip} key={`${topic.level}-${topic.key}`}>{topic.topic}</span>
                            ))}
                          </div>
                        ) : (
                          <p className={styles.mutedSmall}>Todavía no había un tema confirmado como dominado.</p>
                        )}
                      </section>

                      <section>
                        <h3>📚 Lo que necesitabas reforzar</h3>
                        {reinforceTopics.length > 0 ? (
                          <div className={styles.chips}>
                            {reinforceTopics.map((topic) => (
                              <span className={styles.reinforceChip} key={`${topic.level}-${topic.key}`}>{topic.topic}</span>
                            ))}
                          </div>
                        ) : (
                          <p className={styles.mutedSmall}>No se detectaron temas de refuerzo dentro de lo que respondiste.</p>
                        )}
                      </section>
                    </div>

                    {levels.length > 0 && (
                      <details className={styles.details}>
                        <summary>Ver cómo te fue por nivel</summary>
                        <div className={styles.levelList}>
                          {levels
                            .filter((level) => level.answered > 0)
                            .map((level) => (
                              <div className={styles.levelRow} key={level.level}>
                                <div>
                                  <strong>Nivel {level.level}: {level.title}</strong>
                                  <span>{level.correct} correctas de {level.total} seleccionadas · {level.answered} respondidas</span>
                                </div>
                                <b>{level.percentage}%</b>
                              </div>
                            ))}
                        </div>
                      </details>
                    )}
                  </>
                ) : (
                  <div className="auth-message auth-error">
                    El diagnóstico terminó, pero todavía no encontramos su resumen. Administración puede revisarlo.
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
