"use client";

import { useEffect, useMemo, useState } from "react";
import { ActivityAnswerKey, ActivityQuestionBlock } from "@/lib/activityQuestions";
import { supabase } from "@/lib/supabase";
import styles from "./StudentExerciseSheetList.module.css";

type ExerciseSheet = {
  id: string;
  course_id: string;
  title: string;
  worksheet_content: string;
  question_blocks: ActivityQuestionBlock[];
  points: number;
  block_number: number;
  opens_at: string | null;
  closes_at: string | null;
};

type Practice = {
  id: string;
  title: string;
  assignment_mode: "course" | "selected";
  opens_at: string | null;
  block_number: number;
  academic_stage: string;
  academic_level: number;
};

type AttemptStatus = "in_progress" | "submitted" | "timed_out";

type Attempt = {
  id: string;
  status: AttemptStatus;
  attempt_number: number;
  responses: ActivityAnswerKey;
  submitted_at: string | null;
  grade_value: number | null;
  grade_max: number | null;
  feedback: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
};

type StartRow = {
  attempt_id: string;
  attempt_status: AttemptStatus;
  attempt_number: number;
  responses: ActivityAnswerKey;
  submitted_at: string | null;
};

type Props = {
  courseId: string;
  courseName: string;
  courseIcon?: string;
  isEssentialCourse?: boolean;
};

