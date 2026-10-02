"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./AITeacherManager.module.css";

type ContentKind = "lesson" | "notebook_task" | "virtual_task" | "practice";
type Difficulty = "fundamentos" | "intermedio" | "avanzado";
type QuestionType = "written" | "single_choice" | "multiple_choice" | "true_false";

type Course = {
  id: string;
  name: string;
  icon: string;
  category: string;
};

type DraftQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: { id: string; label: string }[];
  placeholder?: string;
};

type AIDraft = {
  title: string;
  unit_title: string;
  lesson_content: string;
  examples: string;
  resources: string;
  worksheet_content: string;
  points: number | null;
  block_number: number;
  max_attempts: number;
  time_limit_minutes: number | null;
  question_blocks: DraftQuestion[];
  answer_key: Record<string, string | string[] | boolean | null>;
};

type AIStatus = {
  allowed: boolean;
  configured: boolean;
  model: string;
};

type GenerateResponse = {
  configured: boolean;
  model: string;
  kind: ContentKind;
  course: { id: string; name: string; category: string };
  draft: AIDraft;
};

const kindLabels: Record<ContentKind, string> = {
  lesson: "📖 Clase",
  notebook_task: "📓 Tarea de cuaderno",
  virtual_task: "💻 Tarea virtual",
  practice: "✏️ Ejercicio práctico",
};

const questionTypeLabels: Record<QuestionType, string> = {
  written: "Respuesta escrita",
  single_choice: "Elección única",
  multiple_choice: "Selección múltiple",
  true_false: "Verdadero o falso",
};

function friendlyError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "");
    if (message) return message;
  }
  return fallback;
}

