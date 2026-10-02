"use client";

import { useEffect, useMemo, useState } from "react";
import ActivityRunner, { RunnableActivity } from "./ActivityRunner";
import { ActivitySheetType } from "./ActivitySheet";
import { supabase } from "@/lib/supabase";
import styles from "./StudentActivityList.module.css";

type Course = {
  id: string;
  name: string;
  icon: string;
};

type AttemptSummary = {
  activity_id: string;
  status: "in_progress" | "submitted" | "timed_out";
  attempt_number: number;
  grade_value: number | null;
  grade_max: number | null;
  reviewed_at: string | null;
};

type StudentActivityListProps = {
  courseId?: string;
  types: ActivitySheetType[];
  emptyMessage: string;
  includeClosed?: boolean;
  hideFinished?: boolean;
  selectableCards?: boolean;
};

const typeLabels: Record<ActivitySheetType, string> = {
  notebook_task: "Tarea de cuaderno",
  virtual_task: "Tarea virtual",
  practice: "Ejercicio práctico",
};

function activityStatus(activity: RunnableActivity, attempt?: AttemptSummary) {
  const closed = activity.closes_at ? new Date(activity.closes_at).getTime() < Date.now() : false;

  if (attempt?.reviewed_at && attempt.grade_value !== null && attempt.grade_max !== null) {
    return { label: `📊 ${attempt.grade_value}/${attempt.grade_max}`, tone: "graded" as const };
  }
  if (attempt?.status === "in_progress") return { label: "▶️ En curso", tone: "active" as const };
  if (attempt?.status === "submitted") return { label: "📤 Entregada", tone: "done" as const };
  if (attempt?.status === "timed_out") return { label: "⏱️ Tiempo finalizado", tone: "done" as const };
  if (closed) return { label: "🔒 Cerrado", tone: "closed" as const };
  return { label: "🟢 Disponible", tone: "active" as const };
}

