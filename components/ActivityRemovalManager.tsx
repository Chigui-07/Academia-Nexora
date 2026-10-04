"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ActivityType = "notebook_task" | "virtual_task" | "practice";
type Course = { id: string; name: string; icon: string };
type Activity = {
  id: string;
  course_id: string;
  created_by: string;
  activity_type: ActivityType;
  title: string;
  status: "draft" | "published";
  block_number: number;
  created_at: string;
};

type RemovalResult = {
  action?: "deleted" | "archived" | "protected";
  reason?: string;
  attempts?: number;
  message?: string;
};

const typeLabels: Record<ActivityType, string> = {
  notebook_task: "📝 Tarea de cuaderno",
  virtual_task: "💻 Tarea virtual",
  practice: "✏️ Ejercicio práctico",
};

export default function ActivityRemovalManager() {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseFilter, setCourseFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ActivityType>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) { setReady(true); return; }

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);
    if (roleError) throw roleError;

    const roles = (roleData ?? []).map((row) => row.role);
    const canManage = roles.includes("teacher") || roles.includes("admin");
    const isAdmin = roles.includes("admin");
    setAllowed(canManage);
    if (!canManage) { setReady(true); return; }

    let activityQuery = supabase
      .from("course_activities")
      .select("id, course_id, created_by, activity_type, title, status, block_number, created_at")
      .neq("status", "archived")
      .neq("activity_type", "exercise_sheet")
      .order("created_at", { ascending: false });

    if (!isAdmin) activityQuery = activityQuery.eq("created_by", session.user.id);

    const [activityResponse, courseResponse] = await Promise.all([
      activityQuery,
      supabase.from("courses").select("id, name, icon").order("name"),
    ]);

    if (activityResponse.error) throw activityResponse.error;
    if (courseResponse.error) throw courseResponse.error;

    setActivities((activityResponse.data ?? []) as Activity[]);
    setCourses((courseResponse.data ?? []) as Course[]);
    setReady(true);
  }

  useEffect(() => {
    load().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo cargar el eliminador de actividades.");
      setReady(true);
    });
  }, []);

  const courseMap = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);
  const visible = useMemo(() => activities.filter((activity) => {
    if (courseFilter !== "all" && activity.course_id !== courseFilter) return false;
    if (typeFilter !== "all" && activity.activity_type !== typeFilter) return false;
    return true;
  }), [activities, courseFilter, typeFilter]);

  async function removeActivity(activity: Activity) {
    const course = courseMap.get(activity.course_id);
    const confirmed = window.confirm(
      `¿Quitar \"${activity.title}\" de ${course?.name ?? "este curso"}?\n\n` +
      "• Si nunca fue utilizada, se eliminará definitivamente.\n" +
      "• Si es un ejercicio con intentos, Nexora lo archivará y conservará su historial.\n" +
      "• Si es una tarea que ya tiene entregas, Nexora impedirá borrarla para proteger las notas."
    );
    if (!confirmed) return;

    setBusyId(activity.id);
    setMessage(null);
    setError(null);

    try {
      const { data, error: removeError } = await supabase.rpc("remove_course_activity", {
        p_activity_id: activity.id,
      });
      if (removeError) throw removeError;

      const result = (data ?? {}) as RemovalResult;
      if (result.action === "protected") {
        setError(result.message || "Esta actividad tiene historial protegido y no se puede eliminar.");
        return;
      }

      if (result.action !== "deleted" && result.action !== "archived") {
        throw new Error("Supabase no confirmó cómo se procesó la actividad.");
      }

      setActivities((current) => current.filter((item) => item.id !== activity.id));
      setMessage(result.message || (result.action === "deleted" ? "Actividad eliminada." : "Actividad archivada."));
    } catch (caughtError) {
      const text = caughtError instanceof Error ? caughtError.message : "No se pudo quitar la actividad.";
      setError(text.includes("Exercise sheets are managed automatically")
        ? "Las Hojas de ejercicios se generan automáticamente y no se eliminan desde aquí."
        : text);
    } finally {
      setBusyId(null);
    }
  }

  if (!ready) return <section className="panel"><div className="empty-state">Cargando eliminador...</div></section>;
  if (!allowed) return null;

  return (
    <section className="panel" style={{ marginTop: 18 }}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Limpieza de contenido</p>
          <h2>🗑️ Eliminar tareas y ejercicios</h2>
          <p className="muted-copy">
            Quita actividades que ya no utilizarás. Nexora protege automáticamente las tareas que ya tienen entregas y conserva el historial de los ejercicios realizados.
          </p>
        </div>
      </div>

      <div className="security-note" style={{ marginBottom: 16 }}>
        🔒 Las Hojas de ejercicios automáticas no aparecen aquí. Si eliminas un ejercicio sin historial, la Hoja de ejercicios de su bloque se actualizará sola.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 18 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Curso
          <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}>
            <option value="all">Todos los cursos</option>
            {courses.map((course) => <option value={course.id} key={course.id}>{course.icon} {course.name}</option>)}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Tipo
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "all" | ActivityType)}>
            <option value="all">Todos los tipos</option>
            <option value="notebook_task">Tareas de cuaderno</option>
            <option value="virtual_task">Tareas virtuales</option>
            <option value="practice">Ejercicios prácticos</option>
          </select>
        </label>
      </div>

      {error && <div className="auth-message auth-error">{error}</div>}
      {message && <div className="auth-message auth-success">{message}</div>}

      {visible.length === 0 ? (
        <div className="empty-state">No hay actividades activas con esos filtros.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {visible.map((activity) => {
            const course = courseMap.get(activity.course_id);
            return (
              <article className="action-card" key={activity.id} style={{ display: "grid", gap: 10 }}>
                <div>
                  <span className="eyebrow">{course?.icon ?? "📚"} {course?.name ?? "Curso"} · Bloque {activity.block_number}</span>
                  <strong>{activity.title}</strong>
                  <span>{typeLabels[activity.activity_type]} · {activity.status === "published" ? "Publicada" : "Borrador"}</span>
                </div>
                <div className="request-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={busyId === activity.id}
                    onClick={() => void removeActivity(activity)}
                    style={{ borderColor: "rgba(248, 113, 113, .55)" }}
                  >
                    {busyId === activity.id ? "Procesando..." : "🗑️ Quitar actividad"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
