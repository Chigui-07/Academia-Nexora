"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./TeacherActivityManager.module.css";

type ActivityType = "notebook_task" | "virtual_task" | "practice";
type ActivityStatus = "draft" | "published";

type Course = {
  id: string;
  name: string;
  icon: string;
};

type Activity = {
  id: string;
  course_id: string;
  created_by: string;
  activity_type: ActivityType;
  title: string;
  worksheet_content: string;
  points: number | null;
  opens_at: string | null;
  closes_at: string | null;
  time_limit_minutes: number | null;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [courseId, setCourseId] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("notebook_task");
  const [title, setTitle] = useState("");
  const [points, setPoints] = useState("10");
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [worksheet, setWorksheet] = useState("");
  const [status, setStatus] = useState<ActivityStatus>("draft");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const courseMap = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);

  async function loadData() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) return;

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const teacher = (roleData ?? []).some((row) => row.role === "teacher");
    setIsTeacher(teacher);

    if (!teacher) {
      setReady(true);
      return;
    }

    const [{ data: courseData, error: courseError }, { data: activityData, error: activityError }] = await Promise.all([
      supabase
        .from("courses")
        .select("id, name, icon")
        .eq("active", true)
        .order("name"),
      supabase
        .from("course_activities")
        .select("id, course_id, created_by, activity_type, title, worksheet_content, points, opens_at, closes_at, time_limit_minutes, status, created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (courseError) throw courseError;
    if (activityError) throw activityError;

    const loadedCourses = (courseData ?? []) as Course[];
    setCourses(loadedCourses);
    setActivities((activityData ?? []) as Activity[]);
    if (!courseId && loadedCourses[0]) setCourseId(loadedCourses[0].id);
    setReady(true);
  }

  useEffect(() => {
    loadData().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo cargar el panel del profesor.");
      setReady(true);
    });
  }, []);

  function resetForm() {
    setEditingId(null);
    setActivityType("notebook_task");
    setTitle("");
    setPoints("10");
    setOpensAt("");
    setClosesAt("");
    setTimeLimit("");
    setWorksheet("");
    setStatus("draft");
    setMessage(null);
    setError(null);
  }

  function editActivity(activity: Activity) {
    setEditingId(activity.id);
    setCourseId(activity.course_id);
    setActivityType(activity.activity_type);
    setTitle(activity.title);
    setPoints(activity.points === null ? "" : String(activity.points));
    setOpensAt(toLocalInput(activity.opens_at));
    setClosesAt(toLocalInput(activity.closes_at));
    setTimeLimit(activity.time_limit_minutes === null ? "" : String(activity.time_limit_minutes));
    setWorksheet(activity.worksheet_content);
    setStatus(activity.status);
    setMessage("Editando actividad existente.");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

      const pointsValue = activityType === "practice" ? null : Number(points);
      if (activityType !== "practice" && (!Number.isFinite(pointsValue) || pointsValue! < 0 || pointsValue! > 100)) {
        throw new Error("El punteo debe estar entre 0 y 100.");
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
        points: pointsValue,
        opens_at: opensAt ? new Date(opensAt).toISOString() : null,
        closes_at: closesAt ? new Date(closesAt).toISOString() : null,
        time_limit_minutes: timerValue,
        status,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("course_activities")
          .update(payload)
          .eq("id", editingId);
        if (updateError) throw updateError;
        setMessage("Actividad actualizada correctamente.");
      } else {
        const { error: insertError } = await supabase
          .from("course_activities")
          .insert({ ...payload, created_by: session.user.id });
        if (insertError) throw insertError;
        setMessage(status === "published" ? "Actividad publicada correctamente." : "Borrador guardado correctamente.");
      }

      setEditingId(null);
      setTitle("");
      setWorksheet("");
      setPoints(activityType === "practice" ? "" : "10");
      setOpensAt("");
      setClosesAt("");
      setTimeLimit("");
      setStatus("draft");
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo guardar la actividad.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <div className="empty-state">Cargando herramientas del profesor...</div>;
  if (!isTeacher) return null;

  return (
    <section className={styles.wrapper}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Profesor</p>
          <h2>👨‍🏫 Crear y gestionar actividades</h2>
          <p className="muted-copy">Prepara tareas y ejercicios, controla cuándo se habilitan y decide si tendrán cronómetro.</p>
        </div>
      </div>

      <form className={styles.builder} onSubmit={handleSubmit}>
        <div className={styles.settingsPanel}>
          <h3>{editingId ? "Editar actividad" : "Nueva actividad"}</h3>

          <label>
            Curso
            <select value={courseId} onChange={(event) => setCourseId(event.target.value)} required>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.icon} {course.name}</option>
              ))}
            </select>
          </label>

          <label>
            Tipo
            <select
              value={activityType}
              onChange={(event) => {
                const value = event.target.value as ActivityType;
                setActivityType(value);
                if (value === "practice") setPoints("");
                else if (!points) setPoints("10");
              }}
            >
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
            </label>
          )}

          <div className={styles.dateGrid}>
            <label>
              Apertura
              <input type="datetime-local" value={opensAt} onChange={(event) => setOpensAt(event.target.value)} />
            </label>
            <label>
              Cierre
              <input type="datetime-local" value={closesAt} onChange={(event) => setClosesAt(event.target.value)} />
            </label>
          </div>

          <label>
            ⏱️ Cronómetro en minutos
            <input
              type="number"
              min="1"
              max="1440"
              value={timeLimit}
              onChange={(event) => setTimeLimit(event.target.value)}
              placeholder="Déjalo vacío para no poner límite"
            />
            <small>El tiempo comenzará cuando el estudiante pulse Comenzar actividad.</small>
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
            {editingId && (
              <button className="secondary-button" type="button" onClick={resetForm}>Cancelar edición</button>
            )}
          </div>
        </div>

        <div className={styles.sheetArea}>
          <div className={styles.sheetHeader}>
            <div>
              <span>Hoja de actividad</span>
              <small>Escribe aquí el ejercicio, instrucciones, problemas o preguntas.</small>
            </div>
            <span className={styles.sheetBadge}>Hoja en blanco</span>
          </div>
          <textarea
            className={styles.paper}
            value={worksheet}
            onChange={(event) => setWorksheet(event.target.value)}
            placeholder={"Escribe aquí el contenido de la actividad...\n\nEjemplo:\n1. Resuelve los siguientes ejercicios.\n2. Muestra tu procedimiento cuando se solicite."}
          />
        </div>
      </form>

      <div className={styles.savedSection}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Contenido creado</p>
            <h3>Actividades guardadas</h3>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="empty-state">Todavía no has creado actividades.</div>
        ) : (
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
                      {activity.time_limit_minutes ? `⏱️ ${activity.time_limit_minutes} min · ` : "Sin cronómetro · "}
                      {activity.status === "published" ? "Publicada" : "Borrador"}
                    </small>
                  </div>
                  <button className="secondary-button" type="button" onClick={() => editActivity(activity)}>Editar</button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
