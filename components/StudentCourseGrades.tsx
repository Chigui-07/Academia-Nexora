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

type StudentCourseGradesProps = {
  courseId: string;
  courseName: string;
  courseIcon?: string;
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

export default function StudentCourseGrades({
  courseId,
  courseName,
  courseIcon = "📚",
}: StudentCourseGradesProps) {
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

      const { data: activityData, error: activityError } = await supabase
        .from("course_activities")
        .select("id, title, activity_type, points, block_number")
        .eq("course_id", courseId)
        .neq("activity_type", "practice")
        .not("points", "is", null);

      if (activityError) throw activityError;

      const activities = (activityData ?? []) as Activity[];
      const activityIds = activities.map((activity) => activity.id);

      if (activityIds.length === 0) {
        if (!cancelled) {
          setGrades([]);
          setReady(true);
        }
        return;
      }

      const { data: attemptData, error: attemptError } = await supabase
        .from("activity_attempts")
        .select("id, activity_id, attempt_number, grade_value, grade_max, reviewer_name, reviewed_at")
        .eq("user_id", session.user.id)
        .in("activity_id", activityIds)
        .not("reviewed_at", "is", null);

      if (attemptError) throw attemptError;

      const activityMap = new Map(activities.map((activity) => [activity.id, activity]));
      const bestByActivity = new Map<string, BestGrade>();

      for (const attempt of (attemptData ?? []) as GradedAttempt[]) {
        const activity = activityMap.get(attempt.activity_id);
        if (!activity) continue;

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
        setGrades(Array.from(bestByActivity.values()));
        setReady(true);
      }
    }

    setReady(false);
    setError(null);

    load().catch((caughtError) => {
      if (cancelled) return;
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar las calificaciones del curso.");
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const blocks = useMemo<BlockSummary[]>(() => {
    return [1, 2, 3, 4].map((blockNumber) => {
      const blockGrades = grades.filter((grade) => grade.activity.block_number === blockNumber);
      const totals = blockGrades.reduce(
        (acc, grade) => ({ earned: acc.earned + grade.earned, possible: acc.possible + grade.possible }),
        { earned: 0, possible: 0 },
      );

      return {
        number: blockNumber,
        earned: totals.earned,
        possible: totals.possible,
        count: blockGrades.length,
        grades: blockGrades,
      };
    });
  }, [grades]);

  const courseTotal = useMemo(() => {
    return grades.reduce(
      (acc, grade) => ({ earned: acc.earned + grade.earned, possible: acc.possible + grade.possible }),
      { earned: 0, possible: 0 },
    );
  }, [grades]);

  const currentAverage = percent(courseTotal.earned, courseTotal.possible);
  const sortedGrades = grades.slice().sort((a, b) => {
    const blockDifference = a.activity.block_number - b.activity.block_number;
    if (blockDifference !== 0) return blockDifference;
    return new Date(b.attempt.reviewed_at ?? 0).getTime() - new Date(a.attempt.reviewed_at ?? 0).getTime();
  });

  if (!ready) return <div className="empty-state">Cargando calificaciones del curso...</div>;
  if (error) return <div className="auth-message auth-error">{error}</div>;

  return (
    <div className={styles.wrapper}>
      <section className={styles.summaryCard}>
        <div>
          <p className="eyebrow">{courseIcon} {courseName}</p>
          <h2>📊 Calificaciones</h2>
          <p className="muted-copy">El promedio actual usa únicamente tareas calificadas. Si una tarea tiene varios intentos, cuenta el mejor resultado.</p>
        </div>

        <div className={styles.averageBox}>
          <span>Promedio actual</span>
          <strong>{currentAverage === null ? "—" : `${currentAverage}%`}</strong>
          <small>{courseTotal.possible > 0 ? `${courseTotal.earned}/${courseTotal.possible} puntos calificados` : "Sin tareas calificadas"}</small>
        </div>
      </section>

      <section className={styles.blockGrid}>
        {blocks.map((block) => {
          const blockPercent = percent(block.earned, block.possible);
          return (
            <article className={styles.blockCard} key={block.number}>
              <div className={styles.blockHeading}>
                <div>
                  <span>Bloque académico</span>
                  <h3>Bloque {block.number}</h3>
                </div>
                <strong>{blockPercent === null ? "—" : `${blockPercent}%`}</strong>
              </div>

              <div className={styles.blockPoints}>
                <span>Puntos obtenidos</span>
                <strong>{block.possible > 0 ? `${block.earned} / ${block.possible}` : "Sin calificaciones"}</strong>
              </div>

              <small>{block.count === 0 ? "Todavía no hay tareas calificadas en este bloque." : `${block.count} ${block.count === 1 ? "tarea calificada" : "tareas calificadas"}.`}</small>
            </article>
          );
        })}
      </section>

      <section className={styles.detailPanel}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Detalle del curso</p>
            <h2>📝 Tareas calificadas</h2>
            <p className="muted-copy">Los ejercicios prácticos se califican sobre 100 dentro de Ejercicios, pero no modifican este promedio académico.</p>
          </div>
        </div>

        {sortedGrades.length === 0 ? (
          <div className="empty-state">Todavía no tienes tareas calificadas en este curso.</div>
        ) : (
          <div className={styles.gradeList}>
            {sortedGrades.map((grade) => (
              <article className={styles.gradeCard} key={grade.activity.id}>
                <div>
                  <span className={styles.blockBadge}>Bloque {grade.activity.block_number}</span>
                  <h3>{grade.activity.title}</h3>
                  <small>
                    Mejor intento: {grade.attempt.attempt_number}
                    {grade.attempt.reviewer_name ? ` · Revisado por ${grade.attempt.reviewer_name}` : ""}
                    {grade.attempt.reviewed_at ? ` · ${formatDate(grade.attempt.reviewed_at)}` : ""}
                  </small>
                </div>

                <div className={styles.gradeValue}>
                  <strong>{grade.earned}/{grade.possible}</strong>
                  <span>{percent(grade.earned, grade.possible)}%</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className={styles.note}>
        ℹ️ Este es el promedio <strong>actual</strong> con lo que ya ha sido calificado. El cierre definitivo de cada bloque y el promedio final de los cuatro bloques se aplicarán cuando configuremos las reglas de cierre académico.
      </div>
    </div>
  );
}
