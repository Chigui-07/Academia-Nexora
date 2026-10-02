"use client";

import { useEffect, useRef, useState } from "react";
import ActivitySheet, { ActivityQuestionReview, ActivitySheetType } from "./ActivitySheet";
import { ActivityAnswerKey, ActivityAnswerValue, ActivityQuestionBlock } from "@/lib/activityQuestions";
import { supabase } from "@/lib/supabase";
import styles from "./ActivityRunner.module.css";

type AttemptStatus = "in_progress" | "submitted" | "timed_out";

type Attempt = {
  id: string;
  status: AttemptStatus;
  attempt_number: number;
  responses: ActivityAnswerKey;
  started_at: string;
  expires_at: string | null;
  submitted_at: string | null;
  question_reviews: Record<string, ActivityQuestionReview>;
  grade_value: number | null;
  grade_max: number | null;
  feedback: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
};

export type RunnableActivity = {
  id: string;
  course_id: string;
  activity_type: ActivitySheetType;
  title: string;
  worksheet_content: string;
  question_blocks: ActivityQuestionBlock[];
  points: number | null;
  opens_at: string | null;
  closes_at: string | null;
  time_limit_minutes: number | null;
  max_attempts: number;
  block_number: number;
};

type ActivityRunnerProps = {
  activity: RunnableActivity;
  courseName: string;
  courseIcon?: string;
  allowNewAttempts?: boolean;
};

type StartRow = {
  attempt_id: string;
  attempt_status: AttemptStatus;
  attempt_number: number;
  responses: ActivityAnswerKey;
  started_at: string;
  expires_at: string | null;
  submitted_at: string | null;
};

const activityTypeLabels: Record<ActivitySheetType, string> = {
  notebook_task: "Tarea de cuaderno",
  virtual_task: "Tarea virtual",
  practice: "Ejercicio práctico",
};

