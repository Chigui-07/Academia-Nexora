"use client";

import { useEffect, useMemo, useState } from "react";
import { goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./DashboardTaskBoard.module.css";

type TaskStatus = "pending" | "upcoming" | "submitted" | "graded" | "expired";

type Course = {
  id: string;
  course_key: string;
  name: string;
  icon: string;
};

type Task = {
  id: string;
  course_id: string;
  activity_type: "notebook_task" | "virtual_task";
  title: string;
  points: number | null;
  opens_at: string | null;
  closes_at: string | null;
  time_limit_minutes: number | null;
  max_attempts: number;
  block_number: number;
  assignment_mode: "course" | "selected";
};

type Attempt = {
  activity_id: string;
  status: "in_progress" | "submitted" | "timed_out";
  attempt_number: number;
  submitted_at: string | null;
  grade_value: number | string | null;
  grade_max: number | string | null;
  reviewed_at: string | null;
};

type TaskRow = {
  task: Task;
  course: Course;
  attempt: Attempt | null;
  status: TaskStatus;
};

const tabs: { key: TaskStatus; label: string }[] = [
  { key: "pending", label: "Pendientes" },
  { key: "upcoming", label: "Próximas" },
  { key: "submitted", label: "Entregadas" },
  { key: "graded", label: "Calificadas" },
  { key: "expired", label: "Vencidas" },
];

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha límite";
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getTaskStatus(task: Task, attempt: Attempt | null, now: number): TaskStatus {
  if (attempt?.reviewed_at && attempt.grade_value !== null && attempt.grade_max !== null) return "graded";
  if (attempt?.status === "submitted" || attempt?.status === "timed_out") return "submitted";

  const opensAt = task.opens_at ? new Date(task.opens_at).getTime() : null;
  const closesAt = task.closes_at ? new Date(task.closes_at).getTime() : null;

  if (opensAt !== null && opensAt > now) return "upcoming";
  if (closesAt !== null && closesAt < now) return "expired";
  return "pending";
}

function statusLabel(row: TaskRow) {
  if (row.status === "graded") {
    const earned = numberValue(row.attempt?.grade_value);
    const possible = numberValue(row.attempt?.grade_max);
    return `📊 ${earned}/${possible}`;
  }
  if (row.status === "submitted") {
    return row.attempt?.status === "timed_out" ? "⏱️ Tiempo finalizado" : "📤 Entregada";
  }
  if (row.status === "upcoming") return "🕒 Próxima";
  if (row.status === "expired") return "🔒 Vencida";
  if (row.attempt?.status === "in_progress") return "▶️ En curso";
  return "🟢 Disponible";
}

function sortRows(rows: TaskRow[], status: TaskStatus) {
  return rows.slice().sort((a, b) => {
    if (status === "graded") {
      return new Date(b.attempt?.reviewed_at ?? 0).getTime() - new Date(a.attempt?.reviewed_at ?? 0).getTime();
    }
    if (status === "submitted") {
      return new Date(b.attempt?.submitted_at ?? 0).getTime() - new Date(a.attempt?.submitted_at ?? 0).getTime();
    }
    if (status === "upcoming") {
      return new Date(a.task.opens_at ?? 0).getTime() - new Date(b.task.opens_at ?? 0).getTime();
    }
    if (status === "expired") {
      return new Date(b.task.closes_at ?? 0).getTime() - new Date(a.task.closes_at ?? 0).getTime();
    }

    const aClose = a.task.closes_at ? new Date(a.task.closes_at).getTime() : Number.POSITIVE_INFINITY;
    const bClose = b.task.closes_at ? new Date(b.task.closes_at).getTime() : Number.POSITIVE_INFINITY;
    return aClose - bClose;
  });
}

export default function DashboardTaskBoard() {
  const [rows, setRows] = useState<TaskRow[]>([]);
  const [activeTab, setActiveTab] = useState<TaskStatus>("pending");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        if (!cancelled) setReady(true);
        return;
      }

      const { data: taskData, error: taskError } = await supabase
        .from("course_activities")
        .select("id, course_id, activity_type, title, points, opens_at, closes_at, time_limit_minutes, max_attempts, block_number, assignment_mode")
        .eq("status", "published")
        .in("activity_type", ["notebook_task", "virtual_task"])
        .order("opens_at", { ascending: true, nullsFirst: true });

      if (taskError) throw taskError;
      const loadedTasks = (taskData ?? []) as Task[];
      const selectedActivityIds = loadedTasks
        .filter((task) => task.assignment_mode === "selected")
        .map((task) => task.id);
      const assignedActivityIds = new Set<string>();

      if (selectedActivityIds.length > 0) {
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("course_activity_assignments")
          .select("activity_id")
          .eq("user_id", session.user.id)
          .in("activity_id", selectedActivityIds);

        if (assignmentError) throw assignmentError;
        for (const row of assignmentData ?? []) assignedActivityIds.add(row.activity_id);
      }

      const tasks = loadedTasks.filter((task) =>
        task.assignment_mode === "course" || assignedActivityIds.has(task.id)
      );

      if (tasks.length === 0) {
        if (!cancelled) {
          setRows([]);
          setReady(true);
        }
        return;
      }

      const activityIds = tasks.map((task) => task.id);
      const courseIds = Array.from(new Set(tasks.map((task) => task.course_id)));

      const [{ data: attemptData, error: attemptError }, { data: courseData, error: courseError }] = await Promise.all([
        supabase
          .from("activity_attempts")
          .select("activity_id, status, attempt_number, submitted_at, grade_value, grade_max, reviewed_at")
          .eq("user_id", session.user.id)
          .in("activity_id", activityIds),
        supabase
          .from("courses")
          .select("id, course_key, name, icon")
          .in("id", courseIds),
      ]);

      if (attemptError) throw attemptError;
      if (courseError) throw courseError;

      const latestAttempt = new Map<string, Attempt>();
      for (const attempt of (attemptData ?? []) as Attempt[]) {
        const current = latestAttempt.get(attempt.activity_id);
        if (!current || attempt.attempt_number > current.attempt_number) {
          latestAttempt.set(attempt.activity_id, attempt);
        }
      }

      const courseMap = new Map(((courseData ?? []) as Course[]).map((course) => [course.id, course]));
      const now = Date.now();
      const nextRows: TaskRow[] = [];

      for (const task of tasks) {
        const course = courseMap.get(task.course_id);
        if (!course) continue;
        const attempt = latestAttempt.get(task.id) ?? null;
        nextRows.push({ task, course, attempt, status: getTaskStatus(task, attempt, now) });
      }

      if (!cancelled) {
        setRows(nextRows);
        setReady(true);
      }
    }

    load().catch((caughtError) => {
      if (cancelled) return;
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar tus tareas.");
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const map = new Map<TaskStatus, number>();
    for (const tab of tabs) map.set(tab.key, 0);
    for (const row of rows) map.set(row.status, (map.get(row.status) ?? 0) + 1);
    return map;
  }, [rows]);

  const visibleRows = useMemo(
    () => sortRows(rows.filter((row) => row.status === activeTab), activeTab),
    [rows, activeTab],
  );

  if (!ready) return <div className="empty-state">Cargando tareas...</div>;
  if (error) return <div className="auth-message auth-error">{error}</div>;

  return (
    <div className={styles.board}>
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={activeTab === tab.key ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span>{counts.get(tab.key) ?? 0}</span>
          </button>
        ))}
      </div>

      {visibleRows.length === 0 ? (
        <div className="empty-state">
          {activeTab === "pending" && "No tienes tareas pendientes en este momento."}
          {activeTab === "upcoming" && "No hay tareas próximas programadas."}
          {activeTab === "submitted" && "No tienes tareas entregadas esperando revisión."}
          {activeTab === "graded" && "Todavía no hay tareas calificadas para mostrar aquí."}
          {activeTab === "expired" && "No tienes tareas vencidas sin entregar."}
        </div>
      ) : (
        <div className={styles.taskGrid}>
          {visibleRows.map((row) => {
            const { task, course, attempt } = row;
            return (
              <article className={styles.taskCard} key={task.id}>
                <div className={styles.cardTopline}>
                  <span>{course.icon} {course.name}</span>
                  <strong className={`${styles.status} ${styles[`status_${row.status}`]}`}>{statusLabel(row)}</strong>
                </div>

                <div>
                  <p className="eyebrow">Bloque {task.block_number}</p>
                  <h3>{task.title}</h3>
                  <small>{task.activity_type === "virtual_task" ? "Tarea virtual" : "Tarea de cuaderno"}</small>
                </div>

                <div className={styles.meta}>
                  {task.points !== null && <span>🎯 {task.points} pts</span>}
                  <span>🔁 {task.max_attempts} {task.max_attempts === 1 ? "intento" : "intentos"}</span>
                  {task.time_limit_minutes && <span>⏱️ {task.time_limit_minutes} min</span>}
                  {attempt && <span>Intento {attempt.attempt_number}</span>}
                </div>

                <div className={styles.dateBox}>
                  {row.status === "upcoming" ? (
                    <><small>Abre</small><strong>{formatDate(task.opens_at)}</strong></>
                  ) : (
                    <><small>{row.status === "expired" ? "Cerró" : "Fecha límite"}</small><strong>{formatDate(task.closes_at)}</strong></>
                  )}
                </div>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => goTo(`/course/?course=${encodeURIComponent(course.course_key)}&tab=tareas`)}
                >
                  {row.status === "upcoming" ? "Ver curso" : "Abrir en el curso"} →
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}