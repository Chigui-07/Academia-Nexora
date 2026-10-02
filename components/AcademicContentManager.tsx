"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Course = { id: string; name: string; icon: string };
type AcademicStage = "Fundamentos" | "Intermedio" | "Avanzado" | "Superior" | "Dominio";
type Activity = {
  id: string;
  course_id: string;
  title: string;
  activity_type: string;
  points: number | null;
  block_number: number;
  status: string;
  academic_stage: AcademicStage;
  academic_level: number;
  pma_source_activity_id: string | null;
};
type Lesson = {
  id: string;
  course_id: string;
  title: string;
  status: string;
  academic_stage: AcademicStage;
  academic_level: number;
};

const stages: AcademicStage[] = ["Fundamentos", "Intermedio", "Avanzado", "Superior", "Dominio"];

export default function AcademicContentManager() {
  const [allowed, setAllowed] = useState(false);
  const [ready, setReady] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const courseMap = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);

  async function load() {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) { setReady(true); return; }

    const { data: roles, error: rolesError } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (rolesError) throw rolesError;
    const canManage = (roles ?? []).some((row) => row.role === "teacher" || row.role === "admin");
    setAllowed(canManage);
    if (!canManage) { setReady(true); return; }

    const [courseResponse, activityResponse, lessonResponse] = await Promise.all([
      supabase.from("courses").select("id, name, icon").eq("active", true).order("name"),
      supabase.from("course_activities")
        .select("id, course_id, title, activity_type, points, block_number, status, academic_stage, academic_level, pma_source_activity_id")
        .order("created_at", { ascending: false }),
      supabase.from("course_lessons")
        .select("id, course_id, title, status, academic_stage, academic_level")
        .order("created_at", { ascending: false }),
    ]);

    if (courseResponse.error) throw courseResponse.error;
    if (activityResponse.error) throw activityResponse.error;
    if (lessonResponse.error) throw lessonResponse.error;

    setCourses((courseResponse.data ?? []) as Course[]);
    setActivities((activityResponse.data ?? []) as Activity[]);
    setLessons((lessonResponse.data ?? []) as Lesson[]);
    setReady(true);
  }

  useEffect(() => {
    load().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo cargar la gestión académica.");
      setReady(true);
    });
  }, []);

  async function changeAcademicTarget(kind: "activity" | "lesson", id: string, stage: AcademicStage, level: number) {
    setBusyId(id);
    setMessage(null);
    setError(null);
    try {
      const table = kind === "activity" ? "course_activities" : "course_lessons";
      const { error: updateError } = await supabase.from(table).update({ academic_stage: stage, academic_level: level }).eq("id", id);
      if (updateError) throw updateError;
      setMessage("Ubicación académica actualizada.");
      await load();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo actualizar la etapa o nivel.");
    } finally {
      setBusyId(null);
    }
  }

  async function createPma(sourceId: string) {
    setBusyId(sourceId);
    setMessage(null);
    setError(null);
    try {
      const { data, error: pmaError } = await supabase.rpc("create_pma_activity", { p_source_activity_id: sourceId });
      if (pmaError) throw pmaError;
      setMessage("PMA creado como borrador. Ábrelo abajo en Crear y gestionar actividades para escribir ejercicios distintos, intentos, tiempo y fechas.");
      await load();
      if (data) document.getElementById("teacher-activities")?.scrollIntoView({ behavior: "smooth" });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo crear el PMA.");
    } finally {
      setBusyId(null);
    }
  }

  const blockTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const activity of activities) {
      if (activity.activity_type === "practice" || activity.pma_source_activity_id || activity.status !== "published" || activity.points === null) continue;
      const key = `${activity.course_id}|${activity.academic_stage}|${activity.academic_level}|${activity.block_number}`;
      totals.set(key, (totals.get(key) ?? 0) + Number(activity.points));
    }
    return totals;
  }, [activities]);

  if (!ready) return <section className="panel"><div className="empty-state">Cargando sistema académico...</div></section>;
  if (!allowed) return null;

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Etapas, niveles y recuperación</p>
          <h2>🎓 Progresión académica y PMA</h2>
          <p className="muted-copy">
            Cada etapa tiene 10 niveles. Asigna clases y actividades al nivel correcto; un bloque queda cerrado al llegar a 100 puntos publicados. El PMA conserva el mismo valor de la tarea original y para la nota siempre cuenta el resultado más alto.
          </p>
        </div>
      </div>

      {error && <div className="auth-message auth-error">{error}</div>}
      {message && <div className="auth-message auth-success">{message}</div>}

      <div style={{ display: "grid", gap: 18 }}>
        <div>
          <h3>📝 Actividades</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {activities.length === 0 ? <div className="empty-state">Todavía no hay actividades.</div> : activities.map((activity) => {
              const course = courseMap.get(activity.course_id);
              const totalKey = `${activity.course_id}|${activity.academic_stage}|${activity.academic_level}|${activity.block_number}`;
              const blockTotal = blockTotals.get(totalKey) ?? 0;
              const canPma = activity.activity_type !== "practice" && activity.points !== null && !activity.pma_source_activity_id;
              return (
                <article className="action-card" key={activity.id} style={{ display: "grid", gap: 10 }}>
                  <div>
                    <span className="eyebrow">{course?.icon ?? "📚"} {course?.name ?? "Curso"} · {activity.status === "published" ? "Publicada" : "Borrador"}</span>
                    <strong>{activity.pma_source_activity_id ? "🔁 " : ""}{activity.title}</strong>
                    <span>
                      {activity.activity_type === "practice" ? "Ejercicio práctico" : `${activity.points} pts · Bloque ${activity.block_number}`}
                      {activity.activity_type !== "practice" && !activity.pma_source_activity_id ? ` · ${blockTotal}/100 publicados en el bloque` : ""}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "minmax(150px, 1fr) minmax(110px, .5fr) auto", gap: 8, alignItems: "end" }}>
                    <label style={{ display: "grid", gap: 5 }}>
                      Etapa
                      <select value={activity.academic_stage} disabled={Boolean(activity.pma_source_activity_id) || busyId === activity.id}
                        onChange={(event) => void changeAcademicTarget("activity", activity.id, event.target.value as AcademicStage, activity.academic_level)}>
                        {stages.map((stage) => <option value={stage} key={stage}>{stage}</option>)}
                      </select>
                    </label>
                    <label style={{ display: "grid", gap: 5 }}>
                      Nivel
                      <select value={activity.academic_level} disabled={Boolean(activity.pma_source_activity_id) || busyId === activity.id}
                        onChange={(event) => void changeAcademicTarget("activity", activity.id, activity.academic_stage, Number(event.target.value))}>
                        {Array.from({ length: 10 }, (_, index) => index + 1).map((level) => <option value={level} key={level}>Nivel {level}</option>)}
                      </select>
                    </label>
                    {canPma && <button className="secondary-button" type="button" disabled={busyId === activity.id} onClick={() => void createPma(activity.id)}>🔁 Aplicar PMA</button>}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div>
          <h3>📖 Clases</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {lessons.length === 0 ? <div className="empty-state">Todavía no hay clases.</div> : lessons.map((lesson) => {
              const course = courseMap.get(lesson.course_id);
              return (
                <article className="action-card" key={lesson.id} style={{ display: "grid", gap: 10 }}>
                  <div>
                    <span className="eyebrow">{course?.icon ?? "📚"} {course?.name ?? "Curso"} · {lesson.status === "published" ? "Publicada" : "Borrador"}</span>
                    <strong>{lesson.title}</strong>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(150px, 1fr) minmax(110px, .5fr)", gap: 8 }}>
                    <label style={{ display: "grid", gap: 5 }}>
                      Etapa
                      <select value={lesson.academic_stage} disabled={busyId === lesson.id}
                        onChange={(event) => void changeAcademicTarget("lesson", lesson.id, event.target.value as AcademicStage, lesson.academic_level)}>
                        {stages.map((stage) => <option value={stage} key={stage}>{stage}</option>)}
                      </select>
                    </label>
                    <label style={{ display: "grid", gap: 5 }}>
                      Nivel
                      <select value={lesson.academic_level} disabled={busyId === lesson.id}
                        onChange={(event) => void changeAcademicTarget("lesson", lesson.id, lesson.academic_stage, Number(event.target.value))}>
                        {Array.from({ length: 10 }, (_, index) => index + 1).map((level) => <option value={level} key={level}>Nivel {level}</option>)}
                      </select>
                    </label>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
