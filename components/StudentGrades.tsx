"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Course = {
  id: string;
  name: string;
  icon: string;
};

type Activity = {
  id: string;
  course_id: string;
  title: string;
  activity_type: string;
  points: number | null;
  block_number: number;
};

type GradedAttempt = {
  id: string;
  activity_id: string;
  attempt_number: number;
  grade_value: number | string | null;
  grade_max: number | string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  feedback: string | null;
};

type BestGrade = {
  activity: Activity;
  attempt: GradedAttempt;
  earned: number;
  possible: number;
};

type BlockSummary = {
  earned: number;
  possible: number;
  count: number;
};

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percent(earned: number, possible: number) {
  if (possible <= 0) return null;
  return Math.round((earned / possible) * 1000) / 10;
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function StudentGrades() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<BestGrade[]>([]);
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

      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("user_id", session.user.id)
        .eq("status", "active");
      if (enrollmentError) throw enrollmentError;

      const courseIds = Array.from(new Set((enrollmentData ?? []).map((row) => row.course_id as string)));
      if (courseIds.length === 0) {
        if (!cancelled) {
          setCourses([]);
          setGrades([]);
          setReady(true);
        }
        return;
      }

      const [{ data: courseData, error: courseError }, { data: attemptData, error: attemptError }] = await Promise.all([
        supabase.from("courses").select("id, name, icon").in("id", courseIds).order("name"),
        supabase
          .from("activity_attempts")
          .select("id, activity_id, attempt_number, grade_value, grade_max, reviewer_name, reviewed_at, feedback")
          .eq("user_id", session.user.id)
          .not("reviewed_at", "is", null),
      ]);

      if (courseError) throw courseError;
      if (attemptError) throw attemptError;

      const attempts = (attemptData ?? []) as GradedAttempt[];
      const activityIds = Array.from(new Set(attempts.map((attempt) => attempt.activity_id)));
      let activities: Activity[] = [];

      if (activityIds.length > 0) {
        const { data: activityData, error: activityError } = await supabase
          .from("course_activities")
          .select("id, course_id, title, activity_type, points, block_number")
          .in("id", activityIds);
        if (activityError) throw activityError;
        activities = (activityData ?? []) as Activity[];
      }

      const activityMap = new Map(activities.map((activity) => [activity.id, activity]));
      const bestByActivity = new Map<string, BestGrade>();

      for (const attempt of attempts) {
        const activity = activityMap.get(attempt.activity_id);
        if (!activity || activity.activity_type === "practice" || activity.points === null) continue;

        const earned = numberValue(attempt.grade_value);
        const possible = numberValue(attempt.grade_max);
        if (possible <= 0) continue;

        const candidate: BestGrade = { activity, attempt, earned, possible };
        const current = bestByActivity.get(activity.id);
        if (!current || earned / possible > current.earned / current.possible) {
          bestByActivity.set(activity.id, candidate);
        }
      }

      if (!cancelled) {
        setCourses((courseData ?? []) as Course[]);
        setGrades(Array.from(bestByActivity.values()));
        setReady(true);
      }
    }

    load().catch((caughtError) => {
      if (cancelled) return;
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar las calificaciones.");
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const summaries = useMemo(() => {
    return courses.map((course) => {
      const courseGrades = grades.filter((grade) => grade.activity.course_id === course.id);
      const blocks: BlockSummary[] = [1, 2, 3, 4].map((block) => {
        const rows = courseGrades.filter((grade) => grade.activity.block_number === block);
        return rows.reduce<BlockSummary>((acc, row) => ({
          earned: acc.earned + row.earned,
          possible: acc.possible + row.possible,
          count: acc.count + 1,
        }), { earned: 0, possible: 0, count: 0 });
      });

      const total = blocks.reduce<BlockSummary>((acc, block) => ({
        earned: acc.earned + block.earned,
        possible: acc.possible + block.possible,
        count: acc.count + block.count,
      }), { earned: 0, possible: 0, count: 0 });

      return { course, blocks, total, courseGrades };
    });
  }, [courses, grades]);

  if (!ready) return <div className="empty-state">Cargando calificaciones...</div>;
  if (error) return <div className="auth-message auth-error">{error}</div>;

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <section className="table-like">
        <div className="grade-row header">
          <span>Materia</span>
          <span>Bloque 1</span>
          <span>Bloque 2</span>
          <span>Bloque 3</span>
          <span>Bloque 4</span>
        </div>
        {summaries.map(({ course, blocks, total }) => {
          const totalPercent = percent(total.earned, total.possible);
          return (
            <div className="grade-row" key={course.id}>
              <strong>{course.icon} {course.name}{totalPercent !== null ? ` · ${totalPercent}%` : ""}</strong>
              {blocks.map((block, index) => {
                const blockPercent = percent(block.earned, block.possible);
                return (
                  <span key={index} title={blockPercent === null ? "Sin calificaciones" : `${blockPercent}%`}>
                    {block.possible > 0 ? `${block.earned}/${block.possible}` : "—"}
                  </span>
                );
              })}
            </div>
          );
        })}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Detalle</p>
            <h2>📝 Actividades calificadas</h2>
            <p className="muted-copy">Si una actividad permite varios intentos, para el promedio se conserva el intento con mejor calificación.</p>
          </div>
        </div>

        {grades.length === 0 ? (
          <div className="empty-state">Todavía no tienes actividades calificadas.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {grades
              .slice()
              .sort((a, b) => new Date(b.attempt.reviewed_at ?? 0).getTime() - new Date(a.attempt.reviewed_at ?? 0).getTime())
              .map((grade) => {
                const course = courses.find((item) => item.id === grade.activity.course_id);
                return (
                  <article className="action-card" key={grade.activity.id} style={{ display: "grid", gap: 6 }}>
                    <span className="eyebrow">{course?.icon ?? "📚"} {course?.name ?? "Curso"} · Bloque {grade.activity.block_number}</span>
                    <strong>{grade.activity.title}</strong>
                    <span>{grade.earned}/{grade.possible} pts · {percent(grade.earned, grade.possible)}% · Mejor intento: {grade.attempt.attempt_number}</span>
                    <small className="muted-copy">
                      {grade.attempt.reviewer_name ? `Revisado por ${grade.attempt.reviewer_name}` : "Revisión guardada"}
                      {grade.attempt.reviewed_at ? ` · ${formatDate(grade.attempt.reviewed_at)}` : ""}
                    </small>
                  </article>
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
}
