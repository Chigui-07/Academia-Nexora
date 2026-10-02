"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./StudentCourseGrades.module.css";

type Activity = {
  id: string;
  title: string;
  activity_type: string;
  points: number | string | null;
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

type BlockSummary = {
  number: number;
  earned: number;
  possible: number;
  count: number;
  grades: BestGrade[];
};

type StudentCourseGradesProps = { courseId: string; courseName: string; courseIcon?: string };

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
  return new Intl.DateTimeFormat("es-GT", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function StudentCourseGrades({ courseId, courseName, courseIcon = "📚" }: StudentCourseGradesProps) {
  const [grades, setGrades] = useState<BestGrade[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) { if (!cancelled) setReady(true); return; }

      const { data: activityData, error: activityError } = await supabase
        .from("course_activities")
        .select("id, title, activity_type, points, block_number, pma_source_activity_id")
        .eq("course_id", courseId)
        .neq("activity_type", "practice")
        .not("points", "is", null);
      if (activityError) throw activityError;

      const activities = (activityData ?? []) as Activity[];
      const activityIds = activities.map((activity) => activity.id);
      if (activityIds.length === 0) { if (!cancelled) { setGrades([]); setReady(true); } return; }

      const { data: attemptData, error: attemptError } = await supabase
        .from("activity_attempts")
        .select("id, activity_id, attempt_number, grade_value, grade_max, reviewer_name, reviewed_at")
        .eq("user_id", session.user.id)
        .in("activity_id", activityIds)
        .not("reviewed_at", "is", null);
      if (attemptError) throw attemptError;

      const activityMap = new Map(activities.map((activity) => [activity.id, activity]));
      const bestByOriginal = new Map<string, BestGrade>();

      for (const attempt of (attemptData ?? []) as GradedAttempt[]) {
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

      if (!cancelled) { setGrades(Array.from(bestByOriginal.values())); setReady(true); }
    }

    setReady(false); setError(null);
    load().catch((caughtError) => {
      if (cancelled) return;
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar las calificaciones del curso.");
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [courseId]);

  const blocks = useMemo<BlockSummary[]>(() => [1, 2, 3, 4].map((blockNumber) => {
    const blockGrades = grades.filter((grade) => grade.activity.block_number === blockNumber);
    const totals = blockGrades.reduce((acc, grade) => ({ earned: acc.earned + grade.earned, possible: acc.possible + grade.possible }), { earned: 0, possible: 0 });
    return { number: blockNumber, earned: totals.earned, possible: totals.possible, count: blockGrades.length, grades: blockGrades };
  }), [grades]);

  const completedBlocks = blocks.filter((block) => block.possible === 100).length;
  const finalGrade = completedBlocks === 4 ? Math.round((blocks.reduce((sum, block) => sum + block.earned, 0) / 4) * 10) / 10 : null;
  const sortedGrades = grades.slice().sort((a, b) => a.activity.block_number - b.activity.block_number || new Date(b.attempt.reviewed_at ?? 0).getTime() - new Date(a.attempt.reviewed_at ?? 0).getTime());

  if (!ready) return <div className="empty-state">Cargando calificaciones del curso...</div>;
  if (error) return <div className="auth-message auth-error">{error}</div>;

  return (
    <div className={styles.wrapper}>
      <section className={styles.summaryCard}>
        <div>
          <p className="eyebrow">{courseIcon} {courseName}</p>
          <h2>📊 Calificaciones</h2>
          <p className="muted-copy">Cada bloque cierra con 100 puntos. Si existe PMA, se compara con la tarea original y solo cuenta la nota más alta.</p>
        </div>
        <div className={styles.averageBox}>
          <span>Nota final</span>
          <strong>{finalGrade === null ? "—" : `${finalGrade}/100`}</strong>
          <small>{completedBlocks}/4 bloques con 100 puntos calificados</small>
        </div>
      </section>

      <section className={styles.blockGrid}>
        {blocks.map((block) => (
          <article className={styles.blockCard} key={block.number}>
            <div className={styles.blockHeading}><div><span>Bloque académico</span><h3>Bloque {block.number}</h3></div><strong>{block.possible === 100 ? `${block.earned}/100` : "—"}</strong></div>
            <div className={styles.blockPoints}><span>Puntos obtenidos</span><strong>{block.possible > 0 ? `${block.earned} / ${block.possible}` : "Sin calificaciones"}</strong></div>
            <small>{block.possible === 100 ? "✅ Bloque completo." : `${block.possible}/100 puntos calificados actualmente.`}</small>
          </article>
        ))}
      </section>

      <section className={styles.detailPanel}>
        <div className="section-heading"><div><p className="eyebrow">Detalle del curso</p><h2>📝 Tareas calificadas</h2><p className="muted-copy">Los ejercicios prácticos no modifican el promedio académico.</p></div></div>
        {sortedGrades.length === 0 ? <div className="empty-state">Todavía no tienes tareas calificadas en este curso.</div> : (
          <div className={styles.gradeList}>
            {sortedGrades.map((grade) => {
              const usedPma = Boolean(grade.attemptActivity.pma_source_activity_id);
              return (
                <article className={styles.gradeCard} key={grade.activity.id}>
                  <div>
                    <span className={styles.blockBadge}>Bloque {grade.activity.block_number}{usedPma ? " · PMA" : ""}</span>
                    <h3>{grade.activity.title}</h3>
                    <small>Mejor intento: {grade.attempt.attempt_number}{usedPma ? ` · resultado tomado de ${grade.attemptActivity.title}` : ""}{grade.attempt.reviewer_name ? ` · Revisado por ${grade.attempt.reviewer_name}` : ""}{grade.attempt.reviewed_at ? ` · ${formatDate(grade.attempt.reviewed_at)}` : ""}</small>
                  </div>
                  <div className={styles.gradeValue}><strong>{grade.earned}/{grade.possible}</strong><span>{percent(grade.earned, grade.possible)}%</span></div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
