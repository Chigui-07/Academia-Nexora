"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./diagnostic.module.css";

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

const levelTitles: Record<number, string> = {
  1: "Operaciones básicas",
  2: "Números, fracciones y decimales",
  3: "Proporciones y porcentajes",
  4: "Álgebra básica",
  5: "Álgebra intermedia y geometría",
  6: "Razonamiento avanzado",
};

export default function MathDiagnosticPage() {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [status, setStatus] = useState("loading");
  const [level, setLevel] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex] ?? null;
  const answeredCount = useMemo(
    () => questions.filter((question) => question.answered).length,
    [questions]
  );

  async function loadQuestions(id: string) {
    const { data, error: loadError } = await supabase.rpc("get_math_diagnostic_questions", {
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
      Object.fromEntries(rows.map((question) => [question.question_id, question.response ?? ""]))
    );

    const firstUnanswered = rows.findIndex((question) => !question.answered);
    setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
  }

  useEffect(() => {
    async function start() {
      try {
        setError(null);
        const requestId = new URLSearchParams(window.location.search).get("request");

        if (!requestId) {
          setStatus("missing_request");
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          goTo("/");
          return;
        }

        const { data, error: startError } = await supabase.rpc("start_math_diagnostic", {
          p_course_request_id: requestId,
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
        }
      } catch (caughtError) {
        const raw = caughtError instanceof Error ? caughtError.message : "No se pudo abrir el diagnóstico.";
        setError(
          raw.includes("invalid_math_course_request")
            ? "Este diagnóstico solo está disponible para una solicitud propia de Matemática que tenga el diagnóstico activado."
            : raw
        );
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
      const { data, error: saveError } = await supabase.rpc("save_math_diagnostic_answer", {
        p_attempt_id: attemptId,
        p_question_id: question.question_id,
        p_response: response,
        p_action: mode,
      });

      if (saveError) throw saveError;

      const result = data?.[0] as SaveResult | undefined;
      if (!result) throw new Error("No se pudo guardar la respuesta.");

      if (mode !== "limit") {
        setQuestions((previous) =>
          previous.map((item) =>
            item.question_id === question.question_id
              ? { ...item, response: response.trim(), answered: true }
              : item
          )
        );
        setSavedMessage("Respuesta guardada");
      }

      if (mode === "limit") {
        setStatus(result.attempt_status);
        return result;
      }

      if (result.level_completed) {
        setStatus(result.attempt_status);
        setLevel(result.current_level);

        if (result.attempt_status === "in_progress") {
          await loadQuestions(attemptId);
        }
      }

      return result;
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

    const result = await saveQuestion(currentQuestion, "next");
    if (!result || result.level_completed) return;

    const updatedAnswered = questions.map((question, index) =>
      index === currentIndex ? true : question.answered
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
      "¿Este es tu límite actual? El diagnóstico terminará aquí y no podrá repetirse."
    );

    if (!accepted) return;
    await saveQuestion(currentQuestion, "limit");
  }

  if (status === "loading") {
    return (
      <AppShell>
        <div className="empty-state">Preparando tu diagnóstico de Matemática...</div>
      </AppShell>
    );
  }

  if (status === "missing_request") {
    return (
      <AppShell>
        <article className="panel">
          <h2>Diagnóstico de Matemática</h2>
          <p>Abre el diagnóstico desde una solicitud de Matemática para que podamos relacionarlo con tu cuenta.</p>
          <button className="secondary-button" type="button" onClick={() => goTo("/courses/")}>Volver a Cursos</button>
        </article>
      </AppShell>
    );
  }

  if (status === "completed" || status === "limit_reached") {
    return (
      <AppShell>
        <div className={styles.finishedWrap}>
          <article className={styles.finishedCard}>
            <span className={styles.finishedIcon}>{status === "completed" ? "🏁" : "🧠"}</span>
            <p className="eyebrow">Diagnóstico finalizado</p>
            <h1>{status === "completed" ? "Completaste todos los niveles" : "Registramos tu límite actual"}</h1>
            <p>
              Tus respuestas quedaron guardadas. Este diagnóstico es de una sola vez y se utilizará para decidir desde qué punto conviene comenzar Matemática.
            </p>
            <button className="primary-button" type="button" onClick={() => goTo("/courses/")}>Volver a Cursos</button>
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
          <button className="secondary-button" type="button" onClick={() => goTo("/courses/")}>Volver a Cursos</button>
        </article>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className={styles.header}>
        <div>
          <p className="eyebrow">Diagnóstico único · Matemática</p>
          <h1>Nivel {level}: {levelTitles[level] ?? "Diagnóstico"}</h1>
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
