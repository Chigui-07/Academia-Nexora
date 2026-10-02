"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import ActivityQuestionBuilder from "./ActivityQuestionBuilder";
import ActivitySheet from "./ActivitySheet";
import { ActivityAnswerKey, ActivityQuestionBlock } from "@/lib/activityQuestions";
import { supabase } from "@/lib/supabase";
import styles from "./TeacherActivityManager.module.css";

type ActivityType = "notebook_task" | "virtual_task" | "practice";
type ActivityStatus = "draft" | "published";
type AssignmentMode = "course" | "selected";

type Course = { id: string; name: string; icon: string };
type CourseStudent = { user_id: string; display_name: string; student_code: string };

type Activity = {
  id: string;
  course_id: string;
  created_by: string;
  activity_type: ActivityType;
  title: string;
  worksheet_content: string;
  question_blocks: ActivityQuestionBlock[];
  points: number | null;
  opens_at: string | null;
  closes_at: string | null;
  time_limit_minutes: number | null;
  max_attempts: number;
  block_number: number;
  assignment_mode: AssignmentMode;
  status: ActivityStatus;
  created_at: string;
};

const typeLabels: Record<ActivityType, string> = {
  notebook_task: "Tarea de cuaderno",
  virtual_task: "Tarea virtual",
  practice: "Ejercicio práctico",
};

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function TeacherActivityManager() {
  const [isTeacher, setIsTeacher] = useState(false);
  const [ready, setReady] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [courseStudents, setCourseStudents] = useState<CourseStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [courseId, setCourseId] = useState("");
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>("course");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [activityType, setActivityType] = useState<ActivityType>("notebook_task");
  const [title, setTitle] = useState("");
  const [points, setPoints] = useState("10");
  const [blockNumber, setBlockNumber] = useState("1");
  const [maxAttempts, setMaxAttempts] = useState("1");
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [worksheet, setWorksheet] = useState("");
  const [questions, setQuestions] = useState<ActivityQuestionBlock[]>([]);
  const [answerKey, setAnswerKey] = useState<ActivityAnswerKey>({});
  const [status, setStatus] = useState<ActivityStatus>("draft");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const courseMap = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);

  async function loadData() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) return;

    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    const teacher = (roleData ?? []).some((row) => row.role === "teacher");
    setIsTeacher(teacher);

    if (!teacher) {
      setReady(true);
      return;
    }

    const [courseResponse, activityResponse] = await Promise.all([
      supabase.from("courses").select("id, name, icon").eq("active", true).order("name"),
      supabase
        .from("course_activities")
        .select("id, course_id, created_by, activity_type, title, worksheet_content, question_blocks, points, opens_at, closes_at, time_limit_minutes, max_attempts, block_number, assignment_mode, status, created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (courseResponse.error) throw courseResponse.error;
    if (activityResponse.error) throw activityResponse.error;

    const loadedCourses = (courseResponse.data ?? []) as Course[];
    setCourses(loadedCourses);
    setActivities((activityResponse.data ?? []) as Activity[]);
    if (!courseId && loadedCourses[0]) setCourseId(loadedCourses[0].id);
    setReady(true);
  }

  useEffect(() => {
    loadData().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo cargar el panel del profesor.");
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isTeacher || !courseId) {
      setCourseStudents([]);
      return;
    }

    let cancelled = false;
    async function loadStudents() {
      setStudentsLoading(true);
      try {
        const { data, error: studentsError } = await supabase.rpc("get_course_students", { p_course_id: courseId });
        if (cancelled) return;
        if (studentsError) {
          setCourseStudents([]);
          setError("No se pudo cargar la lista de estudiantes del curso.");
          return;
        }
        setCourseStudents((data ?? []) as CourseStudent[]);
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    }

    void loadStudents();
    return () => { cancelled = true; };
  }, [isTeacher, courseId]);

  function resetForm() {
    setEditingId(null);
    setAssignmentMode("course");
    setSelectedUserIds([]);
    setActivityType("notebook_task");
    setTitle("");
    setPoints("10");
    setBlockNumber("1");
    setMaxAttempts("1");
    setOpensAt("");
    setClosesAt("");
    setTimeLimit("");
    setWorksheet("");
    setQuestions([]);
    setAnswerKey({});
    setStatus("draft");
    setPreviewOpen(false);
    setMessage(null);
    setError(null);
  }

  function toggleStudent(userId: string) {
    setSelectedUserIds((current) => current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]);
  }

  async function editActivity(activity: Activity) {
    setEditingId(activity.id);
    setCourseId(activity.course_id);
    setAssignmentMode(activity.assignment_mode ?? "course");
    setActivityType(activity.activity_type);
    setTitle(activity.title);
    setPoints(activity.points === null ? "" : String(activity.points));
    setBlockNumber(String(activity.block_number ?? 1));
    setMaxAttempts(String(activity.max_attempts ?? 1));
    setOpensAt(toLocalInput(activity.opens_at));
    setClosesAt(toLocalInput(activity.closes_at));
    setTimeLimit(activity.time_limit_minutes === null ? "" : String(activity.time_limit_minutes));
    setWorksheet(activity.worksheet_content);
    setQuestions(activity.question_blocks ?? []);
    setStatus(activity.status);
    setPreviewOpen(false);
    setMessage("Editando actividad existente.");
    setError(null);

    const [keyResponse, assignmentResponse] = await Promise.all([
      supabase.rpc("get_course_activity_answer_key", { p_activity_id: activity.id }),
      supabase.rpc("get_course_activity_assignments", { p_activity_id: activity.id }),
    ]);

    if (keyResponse.error) {
      setAnswerKey({});
      setError("La actividad abrió, pero no se pudo cargar su clave de respuestas.");
    } else {
      setAnswerKey((keyResponse.data ?? {}) as ActivityAnswerKey);
    }

    if (assignmentResponse.error) {
      setSelectedUserIds([]);
      setError("La actividad abrió, pero no se pudo cargar a quién está asignada.");
    } else {
      setSelectedUserIds((assignmentResponse.data ?? []) as string[]);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validatePublishedQuestions() {
    if (status !== "published") return;
    for (const [index, question] of questions.entries()) {
      if (!question.prompt.trim()) throw new Error(`Escribe el enunciado de la pregunta ${index + 1}.`);

      if (question.type === "single_choice" || question.type === "multiple_choice") {
        const options = question.options ?? [];
        if (options.length < 2 || options.some((option) => !option.label.trim())) {
          throw new Error(`Completa al menos dos opciones en la pregunta ${index + 1}.`);
        }
      }
      if (question.type === "single_choice" && typeof answerKey[question.id] !== "string") {
        throw new Error(`Marca la respuesta correcta de la pregunta ${index + 1}.`);
      }
      if (question.type === "multiple_choice" && (!Array.isArray(answerKey[question.id]) || (answerKey[question.id] as string[]).length === 0)) {
        throw new Error(`Marca al menos una respuesta correcta en la pregunta ${index + 1}.`);
      }
      if (question.type === "true_false" && typeof answerKey[question.id] !== "boolean") {
        throw new Error(`Selecciona Verdadero o Falso como respuesta correcta en la pregunta ${index + 1}.`);
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) throw new Error("Tu sesión terminó. Inicia sesión nuevamente.");
      if (!courseId) throw new Error("Selecciona un curso.");
      if (!title.trim()) throw new Error("Escribe un título para la actividad.");
      if (!worksheet.trim() && questions.length === 0) throw new Error("Agrega instrucciones o al menos una pregunta a la actividad.");
      if (assignmentMode === "selected" && selectedUserIds.length === 0) throw new Error("Selecciona al menos un estudiante para esta actividad.");

      validatePublishedQuestions();

      const pointsValue = activityType === "practice" ? null : Number(points);
      if (
        activityType !== "practice" &&
        (pointsValue === null || !Number.isFinite(pointsValue) || pointsValue < 0 || pointsValue > 100)
      ) {
        throw new Error("El punteo debe estar entre 0 y 100.");
      }

      const attemptsValue = Number(maxAttempts);
      if (!Number.isInteger(attemptsValue) || attemptsValue < 1 || attemptsValue > 20) {
        throw new Error("Los intentos permitidos deben estar entre 1 y 20.");
      }

      const blockValue = Number(blockNumber);
      if (!Number.isInteger(blockValue) || blockValue < 1 || blockValue > 4) {
        throw new Error("Selecciona un bloque entre 1 y 4.");
      }

      const timerValue = timeLimit.trim() === "" ? null : Number(timeLimit);
      if (timerValue !== null && (!Number.isInteger(timerValue) || timerValue < 1 || timerValue > 1440)) {
        throw new Error("El cronómetro debe estar entre 1 y 1440 minutos.");
      }
      if (opensAt && closesAt && new Date(closesAt) <= new Date(opensAt)) {
        throw new Error("La fecha de cierre debe ser posterior a la fecha de apertura.");
      }

      const payload = {
        course_id: courseId,
        activity_type: activityType,
        title: title.trim(),
        worksheet_content: worksheet,
        question_blocks: questions,
        points: pointsValue,
        block_number: blockValue,
        max_attempts: attemptsValue,
        opens_at: opensAt ? new Date(opensAt).toISOString() : null,
        closes_at: closesAt ? new Date(closesAt).toISOString() : null,
        time_limit_minutes: timerValue,
        assignment_mode: assignmentMode,
        status,
      };

      let activityId = editingId;
      if (editingId) {
        const { error: updateError } = await supabase.from("course_activities").update(payload).eq("id", editingId);
        if (updateError) throw updateError;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("course_activities")
          .insert({ ...payload, created_by: session.user.id })
          .select("id")
          .single();
        if (insertError) throw insertError;
        activityId = inserted.id;
      }

      if (!activityId) throw new Error("No se pudo identificar la actividad guardada.");

      const [questionsResponse, assignmentsResponse] = await Promise.all([
        supabase.rpc("save_course_activity_questions", {
          p_activity_id: activityId,
          p_question_blocks: questions,
          p_answer_key: answerKey,
        }),
        supabase.rpc("save_course_activity_assignments", {
          p_activity_id: activityId,
          p_assignment_mode: assignmentMode,
          p_user_ids: assignmentMode === "selected" ? selectedUserIds : [],
        }),
      ]);
      if (questionsResponse.error) throw questionsResponse.error;
      if (assignmentsResponse.error) throw assignmentsResponse.error;

      setMessage(editingId ? "Actividad actualizada correctamente." : status === "published" ? "Actividad publicada correctamente." : "Borrador guardado correctamente.");
      resetForm();
      setMessage(status === "published" ? "Actividad publicada correctamente." : "Actividad guardada correctamente.");
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo guardar la actividad.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <div className="empty-state">Cargando herramientas del profesor...</div>;
  if (!isTeacher) return null;

  const previewCourse = courseMap.get(courseId);
  const previewPoints = activityType === "practice" || points.trim() === "" ? null : Number(points);
  const previewTimer = timeLimit.trim() === "" ? null : Number(timeLimit);
  const previewAttempts = Number(maxAttempts) || 1;

  return (
    <section className={styles.wrapper}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Profesor</p>
          <h2>👨‍🏫 Crear y gestionar actividades</h2>
          <p className="muted-copy">Combina preguntas, fechas, punteo, bloque, cronómetro e intentos, y decide exactamente quién recibe cada actividad.</p>
        </div>
      </div>

      <form className={styles.builder} onSubmit={handleSubmit}>
        <div className={styles.settingsPanel}>
          <h3>{editingId ? "Editar actividad" : "Nueva actividad"}</h3>

          <label>
            Curso
            <select value={courseId} onChange={(event) => { setCourseId(event.target.value); setSelectedUserIds([]); }} required>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.icon} {course.name}</option>)}
            </select>
          </label>

          <label>
            👥 Asignar a
            <select value={assignmentMode} onChange={(event) => {
              const value = event.target.value as AssignmentMode;
              setAssignmentMode(value);
              if (value === "course") setSelectedUserIds([]);
            }}>
              <option value="course">Todos los estudiantes del curso</option>
              <option value="selected">Estudiantes específicos</option>
            </select>
            <small>Solo los estudiantes elegidos podrán ver e iniciar una actividad individual.</small>
          </label>

          {assignmentMode === "selected" && (
            <div className={styles.studentPicker}>
              <div className={styles.studentPickerHeader}>
                <strong>Estudiantes inscritos</strong>
                <span>{selectedUserIds.length} seleccionados</span>
              </div>
              {studentsLoading ? <small>Cargando estudiantes...</small> : courseStudents.length === 0 ? (
                <small>No hay estudiantes activos inscritos en este curso.</small>
              ) : (
                <div className={styles.studentList}>
                  {courseStudents.map((student) => (
                    <label className={styles.studentRow} key={student.user_id}>
                      <input type="checkbox" checked={selectedUserIds.includes(student.user_id)} onChange={() => toggleStudent(student.user_id)} />
                      <span><strong>{student.display_name}</strong><small>{student.student_code}</small></span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <label>
            Tipo
            <select value={activityType} onChange={(event) => {
              const value = event.target.value as ActivityType;
              setActivityType(value);
              if (value === "practice") {
                setPoints("");
                if (maxAttempts === "1") setMaxAttempts("3");
              } else if (!points) {
                setPoints("10");
              }
            }}>
              <option value="notebook_task">📝 Tarea de cuaderno</option>
              <option value="virtual_task">💻 Tarea virtual</option>
              <option value="practice">✏️ Ejercicio práctico</option>
            </select>
          </label>

          <label>
            Título
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Práctica de fracciones" maxLength={120} required />
          </label>

          {activityType !== "practice" && (
            <label>
              Punteo
              <input type="number" min="0" max="100" value={points} onChange={(event) => setPoints(event.target.value)} required />
              <small>Este punteo sí cuenta para Calificaciones y el promedio.</small>
            </label>
          )}

          <label>
            📊 Bloque académico
            <select value={blockNumber} onChange={(event) => setBlockNumber(event.target.value)}>
              <option value="1">Bloque 1</option>
              <option value="2">Bloque 2</option>
              <option value="3">Bloque 3</option>
              <option value="4">Bloque 4</option>
            </select>
            <small>{activityType === "practice" ? "Sirve para organizar el ejercicio; no afecta el promedio." : "La nota aparecerá dentro de este bloque."}</small>
          </label>

          <label>
            🔁 Intentos permitidos
            <input type="number" min="1" max="20" value={maxAttempts} onChange={(event) => setMaxAttempts(event.target.value)} required />
            <small>El estudiante podrá comenzar un nuevo intento hasta alcanzar este número. Para el promedio se conservará su mejor nota.</small>
          </label>

          <div className={styles.dateGrid}>
            <label>Apertura<input type="datetime-local" value={opensAt} onChange={(event) => setOpensAt(event.target.value)} /></label>
            <label>Cierre<input type="datetime-local" value={closesAt} onChange={(event) => setClosesAt(event.target.value)} /></label>
          </div>

          <label>
            ⏱️ Cronómetro en minutos
            <input type="number" min="1" max="1440" value={timeLimit} onChange={(event) => setTimeLimit(event.target.value)} placeholder="Déjalo vacío para no poner límite" />
            <small>El tiempo comienza de nuevo con cada intento.</small>
          </label>

          <label>
            Estado
            <select value={status} onChange={(event) => setStatus(event.target.value as ActivityStatus)}>
              <option value="draft">Borrador</option>
              <option value="published">Publicada</option>
            </select>
          </label>

          {error && <div className="auth-message auth-error">{error}</div>}
          {message && <div className="auth-message auth-success">{message}</div>}

          <div className={styles.actions}>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Guardando..." : editingId ? "Guardar cambios" : status === "published" ? "Publicar actividad" : "Guardar borrador"}
            </button>
            <button className="secondary-button" type="button" onClick={() => setPreviewOpen((value) => !value)}>
              {previewOpen ? "Ocultar vista previa" : "👁️ Vista previa"}
            </button>
            {editingId && <button className="secondary-button" type="button" onClick={resetForm}>Cancelar edición</button>}
          </div>
        </div>

        <div className={styles.sheetArea}>
          <div className={styles.sheetHeader}>
            <div><span>Hoja de instrucciones</span><small>Escribe contexto, reglas, teoría breve o indicaciones generales.</small></div>
            <span className={styles.sheetBadge}>Editor</span>
          </div>
          <textarea className={styles.paper} value={worksheet} onChange={(event) => setWorksheet(event.target.value)} placeholder={"Escribe aquí las instrucciones generales...\n\nDespués puedes agregar preguntas interactivas debajo."} />
        </div>

        <div className={styles.questionsPanel}>
          <ActivityQuestionBuilder questions={questions} answerKey={answerKey} onQuestionsChange={setQuestions} onAnswerKeyChange={setAnswerKey} />
        </div>
      </form>

      {previewOpen && (
        <div className={styles.previewSection}>
          <div className={styles.previewHeading}>
            <div><p className="eyebrow">Vista del estudiante</p><h3>Así se verá la actividad publicada</h3></div>
            <span className={styles.sheetBadge}>No está publicada por previsualizar</span>
          </div>
          <ActivitySheet
            courseName={previewCourse?.name ?? "Curso"}
            courseIcon={previewCourse?.icon ?? "📚"}
            activityType={activityType}
            title={title}
            content={worksheet}
            questionBlocks={questions}
            points={Number.isFinite(previewPoints) ? previewPoints : null}
            opensAt={opensAt || null}
            closesAt={closesAt || null}
            timeLimitMinutes={Number.isFinite(previewTimer) ? previewTimer : null}
            maxAttempts={previewAttempts}
            preview
          />
        </div>
      )}

      <div className={styles.savedSection}>
        <div className="section-heading"><div><p className="eyebrow">Contenido creado</p><h3>Actividades guardadas</h3></div></div>
        {activities.length === 0 ? <div className="empty-state">Todavía no has creado actividades.</div> : (
          <div className={styles.activityList}>
            {activities.map((activity) => {
              const course = courseMap.get(activity.course_id);
              return (
                <article className={styles.activityCard} key={activity.id}>
                  <div>
                    <span className={styles.meta}>{course?.icon ?? "📚"} {course?.name ?? "Curso"} · {typeLabels[activity.activity_type]}</span>
                    <strong>{activity.title}</strong>
                    <small>
                      {activity.points !== null ? `${activity.points} pts · ` : ""}
                      Bloque {activity.block_number ?? 1} · 🔁 {activity.max_attempts ?? 1} {(activity.max_attempts ?? 1) === 1 ? "intento" : "intentos"} · 
                      {activity.question_blocks?.length ? `${activity.question_blocks.length} preguntas · ` : ""}
                      {activity.assignment_mode === "selected" ? "👤 Estudiantes específicos · " : "👥 Todo el curso · "}
                      {activity.time_limit_minutes ? `⏱️ ${activity.time_limit_minutes} min · ` : "Sin cronómetro · "}
                      {activity.status === "published" ? "Publicada" : "Borrador"}
                    </small>
                  </div>
                  <button className="secondary-button" type="button" onClick={() => void editActivity(activity)}>Editar</button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
