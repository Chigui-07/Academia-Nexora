"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Course = { id: string; name: string; icon: string };
type Activity = {
  id: string;
  course_id: string;
  title: string;
  activity_type: string;
  points: number | null;
  block_number: number;
  pma_source_activity_id: string | null;
};
type GradedAttempt = {
  id: string;
  activity_id: string;
  attempt_number: number;
  grade_value: number | string | null;
  grade_max: number | string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
};
type BestGrade = {
  activity: Activity;
  attemptActivity: Activity;
  attempt: GradedAttempt;
  earned: number;
  possible: number;
};
type BlockSummary = { earned: number; possible: number; count: number };

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-GT", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
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
      if (!session) { if (!cancelled) setReady(true); return; }

      const [{ data: enrollmentData, error: enrollmentError }, { data: profile, error: profileError }] = await Promise.all([
        supabase.from("course_enrollments").select("course_id").eq("user_id", session.user.id).eq("status", "active"),
        supabase.from("profiles").select("stage, level").eq("id", session.user.id).single(),
      ]);
      if (enrollmentError) throw enrollmentError;
      if (profileError) throw profileError;

      const courseIds = Array.from(new Set((enrollmentData ?? []).map((row) => row.course_id as string)));
      if (courseIds.length === 0) { if (!cancelled) { setCourses([]); setGrades([]); setReady(true); } return; }

      const [{ data: courseData, error: courseError }, { data: activityData, error: activityError }] = await Promise.all([
        supabase.from("courses").select("id, name, icon").in("id", courseIds).order("name"),
        supabase.from("course_activities")
          .select("id, course_id, title, activity_type, points, block_number, pma_source_activity_id")
          .in("course_id", courseIds)
          .eq("academic_stage", profile.stage)
          .eq("academic_level", profile.level)
          .neq("activity_type", "practice")
          .not("points", "is", null),
      ]);
      if (courseError) throw courseError;
      if (activityError) throw activityError;

      const activities = (activityData ?? []) as Activity[];
      const activityIds = activities.map((activity) => activity.id);
      let attempts: GradedAttempt[] = [];
      if (activityIds.length > 0) {
        const { data: attemptData, error: attemptError } = await supabase
          .from("activity_attempts")
          .select("id, activity_id, attempt_number, grade_value, grade_max, reviewer_name, reviewed_at")
          .eq("user_id", session.user.id)
          .eq("stage_snapshot", profile.stage)
          .eq("level_snapshot", profile.level)
          .in("activity_id", activityIds)
          .not("reviewed_at", "is", null);
        if (attemptError) throw attemptError;
        attempts = (attemptData ?? []) as GradedAttempt[];
      }

      const activityMap = new Map(activities.map((activity) => [activity.id, activity]));
      const bestByOriginal = new Map<string, BestGrade>();
      for (const attempt of attempts) {
        const attemptActivity = activityMap.get(attempt.activity_id);
        if (!attemptActivity) continue;
        const originalId = attemptActivity.pma_source_activity_id ?? attemptActivity.id;
        const originalActivity = activityMap.get(originalId) ?? attemptActivity;
        const earned = numberValue(attempt.grade_value);
        const possible = numberValue(attempt.grade_max);
        if (possible <= 0) continue;
        const candidate: BestGrade = { activity: originalActivity, attemptActivity, attempt, earned, possible };
        const current = bestByOriginal.get(originalId);
        if (!current || earned / possible > current.earned / current.possible) bestByOriginal.set(originalId, candidate);
      }

      if (!cancelled) {
        setCourses((courseData ?? []) as Course[]);
        setGrades(Array.from(bestByOriginal.values()));
        setReady(true);
      }
    }

    load().catch((caughtError) => {
      if (cancelled) return;
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar las calificaciones.");
      setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  const summaries = useMemo(() => courses.map((course) => {
    const courseGrades = grades.filter((grade) => grade.activity.course_id === course.id);
    const blocks: BlockSummary[] = [1,2,3,4].map((block) => {
      const rows = courseGrades.filter((grade) => grade.activity.block_number === block);
      return rows.reduce<BlockSummary>((acc, row) => ({ earned: acc.earned + row.earned, possible: acc.possible + row.possible, count: acc.count + 1 }), { earned: 0, possible: 0, count: 0 });
    });
    const complete = blocks.every((block) => block.possible === 100);
    const finalGrade = complete ? Math.round((blocks.reduce((sum, block) => sum + block.earned, 0) / 4) * 10) / 10 : null;
    return { course, blocks, finalGrade };
  }), [courses, grades]);

  if (!ready) return <div className="empty-state">Cargando calificaciones...</div>;
  if (error) return <div className="auth-message auth-error">{error}</div>;

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <section className="table-like">
        <div className="grade-row header"><span>Materia</span><span>Bloque 1</span><span>Bloque 2</span><span>Bloque 3</span><span>Bloque 4</span></div>
        {summaries.map(({ course, blocks, finalGrade }) => (
          <div className="grade-row" key={course.id}>
            <strong>{course.icon} {course.name}{finalGrade !== null ? ` · Final ${finalGrade}/100` : ""}</strong>
            {blocks.map((block, index) => <span key={index}>{block.possible > 0 ? `${block.earned}/${block.possible}` : "—"}</span>)}
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">Detalle</p><h2>📝 Actividades calificadas</h2><p className="muted-copy">PMA y tarea original ocupan el mismo espacio académico: Nexora conserva automáticamente la nota más alta.</p></div></div>
        {grades.length === 0 ? <div className="empty-state">Todavía no tienes actividades calificadas en tu nivel actual.</div> : (
          <div style={{ display: "grid", gap: 10 }}>
            {grades.slice().sort((a,b) => new Date(b.attempt.reviewed_at ?? 0).getTime() - new Date(a.attempt.reviewed_at ?? 0).getTime()).map((grade) => {
              const course = courses.find((item) => item.id === grade.activity.course_id);
              const usedPma = Boolean(grade.attemptActivity.pma_source_activity_id);
              return (
                <article className="action-card" key={grade.activity.id} style={{ display: "grid", gap: 6 }}>
                  <span className="eyebrow">{course?.icon ?? "📚"} {course?.name ?? "Curso"} · Bloque {grade.activity.block_number}{usedPma ? " · PMA" : ""}</span>
                  <strong>{grade.activity.title}</strong>
                  <span>{grade.earned}/{grade.possible} pts · Mejor intento: {grade.attempt.attempt_number}</span>
                  <small className="muted-copy">{usedPma ? `Mejor resultado obtenido en ${grade.attemptActivity.title} · ` : ""}{grade.attempt.reviewer_name ? `Revisado por ${grade.attempt.reviewer_name}` : "Revisión guardada"}{grade.attempt.reviewed_at ? ` · ${formatDate(grade.attempt.reviewed_at)}` : ""}</small>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
