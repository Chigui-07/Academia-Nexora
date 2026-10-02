"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import styles from "../math/diagnostic.module.css";

type Question = {
  attempt_id: string;
  attempt_status: string;
  level_number: number;
  question_id: string;
  question_key: string;
  prompt: string;
  answer_type: string;
  difficulty: string;
  question_position: number;
  response: string | null;
  answered: boolean;
};

type SaveResult = {
  saved: boolean;
  attempt_status: string;
  current_level: number;
  level_completed: boolean;
};

type Level = {
  level_number: number;
  title: string;
};

type TopicSummary = {
  level: number;
  key: string;
  topic: string;
  correct?: number;
  total?: number;
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
  final_status: "completed" | "limit_reached";
  placement_level: number;
  placement_title: string;
  mastered_through_level: number;
  mastered_topics: TopicSummary[];
  reinforce_topics: TopicSummary[];
  level_summary: LevelSummary[];
};

export default function DiagnosticRunnerPage() {
  const [courseName, setCourseName] = useState("Diagnóstico");
  const [courseIcon, setCourseIcon] = useState("🧠");
  const [levels, setLevels] = useState<Level[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [status, setStatus] = useState("loading");
  const [level, setLevel] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex] ?? null;
  const answeredCount = useMemo(
    () => questions.filter((question) => question.answered).length,
    [questions],
  );
  const levelTitle = levels.find((item) => item.level_number === level)?.title ?? "Diagnóstico";
  const highestLevel = levels.length > 0 ? Math.max(...levels.map((item) => item.level_number)) : 6;

  async function loadResult(id: string) {
    const { data, error: resultError } = await supabase
      .from("diagnostic_results")
      .select("final_status, placement_level, placement_title, mastered_through_level, mastered_topics, reinforce_topics, level_summary")
      .eq("attempt_id", id)
      .maybeSingle();

    if (resultError) throw resultError;
    setResult((data as DiagnosticResult | null) ?? null);
  }

  async function loadQuestions(id: string) {
    const { data, error: loadError } = await supabase.rpc("get_diagnostic_questions", {
      p_attempt_id: id,
    });

    if (loadError) throw loadError;

    const rows = (data ?? []) as Question[];
    if (rows.length === 0) {
      setQuestions([]);
      return;
    }

    setQuestions(rows);
    setLevel(rows[0].level_number);
    setDrafts(
      Object.fromEntries(rows.map((question) => [question.question_id, question.response ?? ""])),
    );

    const firstUnanswered = rows.findIndex((question) => !question.answered);
    setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
  }

  useEffect(() => {
    async function start() {
      try {
        setError(null);
        const params = new URLSearchParams(window.location.search);
        const courseKey = params.get("course") ?? "";
        const requestId = params.get("request");

        if (!courseKey) {
          setStatus("error");
          setError("Falta identificar el curso del diagnóstico.");
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          goTo("/");
          return;
        }

        const [courseResponse, levelResponse] = await Promise.all([
          supabase
            .from("courses")
            .select("name, icon")
            .eq("course_key", courseKey)
            .maybeSingle(),
          supabase
            .from("diagnostic_levels")
            .select("level_number, title")
            .eq("course_key", courseKey)
            .order("level_number"),
        ]);

        if (courseResponse.error) throw courseResponse.error;
        if (levelResponse.error) throw levelResponse.error;

        if (courseResponse.data) {
          setCourseName(courseResponse.data.name);
          setCourseIcon(courseResponse.data.icon);
        }
        setLevels((levelResponse.data ?? []) as Level[]);

        const { data, error: startError } = await supabase.rpc("start_diagnostic", {
          p_course_key: courseKey,
          p_course_request_id: requestId || null,
        });

        if (startError) throw startError;

        const attempt = data?.[0] as
          | { attempt_id: string; status: string; current_level: number }
          | undefined;

        if (!attempt) throw new Error("No se pudo iniciar el diagnóstico.");

        setAttemptId(attempt.attempt_id);
        setStatus(attempt.status);
        setLevel(attempt.current_level);

        if (attempt.status === "in_progress") {
          await loadQuestions(attempt.attempt_id);
        } else if (attempt.status === "completed" || attempt.status === "limit_reached") {
          await loadResult(attempt.attempt_id);
        }
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "No se pudo abrir el diagnóstico.");
        setStatus("error");
      }
    }

    start();
  }, []);

  async function saveQuestion(question: Question, mode: "save" | "next" | "limit") {
    if (!attemptId) return null;

    const response = drafts[question.question_id] ?? "";
    if (mode !== "limit" && response.trim() === "") {
      setError("Escribe una respuesta o pulsa Mi límite si ya no sabes cómo continuar.");
      return null;
    }

    setBusy(true);
    setError(null);
    setSavedMessage(null);

    try {
      const { data, error: saveError } = await supabase.rpc("save_diagnostic_answer", {
        p_attempt_id: attemptId,
        p_question_id: question.question_id,
        p_response: response,
        p_action: mode,
      });

      if (saveError) throw saveError;

      const saveResult = data?.[0] as SaveResult | undefined;
      if (!saveResult) throw new Error("No se pudo guardar la respuesta.");

      if (mode !== "limit") {
        setQuestions((previous) =>
          previous.map((item) =>
            item.question_id === question.question_id
              ? { ...item, response: response.trim(), answered: true }
              : item,
          ),
        );
        setSavedMessage("Respuesta guardada");
      }

      if (mode === "limit") {
        setStatus(saveResult.attempt_status);
        await loadResult(attemptId);
        return saveResult;
      }

      if (saveResult.level_completed) {
        setStatus(saveResult.attempt_status);
        setLevel(saveResult.current_level);

        if (saveResult.attempt_status === "in_progress") {
          await loadQuestions(attemptId);
        } else if (saveResult.attempt_status === "completed") {
          await loadResult(attemptId);
        }
      }

      return saveResult;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo guardar la respuesta.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function goToQuestion(index: number) {
    if (!currentQuestion || index === currentIndex || busy) return;

    const draft = drafts[currentQuestion.question_id] ?? "";
    const stored = currentQuestion.response ?? "";

    if (draft.trim() !== "" && draft.trim() !== stored.trim()) {
      const saved = await saveQuestion(currentQuestion, "save");
      if (!saved) return;
    }

    setCurrentIndex(index);
    setSavedMessage(null);
    setError(null);
  }

  async function handleNext(event: FormEvent) {
    event.preventDefault();
    if (!currentQuestion || busy) return;

    const saveResult = await saveQuestion(currentQuestion, "next");
    if (!saveResult || saveResult.level_completed) return;

    const updatedAnswered = questions.map((question, index) =>
      index === currentIndex ? true : question.answered,
    );

    const sequential = currentIndex + 1;
    if (sequential < questions.length) {
      setCurrentIndex(sequential);
      return;
    }

    const firstPending = updatedAnswered.findIndex((answered) => !answered);
    if (firstPending >= 0) setCurrentIndex(firstPending);
  }

  async function handleLimit() {
    if (!currentQuestion || busy) return;

    const accepted = window.confirm(
      "¿Este es tu límite actual? El diagnóstico terminará aquí y no podrá repetirse.",
    );

    if (!accepted) return;
    await saveQuestion(currentQuestion, "limit");
  }

  if (status === "loading") {
    return (
      <AppShell>
        <div className="empty-state">Preparando tu diagnóstico de {courseName}...</div>
      </AppShell>
    );
  }

  if (status === "completed" || status === "limit_reached") {
    const masteredTopics = result?.mastered_topics ?? [];
    const reinforceTopics = result?.reinforce_topics ?? [];
    const attemptedLevels = (result?.level_summary ?? []).filter((item) => item.answered > 0);

    return (
      <AppShell>
        <div className={styles.finishedWrap}>
          <article className={styles.resultCard}>
            <div className={styles.resultHero}>
              <span className={styles.finishedIcon}>{status === "completed" ? "🏁" : courseIcon}</span>
              <p className="eyebrow">Diagnóstico finalizado · {courseName}</p>
              {result ? (
                <>
                  <small className={styles.resultLabel}>Tu ubicación estimada al comenzar es</small>
                  <h1>Nivel {result.placement_level}: {result.placement_title}</h1>
                  <p>
                    {result.mastered_through_level >= highestLevel
                      ? `Mostraste dominio de los ${highestLevel} niveles incluidos en este diagnóstico.`
                      : result.mastered_through_level > 0
                        ? `Tu base quedó dominada hasta el Nivel ${result.mastered_through_level}. Desde aquí podremos decidir qué reforzar antes de avanzar.`
                        : `Conviene comenzar reforzando desde las bases para construir una mejor progresión en ${courseName}.`}
                  </p>
                </>
              ) : (
                <>
                  <h1>{status === "completed" ? "Completaste todos los niveles" : "Registramos tu límite actual"}</h1>
                  <p>Tus respuestas quedaron guardadas y el resultado permanecerá disponible en Diagnósticos.</p>
                </>
              )}
            </div>

            {result && (
              <>
                <div className={styles.resultColumns}>
                  <section>
                    <h2>✅ Lo que dominabas</h2>
                    {masteredTopics.length > 0 ? (
                      <div className={styles.resultChips}>
                        {masteredTopics.map((topic) => (
                          <span className={styles.masteredChip} key={`${topic.level}-${topic.key}`}>{topic.topic}</span>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.resultEmpty}>Aún no había un tema confirmado como dominado.</p>
                    )}
                  </section>

                  <section>
                    <h2>📚 Lo que conviene reforzar</h2>
                    {reinforceTopics.length > 0 ? (
                      <div className={styles.resultChips}>
                        {reinforceTopics.map((topic) => (
                          <span className={styles.reinforceChip} key={`${topic.level}-${topic.key}`}>{topic.topic}</span>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.resultEmpty}>No detectamos temas de refuerzo dentro de lo que respondiste.</p>
                    )}
                  </section>
                </div>

                {attemptedLevels.length > 0 && (
                  <div className={styles.levelSummary}>
                    <h2>Resumen por nivel</h2>
                    {attemptedLevels.map((item) => (
                      <div className={styles.levelSummaryRow} key={item.level}>
                        <div>
                          <strong>Nivel {item.level}: {item.title}</strong>
                          <span>{item.correct} correctas · {item.answered} respondidas de {item.total}</span>
                        </div>
                        <b>{item.percentage}%</b>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className={styles.finishedActions}>
              <button className="primary-button" type="button" onClick={() => goTo("/diagnostics/")}>Ver mis diagnósticos</button>
              <button className="secondary-button" type="button" onClick={() => goTo("/courses/")}>Volver a Cursos</button>
            </div>
          </article>
        </div>
      </AppShell>
    );
  }

  if (status === "error") {
    return (
      <AppShell>
        <article className="panel">
          <h2>No pudimos abrir el diagnóstico</h2>
          <div className="auth-message auth-error">{error}</div>
          <button className="secondary-button" type="button" onClick={() => goTo("/diagnostics/")}>Volver a Diagnósticos</button>
        </article>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className={styles.header}>
        <div>
          <p className="eyebrow">Diagnóstico único · {courseIcon} {courseName}</p>
          <h1>Nivel {level}: {levelTitle}</h1>
          <p>Responde con calma. No verás si una respuesta es correcta o incorrecta durante la prueba.</p>
        </div>
        <span className={styles.progressBadge}>{answeredCount}/{questions.length} respondidas</span>
      </div>

      <div className={styles.honestyNote}>
        <span>🧠</span>
        <div>
          <strong>Sé honesto contigo mismo.</strong>
          <p>Si llegas a una parte que ya no sabes resolver, pulsa <b>Mi límite</b>. No cuenta como error; nos ayuda a encontrar desde dónde enseñarte.</p>
        </div>
      </div>

      <div className={styles.workspace}>
        <aside className={styles.questionNavigator}>
          <div className={styles.navigatorHeading}>
            <div>
              <small>Nivel {level}</small>
              <strong>Preguntas</strong>
            </div>
            <span>{questions.length}</span>
          </div>

          <div className={styles.numberGrid}>
            {questions.map((question, index) => {
              const active = index === currentIndex;
              return (
                <button
                  key={question.question_id}
                  type="button"
                  className={`${styles.numberCard} ${question.answered ? styles.numberAnswered : ""} ${active ? styles.numberActive : ""}`}
                  onClick={() => goToQuestion(index)}
                  aria-label={`Ir a la pregunta ${question.question_position}`}
                >
                  {question.question_position}
                </button>
              );
            })}
          </div>

          <div className={styles.legend}>
            <span><i className={styles.legendCurrent} /> Actual</span>
            <span><i className={styles.legendAnswered} /> Respondida</span>
          </div>
        </aside>

        <section className={styles.paper}>
          {currentQuestion ? (
            <form onSubmit={handleNext} className={styles.paperContent}>
              <div className={styles.paperTopline}>
                <span>Pregunta {currentQuestion.question_position}</span>
                <span>Nivel {level}</span>
              </div>

              <div className={styles.questionPrompt}>{currentQuestion.prompt}</div>

              <label className={styles.answerLabel} htmlFor="diagnostic-answer">Tu respuesta</label>
              <input
                id="diagnostic-answer"
                className={styles.answerInput}
                value={drafts[currentQuestion.question_id] ?? ""}
                onChange={(event) => {
                  setDrafts((previous) => ({
                    ...previous,
                    [currentQuestion.question_id]: event.target.value,
                  }));
                  setSavedMessage(null);
                  setError(null);
                }}
                autoComplete="off"
                placeholder="Escribe tu respuesta aquí..."
                autoFocus
              />

              <div className={styles.feedbackLine}>
                {error ? <span className={styles.errorText}>{error}</span> : null}
                {!error && savedMessage ? <span className={styles.savedText}>✓ {savedMessage}</span> : null}
              </div>

              <div className={styles.actions}>
                <button className={styles.limitButton} type="button" onClick={handleLimit} disabled={busy}>
                  Mi límite
                </button>
                <button className="primary-button" type="submit" disabled={busy}>
                  {busy ? "Guardando..." : "Siguiente"}
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.paperContent}>No encontramos preguntas para este nivel.</div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