function selectionFrom(responses: ActivityAnswerKey | null | undefined) {
  const value = responses?.["exercise-sheet-selection"];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ExerciseSheetRunner({
  sheet,
  courseName,
  courseIcon,
}: {
  sheet: ExerciseSheet;
  courseName: string;
  courseIcon: string;
}) {
  const question = sheet.question_blocks.find((item) => item.id === "exercise-sheet-selection") ?? sheet.question_blocks[0];
  const options = question?.options ?? [];
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [working, setWorking] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAttempt() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        if (!cancelled) setReady(true);
        return;
      }

      const { data, error: attemptError } = await supabase
        .from("activity_attempts")
        .select("id, status, attempt_number, responses, submitted_at, grade_value, grade_max, feedback, reviewer_name, reviewed_at")
        .eq("activity_id", sheet.id)
        .eq("user_id", userId)
        .order("attempt_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (attemptError) throw attemptError;
      if (cancelled) return;

      if (data) {
        const loaded = data as Attempt;
        const allowedIds = new Set(options.map((option) => option.id));
        setAttempt(loaded);
        setSelected(selectionFrom(loaded.responses).filter((id) => allowedIds.has(id)));
      }
      setReady(true);
    }

    setReady(false);
    setError(null);
    void loadAttempt().catch((caughtError) => {
      if (cancelled) return;
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo cargar tu hoja de ejercicios.");
      setReady(true);
    });

    return () => { cancelled = true; };
  }, [sheet.id, options.map((option) => option.id).join("|")]);

  useEffect(() => {
    if (!attempt || attempt.status !== "in_progress") return;

    setSaveState("saving");
    const timer = window.setTimeout(async () => {
      const { data, error: saveError } = await supabase.rpc("save_course_activity_attempt", {
        p_attempt_id: attempt.id,
        p_responses: { "exercise-sheet-selection": selected },
      });

      if (saveError) {
        setError(saveError.message);
        setSaveState("idle");
        return;
      }

      if (data && data !== "in_progress") {
        setAttempt((current) => current ? { ...current, status: data as AttemptStatus } : current);
      }
      setSaveState("saved");
    }, 600);

    return () => window.clearTimeout(timer);
  }, [attempt?.id, attempt?.status, selected]);

  async function startSheet() {
    setWorking(true);
    setError(null);
    setMessage(null);

    try {
      const { data, error: startError } = await supabase.rpc("start_course_activity", {
        p_activity_id: sheet.id,
      });
      if (startError) throw startError;

      const row = (Array.isArray(data) ? data[0] : data) as StartRow | undefined;
      if (!row) throw new Error("No se pudo abrir la hoja de ejercicios.");

      const next: Attempt = {
        id: row.attempt_id,
        status: row.attempt_status,
        attempt_number: row.attempt_number,
        responses: row.responses ?? {},
        submitted_at: row.submitted_at,
        grade_value: null,
        grade_max: null,
        feedback: null,
        reviewer_name: null,
        reviewed_at: null,
      };
      setAttempt(next);
      setSelected(selectionFrom(next.responses));
      setMessage("Hoja abierta. Marca los ejercicios que realmente realizaste; tus cambios se guardan automáticamente.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo abrir la hoja de ejercicios.");
    } finally {
      setWorking(false);
    }
  }

  async function submitSheet() {
    if (!attempt || attempt.status !== "in_progress") return;
    if (selected.length === 0) {
      setError("Marca al menos un ejercicio realizado antes de entregar la hoja.");
      return;
    }

    setWorking(true);
    setError(null);
    setMessage(null);

    try {
      const { data, error: submitError } = await supabase.rpc("submit_course_activity_attempt", {
        p_attempt_id: attempt.id,
        p_responses: { "exercise-sheet-selection": selected },
        p_timed_out: false,
      });
      if (submitError) throw submitError;

      setAttempt({
        ...attempt,
        status: (data ?? "submitted") as AttemptStatus,
        responses: { "exercise-sheet-selection": selected },
        submitted_at: new Date().toISOString(),
      });
      setSaveState("saved");
      setMessage("✅ Hoja entregada. Tu profesor revisará los ejercicios marcados y asignará hasta 10 puntos.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo entregar la hoja de ejercicios.");
    } finally {
      setWorking(false);
    }
  }

  function toggleExercise(id: string) {
    if (!attempt || attempt.status !== "in_progress") return;
    setSelected((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
    setError(null);
    setMessage(null);
  }

  if (!ready) return <div className="empty-state">Preparando hoja de ejercicios...</div>;

  const active = attempt?.status === "in_progress";
  const finished = attempt?.status === "submitted" || attempt?.status === "timed_out";
  const reviewed = Boolean(attempt?.reviewed_at && attempt.grade_value !== null && attempt.grade_max !== null);
  const submittedLabel = formatDate(attempt?.submitted_at ?? null);
  const reviewedLabel = formatDate(attempt?.reviewed_at ?? null);

  return (
    <article className={styles.sheetCard}>
      <div className={styles.heading}>
        <div>
          <span className={styles.courseLabel}>{courseIcon} {courseName}</span>
          <h3>{sheet.title}</h3>
          <p>📊 Bloque {sheet.block_number} · 🎯 10 puntos académicos</p>
        </div>
        <span className={`${styles.status} ${reviewed ? styles.statusReviewed : active ? styles.statusActive : finished ? styles.statusSubmitted : ""}`}>
          {reviewed ? `✅ ${attempt?.grade_value}/${attempt?.grade_max}` : active ? "🟢 En curso" : finished ? "📤 Entregada" : "📄 Disponible"}
        </span>
      </div>

      <p className={styles.instructions}>{sheet.worksheet_content}</p>

      {!attempt ? (
        <div className={styles.startBox}>
          <div>
            <strong>{options.length} {options.length === 1 ? "ejercicio disponible" : "ejercicios disponibles"}</strong>
            <small>Ábrela cuando quieras marcar cuáles realizaste. Entrégala cuando tu selección esté lista para que el profesor pueda calificarla.</small>
          </div>
          <button className="primary-button" type="button" disabled={working} onClick={() => void startSheet()}>
            {working ? "Abriendo..." : "Abrir hoja"}
          </button>
        </div>
      ) : (
        <>
          <div className={styles.exerciseList}>
            {options.map((option) => {
              const checked = selected.includes(option.id);
              return (
                <label key={option.id} className={checked ? styles.exerciseChecked : styles.exerciseOption}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!active}
                    onChange={() => toggleExercise(option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>

          <div className={styles.summary}>
            <strong>{selected.length} de {options.length} marcados</strong>
            {active && <small>{saveState === "saving" ? "Guardando cambios..." : saveState === "saved" ? "Cambios guardados." : "Los cambios se guardan automáticamente."}</small>}
            {finished && !reviewed && <small>{submittedLabel ? `Entregada: ${submittedLabel}. ` : ""}Pendiente de calificación del profesor.</small>}
            {reviewed && (
              <small>
                Calificada por {attempt?.reviewer_name || "Profesor"}{reviewedLabel ? ` · ${reviewedLabel}` : ""}.
              </small>
            )}
          </div>

          {reviewed && (
            <div className={styles.gradeBox}>
              <div>
                <small>Calificación de la hoja</small>
                <strong>{attempt?.grade_value} / {attempt?.grade_max}</strong>
              </div>
              <p>{attempt?.feedback?.trim() || "Sin comentario adicional."}</p>
            </div>
          )}

          {active && (
            <div className={styles.submitRow}>
              <div>
                <strong>¿Tu lista ya está lista?</strong>
                <small>Después de entregarla ya no podrás cambiar las casillas de esta hoja.</small>
              </div>
              <button
                className="primary-button"
                type="button"
                disabled={working}
                onClick={() => {
                  if (window.confirm("¿Entregar esta hoja de ejercicios? Después no podrás cambiar la selección.")) {
                    void submitSheet();
                  }
                }}
              >
                {working ? "Entregando..." : "Entregar hoja"}
              </button>
            </div>
          )}
        </>
      )}

      {error && <div className="auth-message auth-error">{error}</div>}
      {message && <div className="auth-message auth-success">{message}</div>}
    </article>
  );
}

export default function StudentExerciseSheetList({
  courseId,
  courseName,
  courseIcon = "📚",
  isEssentialCourse = false,
}: Props) {
  const [sheets, setSheets] = useState<ExerciseSheet[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        if (!cancelled) setReady(true);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("stage, level")
        .eq("id", userId)
        .single();
      if (profileError) throw profileError;

      let sheetQuery = supabase
        .from("course_activities")
        .select("id, course_id, title, worksheet_content, question_blocks, points, block_number, opens_at, closes_at")
        .eq("course_id", courseId)
        .eq("activity_type", "exercise_sheet")
        .eq("status", "published")
        .order("block_number", { ascending: true });

      let practiceQuery = supabase
        .from("course_activities")
        .select("id, title, assignment_mode, opens_at, block_number, academic_stage, academic_level")
        .eq("course_id", courseId)
        .eq("activity_type", "practice")
        .eq("status", "published");

      if (!isEssentialCourse) {
        sheetQuery = sheetQuery.eq("academic_stage", profile.stage).eq("academic_level", profile.level);
        practiceQuery = practiceQuery.eq("academic_stage", profile.stage).eq("academic_level", profile.level);
      }

      const [sheetResponse, practiceResponse] = await Promise.all([sheetQuery, practiceQuery]);
      if (sheetResponse.error) throw sheetResponse.error;
      if (practiceResponse.error) throw practiceResponse.error;

      const loadedSheets = (sheetResponse.data ?? []) as ExerciseSheet[];
      const practices = (practiceResponse.data ?? []) as Practice[];
      const practiceIds = practices.map((practice) => practice.id);

      let assignedIds = new Set<string>();
      if (practiceIds.length > 0) {
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("course_activity_assignments")
          .select("activity_id")
          .eq("user_id", userId)
          .in("activity_id", practiceIds);
        if (assignmentError) throw assignmentError;
        assignedIds = new Set((assignmentData ?? []).map((row: { activity_id: string }) => row.activity_id));
      }

      const now = Date.now();
      const accessiblePracticeIds = new Set(
        practices
          .filter((practice) => {
            const opened = !practice.opens_at || new Date(practice.opens_at).getTime() <= now;
            const assigned = practice.assignment_mode === "course" || assignedIds.has(practice.id);
            return opened && assigned;
          })
          .map((practice) => practice.id),
      );

      const visibleSheets = loadedSheets
        .map((sheet) => {
          const questionBlocks = (sheet.question_blocks ?? []).map((question) => question.id === "exercise-sheet-selection"
            ? {
                ...question,
                options: (question.options ?? []).filter((option) => accessiblePracticeIds.has(option.id)),
              }
            : question);
          return { ...sheet, question_blocks: questionBlocks };
        })
        .filter((sheet) => {
          const selection = sheet.question_blocks.find((question) => question.id === "exercise-sheet-selection");
          return (selection?.options?.length ?? 0) > 0;
        });

      if (!cancelled) {
        setSheets(visibleSheets);
        setReady(true);
      }
    }

    setReady(false);
    setError(null);
    void load().catch((caughtError) => {
      if (cancelled) return;
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar las hojas de ejercicios.");
      setReady(true);
    });

    return () => { cancelled = true; };
  }, [courseId, isEssentialCourse]);

  const orderedSheets = useMemo(() => sheets.slice().sort((a, b) => a.block_number - b.block_number), [sheets]);

  if (!ready) return <div className="empty-state">Cargando hojas de ejercicios...</div>;
  if (error) return <div className="auth-message auth-error">{error}</div>;
  if (orderedSheets.length === 0) {
    return <div className="empty-state">Todavía no hay una Hoja de ejercicios creada por tu profesor para esta materia.</div>;
  }

  return (
    <div className={styles.list}>
      {orderedSheets.map((sheet) => (
        <ExerciseSheetRunner
          key={sheet.id}
          sheet={sheet}
          courseName={courseName}
          courseIcon={courseIcon}
        />
      ))}
    </div>
  );
}