export default function AITeacherManager() {
  const [allowed, setAllowed] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [model, setModel] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [kind, setKind] = useState<ContentKind>("lesson");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("fundamentos");
  const [questionCount, setQuestionCount] = useState("5");
  const [points, setPoints] = useState("10");
  const [blockNumber, setBlockNumber] = useState("1");
  const [maxAttempts, setMaxAttempts] = useState("1");
  const [timeLimit, setTimeLimit] = useState("");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [draft, setDraft] = useState<AIDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedCourse = useMemo(() => courses.find((course) => course.id === courseId) ?? null, [courses, courseId]);
  const isLesson = kind === "lesson";
  const isPractice = kind === "practice";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: accessData, error: accessError } = await supabase.rpc("has_ai_teacher_access");
      if (accessError) throw accessError;
      if (accessData !== true) {
        if (!cancelled) setReady(true);
        return;
      }

      const [courseResponse, statusResponse] = await Promise.all([
        supabase
          .from("courses")
          .select("id, name, icon, category")
          .eq("active", true)
          .order("name"),
        supabase.functions.invoke("nexora-ai-teacher", { body: { action: "status" } }),
      ]);

      if (courseResponse.error) throw courseResponse.error;
      if (cancelled) return;

      const loadedCourses = (courseResponse.data ?? []) as Course[];
      setAllowed(true);
      setCourses(loadedCourses);
      if (loadedCourses[0]) setCourseId((current) => current || loadedCourses[0].id);

      if (statusResponse.error) {
        setConfigured(false);
        setError("El Profesor IA está instalado, pero no se pudo comprobar su conexión con el modelo.");
      } else {
        const status = statusResponse.data as AIStatus;
        setConfigured(Boolean(status?.configured));
        setModel(status?.model ?? "");
      }

      setReady(true);
    }

    load().catch((caughtError) => {
      if (!cancelled) {
        setError(friendlyError(caughtError, "No se pudo cargar el Profesor IA."));
        setReady(true);
      }
    });

    return () => { cancelled = true; };
  }, []);

  function changeKind(nextKind: ContentKind) {
    setKind(nextKind);
    setDraft(null);
    setSaved(false);
    setMessage(null);
    setError(null);
    if (nextKind === "practice") {
      setMaxAttempts("3");
      setPoints("10");
    } else if (nextKind === "lesson") {
      setMaxAttempts("1");
    } else {
      setMaxAttempts("1");
    }
  }

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSaved(false);

    if (!configured) {
      setError("Primero falta conectar la clave de API del Profesor IA en Supabase.");
      return;
    }
    if (!courseId) {
      setError("Selecciona un curso.");
      return;
    }
    if (!topic.trim()) {
      setError("Escribe el tema que quieres trabajar.");
      return;
    }

    setGenerating(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("nexora-ai-teacher", {
        body: {
          action: "generate",
          kind,
          course_id: courseId,
          topic: topic.trim(),
          difficulty,
          question_count: Number(questionCount),
          points: Number(points),
          block_number: Number(blockNumber),
          max_attempts: Number(maxAttempts),
          time_limit_minutes: timeLimit.trim() === "" ? 0 : Number(timeLimit),
          extra_instructions: extraInstructions.trim(),
        },
      });

      if (invokeError) throw invokeError;
      const response = data as GenerateResponse;
      if (!response?.draft) throw new Error("La IA no devolvió una propuesta válida.");

      setDraft(response.draft);
      setModel(response.model || model);
      setMessage("✨ Propuesta generada. Revísala; al aprobarla se publicará únicamente para tu cuenta.");
    } catch (caughtError) {
      setDraft(null);
      setError(friendlyError(caughtError, "No se pudo generar el contenido."));
    } finally {
      setGenerating(false);
    }
  }

  async function saveDraft() {
    if (!draft || !courseId) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const { error: saveError } = await supabase.rpc("save_ai_teacher_draft", {
        p_kind: kind,
        p_course_id: courseId,
        p_draft: draft,
      });
      if (saveError) throw saveError;

      setSaved(true);
      setMessage(
        kind === "lesson"
          ? "✅ Clase publicada y asignada exclusivamente a tu cuenta. Ya aparece dentro del curso para que la estudies."
          : "✅ Actividad publicada y asignada exclusivamente a tu cuenta. Ningún otro estudiante la recibirá.",
      );
    } catch (caughtError) {
      setError(friendlyError(caughtError, "No se pudo publicar el contenido personal."));
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <section className="panel"><div className="empty-state">Preparando Profesor IA...</div></section>;
  if (!allowed) return null;

  return (
    <section className={`panel ${styles.wrapper}`}>
      <div className={styles.header}>
        <div>
          <p className="eyebrow">Herramienta privada · solo tu cuenta</p>
          <h2>🤖 Profesor IA</h2>
          <p className="muted-copy">
            Prepara tus propias clases, tareas y ejercicios. Tú revisas la propuesta y, al aprobarla, Nexora la publica únicamente para tu cuenta; los demás estudiantes siguen recibiendo el contenido que tú publiques como profesor.
          </p>
        </div>
        <div className={configured ? styles.connectedBadge : styles.pendingBadge}>
          {configured ? "● IA personal conectada" : "○ Conexión pendiente"}
        </div>
      </div>

      {!configured && (
        <div className={styles.setupNotice}>
          <strong>Falta un único paso de conexión.</strong>
          <span>
            La función segura ya está instalada en Supabase, pero necesita el secreto <code>OPENAI_API_KEY</code>. Esa clave debe guardarse como secreto del servidor; no debe ponerse en GitHub, en el navegador ni enviarse por chat.
          </span>
        </div>
      )}

      <div className={styles.workspace}>
        <form className={styles.formPanel} onSubmit={generate}>
          <div className={styles.formHeading}>
            <div>
              <p className="eyebrow">Nueva propuesta personal</p>
              <h3>¿Qué quieres que tu profesor prepare?</h3>
            </div>
            {model && <span className={styles.modelBadge}>{model}</span>}
          </div>

          <label className={styles.field}>
            Curso
            <select value={courseId} onChange={(event) => { setCourseId(event.target.value); setDraft(null); setSaved(false); }}>
              {courses.map((course) => (
                <option value={course.id} key={course.id}>{course.icon} {course.name}</option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            Tipo de contenido
            <select value={kind} onChange={(event) => changeKind(event.target.value as ContentKind)}>
              {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>

          <label className={styles.field}>
            Tema
            <input value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={300} placeholder="Ej. ecuaciones de primer grado" />
          </label>

          <label className={styles.field}>
            Nivel de dificultad
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}>
              <option value="fundamentos">🌱 Fundamentos</option>
              <option value="intermedio">📘 Intermedio</option>
              <option value="avanzado">🧠 Avanzado</option>
            </select>
          </label>

          {!isLesson && (
            <div className={styles.settingGrid}>
              <label className={styles.field}>
                Preguntas
                <input type="number" min="1" max="12" value={questionCount} onChange={(event) => setQuestionCount(event.target.value)} />
              </label>

              {!isPractice && (
                <label className={styles.field}>
                  Punteo
                  <input type="number" min="0" max="100" value={points} onChange={(event) => setPoints(event.target.value)} />
                </label>
              )}

              <label className={styles.field}>
                Bloque
                <select value={blockNumber} onChange={(event) => setBlockNumber(event.target.value)}>
                  <option value="1">Bloque 1</option>
                  <option value="2">Bloque 2</option>
                  <option value="3">Bloque 3</option>
                  <option value="4">Bloque 4</option>
                </select>
              </label>

              <label className={styles.field}>
                Intentos
                <input type="number" min="1" max="20" value={maxAttempts} onChange={(event) => setMaxAttempts(event.target.value)} />
              </label>

              <label className={styles.field}>
                Tiempo (min)
                <input type="number" min="1" max="240" value={timeLimit} onChange={(event) => setTimeLimit(event.target.value)} placeholder="Sin límite" />
              </label>
            </div>
          )}

          <label className={styles.field}>
            Indicaciones adicionales
            <textarea
              value={extraInstructions}
              onChange={(event) => setExtraInstructions(event.target.value)}
              maxLength={1600}
              placeholder="Ej. usa ejemplos cotidianos, empieza con teoría breve y evita preguntas demasiado largas..."
            />
          </label>

          {selectedCourse && (
            <div className={styles.courseHint}>
              {selectedCourse.icon} <strong>{selectedCourse.name}</strong> · {selectedCourse.category}
            </div>
          )}

          <button className="primary-button" type="submit" disabled={generating || !configured || !courseId}>
            {generating ? "Generando propuesta..." : draft ? "✨ Regenerar propuesta" : "✨ Generar propuesta"}
          </button>
        </form>

        <div className={styles.previewPanel}>
          {!draft ? (
            <div className={styles.previewEmpty}>
              <span>🤖</span>
              <strong>Aquí aparecerá la propuesta</strong>
              <p>Tu Profesor IA prepara el contenido. Nada se añade a tus cursos hasta que tú pulses Publicar para mí.</p>
            </div>
          ) : (
            <>
              <div className={styles.previewHeading}>
                <div>
                  <p className="eyebrow">Vista previa personal</p>
                  <h3>{draft.title}</h3>
                </div>
                <span className={styles.draftBadge}>Solo para ti</span>
              </div>

              {isLesson ? (
                <div className={styles.lessonPreview}>
                  {draft.unit_title && <div><small>Unidad o tema</small><strong>{draft.unit_title}</strong></div>}
                  <section>
                    <h4>Explicación</h4>
                    <p>{draft.lesson_content}</p>
                  </section>
                  {draft.examples && <section><h4>Ejemplos guiados</h4><p>{draft.examples}</p></section>}
                  {draft.resources && <section><h4>Recursos o notas</h4><p>{draft.resources}</p></section>}
                </div>
              ) : (
                <div className={styles.activityPreview}>
                  <div className={styles.metaRow}>
                    <span>📚 Bloque {draft.block_number}</span>
                    <span>🔁 {draft.max_attempts} intento{draft.max_attempts === 1 ? "" : "s"}</span>
                    {isPractice ? <span>🎯 Calificación /100</span> : <span>🎯 {draft.points ?? 0} pts</span>}
                    {draft.time_limit_minutes && <span>⏱️ {draft.time_limit_minutes} min</span>}
                  </div>

                  {draft.worksheet_content && (
                    <section className={styles.instructions}>
                      <h4>Instrucciones</h4>
                      <p>{draft.worksheet_content}</p>
                    </section>
                  )}

                  <div className={styles.questionList}>
                    {draft.question_blocks.map((question, index) => (
                      <article className={styles.questionCard} key={question.id}>
                        <div className={styles.questionTopline}>
                          <strong>Pregunta {index + 1}</strong>
                          <span>{questionTypeLabels[question.type]}</span>
                        </div>
                        <p>{question.prompt}</p>
                        {question.options && question.options.length > 0 && (
                          <div className={styles.optionList}>
                            {question.options.map((option) => <span key={option.id}>○ {option.label}</span>)}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>

                  <div className={styles.answerKeyNote}>🔐 La clave de respuestas se guarda en la zona privada de Supabase y no se muestra durante el intento.</div>
                </div>
              )}

              <div className={styles.previewActions}>
                <button className="primary-button" type="button" onClick={saveDraft} disabled={saving || saved}>
                  {saving ? "Publicando..." : saved ? "✓ Publicado para mí" : "Publicar para mí"}
                </button>
                <button className="secondary-button" type="button" onClick={() => { setDraft(null); setSaved(false); setMessage(null); }}>
                  Descartar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {message && <div className="auth-message auth-success">{message}</div>}
      {error && <div className="auth-message auth-error">{error}</div>}
    </section>
  );
}