function formatClock(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function friendlyError(message: string) {
  if (message.includes("Activity has not opened")) return "Esta actividad todavía no ha abierto.";
  if (message.includes("Activity is closed")) return "Esta actividad ya cerró.";
  if (message.includes("not enrolled")) return "Este curso no está asignado a tu cuenta.";
  if (message.includes("not assigned")) return "Esta actividad no está asignada a tu cuenta.";
  if (message.includes("Activity not available")) return "Esta actividad ya no está disponible.";
  if (message.includes("Attempt limit reached")) return "Ya utilizaste todos los intentos disponibles para esta actividad.";
  if (message.includes("Attempt not found")) return "No encontramos tu intento. Recarga la página e inténtalo de nuevo.";
  return message;
}

export default function ActivityRunner({
  activity,
  courseName,
  courseIcon = "📚",
  allowNewAttempts = true,
}: ActivityRunnerProps) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<ActivityAnswerKey>({});
  const [ready, setReady] = useState(false);
  const [working, setWorking] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timeoutSubmitting = useRef(false);

  useEffect(() => {
    async function loadAttempt() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        setReady(true);
        return;
      }

      const { data, error: loadError } = await supabase
        .from("activity_attempts")
        .select("id, status, attempt_number, responses, started_at, expires_at, submitted_at, question_reviews, grade_value, grade_max, feedback, reviewer_name, reviewed_at")
        .eq("activity_id", activity.id)
        .eq("user_id", session.user.id)
        .order("attempt_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (loadError) throw loadError;

      if (data) {
        const loaded = data as Attempt;
        const loadedAnswers = (loaded.responses ?? {}) as ActivityAnswerKey;
        loaded.question_reviews = (loaded.question_reviews ?? {}) as Record<string, ActivityQuestionReview>;

        if (loaded.status === "in_progress" && loaded.expires_at && new Date(loaded.expires_at).getTime() <= Date.now()) {
          const { data: finalStatus, error: timeoutError } = await supabase.rpc("submit_course_activity_attempt", {
            p_attempt_id: loaded.id,
            p_responses: loadedAnswers,
            p_timed_out: true,
          });
          if (timeoutError) throw timeoutError;
          loaded.status = (finalStatus ?? "timed_out") as AttemptStatus;
          loaded.submitted_at = new Date().toISOString();
        }

        setAttempt(loaded);
        setAnswers(loadedAnswers);
      }

      setReady(true);
    }

    loadAttempt().catch((caughtError) => {
      setError(caughtError instanceof Error ? friendlyError(caughtError.message) : "No se pudo cargar tu intento.");
      setReady(true);
    });
  }, [activity.id]);

  useEffect(() => {
    if (!attempt || attempt.status !== "in_progress" || !attempt.expires_at) {
      setSecondsLeft(null);
      return;
    }

    const tick = () => {
      const left = Math.max(0, Math.ceil((new Date(attempt.expires_at!).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);

      if (left === 0 && !timeoutSubmitting.current) {
        timeoutSubmitting.current = true;
        submitAttempt(true).finally(() => {
          timeoutSubmitting.current = false;
        });
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [attempt?.id, attempt?.status, attempt?.expires_at, answers]);

  useEffect(() => {
    if (!attempt || attempt.status !== "in_progress") return;

    setSaveState("saving");
    const timer = window.setTimeout(async () => {
      const { data, error: saveError } = await supabase.rpc("save_course_activity_attempt", {
        p_attempt_id: attempt.id,
        p_responses: answers,
      });

      if (saveError) {
        setError(friendlyError(saveError.message));
        setSaveState("idle");
        return;
      }

      const returnedStatus = (data ?? "in_progress") as AttemptStatus;
      if (returnedStatus !== "in_progress") {
        setAttempt((current) => current ? { ...current, status: returnedStatus, submitted_at: new Date().toISOString() } : current);
        setMessage(returnedStatus === "timed_out" ? "El tiempo terminó. Tus respuestas guardadas quedaron registradas." : null);
      }
      setSaveState("saved");
    }, 700);

    return () => window.clearTimeout(timer);
  }, [answers, attempt?.id, attempt?.status]);

  async function startAttempt() {
    if (!allowNewAttempts) {
      setError("Este ejercicio ya cerró. Puedes consultar tus intentos anteriores, pero no iniciar uno nuevo.");
      return;
    }

    setWorking(true);
    setError(null);
    setMessage(null);

    try {
      const { data, error: startError } = await supabase.rpc("start_course_activity", {
        p_activity_id: activity.id,
      });
      if (startError) throw startError;

      const row = (Array.isArray(data) ? data[0] : data) as StartRow | undefined;
      if (!row) throw new Error("No se pudo crear el intento.");

      const loaded: Attempt = {
        id: row.attempt_id,
        status: row.attempt_status,
        attempt_number: row.attempt_number,
        responses: (row.responses ?? {}) as ActivityAnswerKey,
        started_at: row.started_at,
        expires_at: row.expires_at,
        submitted_at: row.submitted_at,
        question_reviews: {},
        grade_value: null,
        grade_max: null,
        feedback: null,
        reviewer_name: null,
        reviewed_at: null,
      };

      setAttempt(loaded);
      setAnswers(loaded.responses);

      if (loaded.status === "timed_out") {
        setMessage("Este intento ya terminó por tiempo.");
      } else if (loaded.status === "submitted") {
        setMessage("Este intento ya fue entregado.");
      } else {
        setMessage(`Intento ${loaded.attempt_number} de ${activity.max_attempts} iniciado. Tus respuestas se guardarán automáticamente.`);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? friendlyError(caughtError.message) : "No se pudo iniciar la actividad.");
    } finally {
      setWorking(false);
    }
  }

  async function submitAttempt(timedOut = false) {
    if (!attempt || attempt.status !== "in_progress") return;

    setWorking(true);
    setError(null);

    try {
      const { data, error: submitError } = await supabase.rpc("submit_course_activity_attempt", {
        p_attempt_id: attempt.id,
        p_responses: answers,
        p_timed_out: timedOut,
      });
      if (submitError) throw submitError;

      const finalStatus = (data ?? (timedOut ? "timed_out" : "submitted")) as AttemptStatus;
      setAttempt({ ...attempt, status: finalStatus, responses: answers, submitted_at: new Date().toISOString() });
      setSaveState("saved");
      const hasMore = allowNewAttempts && attempt.attempt_number < activity.max_attempts;
      setMessage(finalStatus === "timed_out"
        ? `⏱️ El tiempo terminó. Se registraron tus respuestas.${hasMore ? " Todavía puedes usar otro intento desde el curso." : ""}`
        : `✅ Intento entregado.${hasMore ? " Si quieres, todavía puedes realizar otro intento desde el curso." : " Quedó pendiente de revisión del profesor."}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? friendlyError(caughtError.message) : "No se pudo entregar la actividad.");
    } finally {
      setWorking(false);
    }
  }

  function handleAnswerChange(questionId: string, value: ActivityAnswerValue) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    setMessage(null);
    setError(null);
  }

  if (!ready) return <div className="empty-state">Preparando actividad...</div>;

  if (!attempt) {
    const questionCount = activity.question_blocks?.length ?? 0;
    return (
      <section className={styles.runner}>
        <article className={styles.startCard}>
          <div className={styles.startCardHeading}>
            <div>
              <span className={styles.courseLabel}>{courseIcon} {courseName}</span>
              <h3>{activity.title}</h3>
              <p>{activityTypeLabels[activity.activity_type]}</p>
            </div>
            <span className={`${styles.readyBadge} ${!allowNewAttempts ? styles.closedBadge : ""}`}>
              {allowNewAttempts ? "Lista para comenzar" : "Cerrado"}
            </span>
          </div>

          <div className={styles.startMeta}>
            <span>🧩 {questionCount} {questionCount === 1 ? "pregunta" : "preguntas"}</span>
            {activity.points !== null && <span>🎯 {activity.points} pts</span>}
            <span>🔁 {activity.max_attempts} {activity.max_attempts === 1 ? "intento" : "intentos"}</span>
            <span>{activity.time_limit_minutes ? `⏱️ ${activity.time_limit_minutes} min por intento` : "⏱️ Sin límite de tiempo"}</span>
            <span>📊 Bloque {activity.block_number}</span>
          </div>

          <p className={styles.startHint}>
            {allowNewAttempts ? (
              <>
                El contenido completo y las preguntas se abrirán cuando pulses <strong>Comenzar actividad</strong>.
                {activity.time_limit_minutes ? " El cronómetro empezará en ese momento." : ""}
              </>
            ) : (
              <>Este ejercicio ya cerró y no se puede iniciar un intento nuevo.</>
            )}
          </p>

          {error && <div className="auth-message auth-error">{error}</div>}
          {message && <div className="auth-message auth-success">{message}</div>}

          {allowNewAttempts && (
            <div className={styles.startAction}>
              <button className="primary-button" type="button" onClick={startAttempt} disabled={working}>
                {working ? "Iniciando..." : "Comenzar actividad"}
              </button>
            </div>
          )}
        </article>
      </section>
    );
  }

  const active = attempt.status === "in_progress";
  const finished = attempt.status === "submitted" || attempt.status === "timed_out";
  const reviewed = Boolean(attempt.reviewed_at && attempt.grade_value !== null && attempt.grade_max !== null);
  const canRepeat = Boolean(allowNewAttempts && finished && attempt.attempt_number < activity.max_attempts);
  const reviewSummary = reviewed
    ? {
        reviewerName: attempt.reviewer_name || "Profesor",
        gradeValue: Number(attempt.grade_value),
        gradeMax: Number(attempt.grade_max),
        feedback: attempt.feedback,
        reviewedAt: attempt.reviewed_at,
      }
    : null;

  return (
    <section className={styles.runner}>
      <div className={styles.controlBar}>
        <div>
          {active && <strong>Intento {attempt.attempt_number} de {activity.max_attempts} en curso</strong>}
          {attempt.status === "submitted" && <strong>{reviewed ? "✅ Revisada y calificada" : "📤 Entregada"}</strong>}
          {attempt.status === "timed_out" && <strong>{reviewed ? "✅ Revisada y calificada" : "⏱️ Tiempo finalizado"}</strong>}
          <small>
            {active && (saveState === "saving" ? "Guardando respuestas..." : saveState === "saved" ? "Respuestas guardadas automáticamente." : "Tus respuestas se guardan automáticamente.")}
            {finished && !reviewed && (canRepeat ? "Este intento quedó guardado. Puedes realizar otro intento al final." : "Tu entrega está pendiente de revisión del profesor.")}
            {finished && reviewed && `Revisada por ${attempt.reviewer_name || "Profesor"}.`}
          </small>
        </div>

        <div className={styles.controlActions}>
          {active && activity.time_limit_minutes && secondsLeft !== null && (
            <span className={`${styles.timer} ${secondsLeft <= 60 ? styles.timerWarning : ""}`}>⏱️ {formatClock(secondsLeft)}</span>
          )}
        </div>
      </div>

      {error && <div className="auth-message auth-error">{error}</div>}
      {message && <div className="auth-message auth-success">{message}</div>}

      <ActivitySheet
        courseName={courseName}
        courseIcon={courseIcon}
        activityType={activity.activity_type}
        title={activity.title}
        content={activity.worksheet_content}
        questionBlocks={activity.question_blocks ?? []}
        points={activity.points}
        opensAt={activity.opens_at}
        closesAt={activity.closes_at}
        timeLimitMinutes={activity.time_limit_minutes}
        maxAttempts={activity.max_attempts}
        answers={answers}
        responsesDisabled={!active}
        onAnswerChange={handleAnswerChange}
        questionReviews={attempt.question_reviews ?? {}}
        reviewSummary={reviewSummary}
      />

      {(active || canRepeat) && (
        <div className={styles.bottomActions}>
          {active && (
            <>
              <div>
                <strong>¿Terminaste todas las preguntas?</strong>
                <small>Revisa tus respuestas antes de finalizar. Después de entregar este intento ya no podrás modificarlo.</small>
              </div>
              <button
                className="primary-button"
                type="button"
                disabled={working}
                onClick={() => {
                  if (window.confirm("¿Quieres entregar este intento? Después de entregarlo ya no se podrá modificar.")) {
                    void submitAttempt(false);
                  }
                }}
              >
                {working ? "Entregando..." : activity.activity_type === "practice" ? "Finalizar intento" : "Entregar intento"}
              </button>
            </>
          )}

          {canRepeat && (
            <>
              <div>
                <strong>Puedes realizar otro intento</strong>
                <small>El intento anterior queda guardado. El nuevo tendrá sus propias respuestas y cronómetro.</small>
              </div>
              <button className="primary-button" type="button" onClick={startAttempt} disabled={working}>
                {working ? "Preparando..." : `Nuevo intento (${attempt.attempt_number + 1}/${activity.max_attempts})`}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