export default function StudentActivityList({
  courseId,
  types,
  emptyMessage,
  includeClosed = false,
  hideFinished = false,
  selectableCards = false,
}: StudentActivityListProps) {
  const [activities, setActivities] = useState<RunnableActivity[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) { setReady(true); return; }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("stage, level")
        .eq("id", session.user.id)
        .single();
      if (profileError) throw profileError;

      let query = supabase
        .from("course_activities")
        .select("id, course_id, activity_type, title, worksheet_content, question_blocks, points, opens_at, closes_at, time_limit_minutes, max_attempts, block_number")
        .eq("status", "published")
        .eq("academic_stage", profile.stage)
        .eq("academic_level", profile.level)
        .in("activity_type", types)
        .order("opens_at", { ascending: true, nullsFirst: true });

      if (courseId) query = query.eq("course_id", courseId);

      const { data, error: activityError } = await query;
      if (activityError) throw activityError;

      const loaded = (data ?? []) as RunnableActivity[];
      const now = Date.now();
      let visible = loaded.filter((activity) => {
        const opens = activity.opens_at ? new Date(activity.opens_at).getTime() : null;
        const closes = activity.closes_at ? new Date(activity.closes_at).getTime() : null;
        const alreadyOpened = opens === null || opens <= now;
        const stillOpen = closes === null || closes >= now;
        return alreadyOpened && (includeClosed || stillOpen);
      });

      let loadedAttempts: AttemptSummary[] = [];
      if (visible.length > 0) {
        const activityIds = visible.map((activity) => activity.id);
        const { data: attemptData, error: attemptError } = await supabase
          .from("activity_attempts")
          .select("activity_id, status, attempt_number, grade_value, grade_max, reviewed_at")
          .eq("user_id", session.user.id)
          .in("activity_id", activityIds);

        if (attemptError) throw attemptError;
        const latestAttempt = new Map<string, AttemptSummary>();
        for (const row of (attemptData ?? []) as AttemptSummary[]) {
          const current = latestAttempt.get(row.activity_id);
          if (!current || row.attempt_number > current.attempt_number) latestAttempt.set(row.activity_id, row);
        }
        loadedAttempts = Array.from(latestAttempt.values());

        if (hideFinished) {
          visible = visible.filter((activity) => {
            const latest = latestAttempt.get(activity.id);
            return !latest || latest.status === "in_progress";
          });
        }
      }

      if (includeClosed) {
        visible.sort((a, b) => {
          const aClose = a.closes_at ? new Date(a.closes_at).getTime() : Number.POSITIVE_INFINITY;
          const bClose = b.closes_at ? new Date(b.closes_at).getTime() : Number.POSITIVE_INFINITY;
          const aClosed = aClose < now;
          const bClosed = bClose < now;
          if (aClosed !== bClosed) return aClosed ? 1 : -1;
          if (aClosed && bClosed) return bClose - aClose;
          const aOpen = a.opens_at ? new Date(a.opens_at).getTime() : 0;
          const bOpen = b.opens_at ? new Date(b.opens_at).getTime() : 0;
          return aOpen - bOpen;
        });
      }

      setActivities(visible);
      setAttempts(loadedAttempts);
      setSelectedId((current) => current && visible.some((activity) => activity.id === current) ? current : null);

      const courseIds = Array.from(new Set(visible.map((activity) => activity.course_id)));
      if (courseIds.length > 0) {
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("id, name, icon")
          .in("id", courseIds);
        if (courseError) throw courseError;
        setCourses((courseData ?? []) as Course[]);
      } else {
        setCourses([]);
      }

      setReady(true);
    }

    setReady(false);
    setError(null);
    load().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar las actividades.");
      setReady(true);
    });
  }, [courseId, types.join("|"), includeClosed, hideFinished]);

  const courseMap = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);
  const attemptMap = useMemo(() => new Map(attempts.map((attempt) => [attempt.activity_id, attempt])), [attempts]);
  const selectedActivity = activities.find((activity) => activity.id === selectedId) ?? null;

  if (!ready) return <div className="empty-state">Cargando actividades...</div>;
  if (error) return <div className="auth-message auth-error">{error}</div>;
  if (activities.length === 0) return <div className="empty-state">{emptyMessage}</div>;

  if (selectableCards) {
    return (
      <div className={styles.library}>
        <div className={styles.cardGrid}>
          {activities.map((activity) => {
            const course = courseMap.get(activity.course_id);
            const status = activityStatus(activity, attemptMap.get(activity.id));
            return (
              <button
                key={activity.id}
                type="button"
                className={`${styles.activityCard} ${selectedId === activity.id ? styles.activityCardSelected : ""}`}
                onClick={() => setSelectedId(activity.id)}
              >
                <div className={styles.cardTopline}>
                  <span>{course?.icon ?? "📚"} {course?.name ?? "Curso"}</span>
                  <span className={`${styles.status} ${styles[`status_${status.tone}`]}`}>{status.label}</span>
                </div>
                <strong>{activity.title}</strong>
                <small>{typeLabels[activity.activity_type]} · {activity.question_blocks?.length ?? 0} preguntas</small>
                <div className={styles.cardMeta}>
                  {activity.activity_type === "practice"
                    ? <span>🎯 /100</span>
                    : activity.points !== null && <span>🎯 {activity.points} pts</span>}
                  <span>🔁 {activity.max_attempts}</span>
                  {activity.time_limit_minutes && <span>⏱️ {activity.time_limit_minutes} min</span>}
                </div>
                <span className={styles.openLabel}>Abrir actividad →</span>
              </button>
            );
          })}
        </div>

        {!selectedActivity ? (
          <div className={styles.selectionHint}>Selecciona una tarjeta para abrir la tarea o ejercicio.</div>
        ) : (
          <div className={styles.detail}>
            <div className={styles.detailHeading}>
              <div>
                <p className="eyebrow">Actividad seleccionada</p>
                <h3>{selectedActivity.title}</h3>
              </div>
              <button className="secondary-button" type="button" onClick={() => setSelectedId(null)}>Cerrar vista</button>
            </div>
            <ActivityRunner
              activity={selectedActivity}
              courseName={courseMap.get(selectedActivity.course_id)?.name ?? "Curso"}
              courseIcon={courseMap.get(selectedActivity.course_id)?.icon ?? "📚"}
              allowNewAttempts={!selectedActivity.closes_at || new Date(selectedActivity.closes_at).getTime() >= Date.now()}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 28 }}>
      {activities.map((activity) => {
        const course = courseMap.get(activity.course_id);
        const closed = activity.closes_at ? new Date(activity.closes_at).getTime() < Date.now() : false;
        return (
          <ActivityRunner
            key={activity.id}
            activity={activity}
            courseName={course?.name ?? "Curso"}
            courseIcon={course?.icon ?? "📚"}
            allowNewAttempts={!closed}
          />
        );
      })}
    </div>
  );
}
