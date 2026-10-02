"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ActivityAnswerKey, ActivityAnswerValue, ActivityQuestionBlock } from "@/lib/activityQuestions";
import { supabase } from "@/lib/supabase";
import styles from "./TeacherGradingManager.module.css";

type QuestionReview = "correct" | "incorrect";
type QuestionReviews = Record<string, QuestionReview>;

type GradingAttempt = {
  attempt_id: string;
  activity_id: string;
  student_id: string;
  student_name: string;
  student_code: string | null;
  course_name: string;
  course_icon: string;
  activity_title: string;
  activity_type: string;
  activity_points: number | null;
  question_blocks: ActivityQuestionBlock[];
  responses: ActivityAnswerKey;
  attempt_number: number;
  attempt_status: string;
  submitted_at: string | null;
  question_reviews: QuestionReviews;
  grade_value: number | null;
  grade_max: number | null;
  feedback: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
};

function answerText(question: ActivityQuestionBlock, value: ActivityAnswerValue | undefined) {
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
    return "Sin respuesta";
  }

  if (question.type === "true_false") {
    return value === true ? "Verdadero" : value === false ? "Falso" : String(value);
  }

  if (question.type === "single_choice") {
    const option = (question.options ?? []).find((item) => item.id === value);
    return option?.label || String(value);
  }

  if (question.type === "multiple_choice" && Array.isArray(value)) {
    const labels = value.map((id) => (question.options ?? []).find((item) => item.id === id)?.label || id);
    return labels.join(", ");
  }

  return String(value);
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function TeacherGradingManager() {
  const [ready, setReady] = useState(false);
  const [attempts, setAttempts] = useState<GradingAttempt[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answerKey, setAnswerKey] = useState<ActivityAnswerKey>({});
  const [reviews, setReviews] = useState<QuestionReviews>({});
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => attempts.find((attempt) => attempt.attempt_id === selectedId) ?? null,
    [attempts, selectedId],
  );

  async function loadQueue(preferredId?: string | null) {
    const { data, error: queueError } = await supabase.rpc("get_teacher_grading_queue");
    if (queueError) throw queueError;

    const loaded = (data ?? []) as GradingAttempt[];
    setAttempts(loaded);

    const target = preferredId && loaded.some((item) => item.attempt_id === preferredId)
      ? preferredId
      : loaded.find((item) => !item.reviewed_at)?.attempt_id ?? loaded[0]?.attempt_id ?? null;
    setSelectedId(target);
    setReady(true);
  }

  async function refreshQueue() {
    setRefreshing(true);
    setError(null);
    try {
      await loadQueue(selectedId);
      setMessage("Entregas actualizadas.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron actualizar las entregas.");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadQueue().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar las entregas.");
      setReady(true);
    });
  }, []);

  useEffect(() => {
    function handleFocus() {
      void loadQueue(selectedId).catch(() => undefined);
    }

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [selectedId]);

  useEffect(() => {
    if (!selected) {
      setAnswerKey({});
      setReviews({});
      setGrade("");
      setFeedback("");
      return;
    }

    setReviews((selected.question_reviews ?? {}) as QuestionReviews);
    setGrade(selected.grade_value === null ? "" : String(selected.grade_value));
    setFeedback(selected.feedback ?? "");
    setMessage(null);
    setError(null);

    supabase
      .rpc("get_course_activity_answer_key", { p_activity_id: selected.activity_id })
      .then(({ data, error: keyError }) => {
        if (keyError) {
          setAnswerKey({});
          setError("La entrega abrió, pero no se pudo cargar la clave de respuestas.");
          return;
        }
        setAnswerKey((data ?? {}) as ActivityAnswerKey);
      });
  }, [selectedId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      for (const [index, question] of (selected.question_blocks ?? []).entries()) {
        if (!reviews[question.id]) {
          throw new Error(`Marca la pregunta ${index + 1} como correcta o incorrecta.`);
        }
      }

      const max = selected.activity_points ?? 100;
      const numericGrade = Number(grade);
      if (!Number.isFinite(numericGrade) || numericGrade < 0 || numericGrade > max) {
        throw new Error(`La calificación debe estar entre 0 y ${max}.`);
      }

      const { data, error: gradeError } = await supabase.rpc("grade_course_activity_attempt", {
        p_attempt_id: selected.attempt_id,
        p_question_reviews: reviews,
        p_grade_value: numericGrade,
        p_feedback: feedback.trim() || null,
      });
      if (gradeError) throw gradeError;

      const result = Array.isArray(data) ? data[0] : data;
      const reviewer = result?.reviewer_name || "Profesor";
      setMessage(`Calificación guardada. La revisión quedó firmada por ${reviewer}.`);
      await loadQueue(selected.attempt_id);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo guardar la calificación.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <div className="empty-state">Cargando entregas...</div>;

  const pending = attempts.filter((attempt) => !attempt.reviewed_at).length;

  return (
    <section className={styles.wrapper}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Profesor</p>
          <h2>✅ Revisar y calificar entregas</h2>
          <p className="muted-copy">Marca cada respuesta como correcta o incorrecta, coloca la nota y deja retroalimentación general al final.</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.pendingBadge}>{pending} pendientes</span>
          <button className="secondary-button" type="button" onClick={() => void refreshQueue()} disabled={refreshing}>
            {refreshing ? "Actualizando..." : "↻ Actualizar entregas"}
          </button>
        </div>
      </div>

      {error && !selected && <div className="auth-message auth-error">{error}</div>}

      {attempts.length === 0 ? (
        <div className="empty-state">Todavía no hay entregas terminadas para revisar.</div>
      ) : (
        <div className={styles.layout}>
          <aside className={styles.queue}>
            {attempts.map((attempt) => (
              <button
                key={attempt.attempt_id}
                type="button"
                className={`${styles.queueItem} ${selectedId === attempt.attempt_id ? styles.queueItemActive : ""}`}
                onClick={() => setSelectedId(attempt.attempt_id)}
              >
                <span>{attempt.course_icon} {attempt.course_name}</span>
                <strong>{attempt.student_name}</strong>
                <small>{attempt.activity_title} · intento {attempt.attempt_number}</small>
                <em>{attempt.reviewed_at ? "✅ Revisada" : "🟡 Pendiente"}</em>
              </button>
            ))}
          </aside>

          {selected && (
            <form className={styles.reviewPanel} onSubmit={handleSubmit}>
              <div className={styles.reviewHeader}>
                <div>
                  <p className="eyebrow">{selected.course_icon} {selected.course_name}</p>
                  <h3>{selected.activity_title}</h3>
                  <p className="muted-copy">
                    {selected.student_name}{selected.student_code ? ` · ${selected.student_code}` : ""} · Entregada: {formatDate(selected.submitted_at)}
                  </p>
                </div>
                {selected.reviewed_at && (
                  <div className={styles.signatureMini}>
                    <strong>Revisada por {selected.reviewer_name || "Profesor"}</strong>
                    <small>{formatDate(selected.reviewed_at)}</small>
                  </div>
                )}
              </div>

              <div className={styles.questions}>
                {(selected.question_blocks ?? []).map((question, index) => {
                  const studentAnswer = selected.responses?.[question.id];
                  const expectedAnswer = answerKey?.[question.id];
                  const review = reviews[question.id];

                  return (
                    <article className={styles.questionCard} key={question.id}>
                      <div className={styles.questionTopline}>
                        <strong>Pregunta {index + 1}</strong>
                        <span>{question.type === "written" ? "Respuesta escrita" : "Pregunta objetiva"}</span>
                      </div>
                      <p className={styles.prompt}>{question.prompt}</p>

                      <div className={styles.answerBox}>
                        <small>Respuesta del estudiante</small>
                        <strong>{answerText(question, studentAnswer)}</strong>
                      </div>

                      {expectedAnswer !== undefined && expectedAnswer !== null && expectedAnswer !== "" && (
                        <div className={styles.expectedBox}>
                          <small>Respuesta esperada</small>
                          <span>{answerText(question, expectedAnswer)}</span>
                        </div>
                      )}

                      <div className={styles.reviewChoices}>
                        <button
                          type="button"
                          className={review === "correct" ? styles.correctActive : styles.reviewButton}
                          onClick={() => setReviews((current) => ({ ...current, [question.id]: "correct" }))}
                        >
                          ✅ Correcta
                        </button>
                        <button
                          type="button"
                          className={review === "incorrect" ? styles.incorrectActive : styles.reviewButton}
                          onClick={() => setReviews((current) => ({ ...current, [question.id]: "incorrect" }))}
                        >
                          ❌ Incorrecta
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className={styles.finalSection}>
                <label>
                  Calificación
                  <div className={styles.gradeInput}>
                    <input
                      type="number"
                      min="0"
                      max={selected.activity_points ?? 100}
                      step="0.01"
                      value={grade}
                      onChange={(event) => setGrade(event.target.value)}
                      required
                    />
                    <span>/ {selected.activity_points ?? 100}</span>
                  </div>
                </label>

                <label>
                  💬 Retroalimentación final
                  <textarea
                    rows={5}
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    placeholder="Escribe aquí qué hizo bien, qué debe corregir o qué debería practicar después..."
                  />
                </label>

                {error && <div className="auth-message auth-error">{error}</div>}
                {message && <div className="auth-message auth-success">{message}</div>}

                <button className="primary-button" type="submit" disabled={saving}>
                  {saving ? "Guardando revisión..." : selected.reviewed_at ? "Actualizar calificación" : "Guardar calificación"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
