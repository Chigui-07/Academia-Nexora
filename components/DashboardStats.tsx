"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AttemptRow = {
  activity_id: string;
  status: string;
  grade_value?: number | string | null;
  grade_max?: number | string | null;
};

type ActivityRow = {
  id: string;
  points: number | null;
  opens_at?: string | null;
  closes_at?: string | null;
};

function numeric(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function DashboardStats() {
  const [activeCourses, setActiveCourses] = useState<number | null>(null);
  const [pendingTasks, setPendingTasks] = useState<number | null>(null);
  const [currentAverage, setCurrentAverage] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) return;

      const [courseCountResponse, taskResponse, gradedResponse] = await Promise.all([
        supabase
          .from("course_enrollments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", session.user.id)
          .eq("status", "active"),
        supabase
          .from("course_activities")
          .select("id, points, opens_at, closes_at")
          .eq("status", "published")
          .in("activity_type", ["notebook_task", "virtual_task"]),
        supabase
          .from("activity_attempts")
          .select("activity_id, status, grade_value, grade_max")
          .eq("user_id", session.user.id)
          .not("reviewed_at", "is", null),
      ]);

      if (!mounted) return;

      if (courseCountResponse.error) {
        console.error("No se pudieron contar los cursos activos:", courseCountResponse.error.message);
        setActiveCourses(0);
      } else {
        setActiveCourses(courseCountResponse.count ?? 0);
      }

      if (taskResponse.error) {
        console.error("No se pudieron cargar las tareas:", taskResponse.error.message);
        setPendingTasks(0);
      } else {
        const now = Date.now();
        const availableTasks = ((taskResponse.data ?? []) as ActivityRow[]).filter((activity) => {
          const opens = activity.opens_at ? new Date(activity.opens_at).getTime() : null;
          const closes = activity.closes_at ? new Date(activity.closes_at).getTime() : null;
          return (opens === null || opens <= now) && (closes === null || closes >= now);
        });

        if (availableTasks.length === 0) {
          setPendingTasks(0);
        } else {
          const ids = availableTasks.map((activity) => activity.id);
          const { data: attemptData, error: attemptError } = await supabase
            .from("activity_attempts")
            .select("activity_id, status")
            .eq("user_id", session.user.id)
            .in("activity_id", ids);

          if (!mounted) return;
          if (attemptError) {
            console.error("No se pudieron calcular las tareas pendientes:", attemptError.message);
            setPendingTasks(availableTasks.length);
          } else {
            const finished = new Set(
              ((attemptData ?? []) as AttemptRow[])
                .filter((attempt) => attempt.status === "submitted" || attempt.status === "timed_out")
                .map((attempt) => attempt.activity_id),
            );
            setPendingTasks(availableTasks.filter((activity) => !finished.has(activity.id)).length);
          }
        }
      }

      if (gradedResponse.error) {
        console.error("No se pudo calcular el promedio:", gradedResponse.error.message);
        setCurrentAverage(null);
        return;
      }

      const gradedAttempts = (gradedResponse.data ?? []) as AttemptRow[];
      const gradedIds = Array.from(new Set(gradedAttempts.map((attempt) => attempt.activity_id)));
      if (gradedIds.length === 0) {
        setCurrentAverage(null);
        return;
      }

      const { data: gradedActivitiesData, error: gradedActivitiesError } = await supabase
        .from("course_activities")
        .select("id, points")
        .in("id", gradedIds);

      if (!mounted) return;
      if (gradedActivitiesError) {
        console.error("No se pudieron cargar las actividades calificadas:", gradedActivitiesError.message);
        setCurrentAverage(null);
        return;
      }

      const academicIds = new Set(
        ((gradedActivitiesData ?? []) as ActivityRow[])
          .filter((activity) => activity.points !== null)
          .map((activity) => activity.id),
      );

      const best = new Map<string, { earned: number; possible: number }>();
      for (const attempt of gradedAttempts) {
        if (!academicIds.has(attempt.activity_id)) continue;
        const earned = numeric(attempt.grade_value);
        const possible = numeric(attempt.grade_max);
        if (possible <= 0) continue;
        const current = best.get(attempt.activity_id);
        if (!current || earned / possible > current.earned / current.possible) {
          best.set(attempt.activity_id, { earned, possible });
        }
      }

      let earnedTotal = 0;
      let possibleTotal = 0;
      for (const grade of best.values()) {
        earnedTotal += grade.earned;
        possibleTotal += grade.possible;
      }

      setCurrentAverage(possibleTotal > 0 ? Math.round((earnedTotal / possibleTotal) * 1000) / 10 : null);
    }

    void loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="stats-grid">
      <article className="stat-card">
        <div className="stat-label">Tareas pendientes</div>
        <div className="stat-value">{pendingTasks === null ? "—" : pendingTasks}</div>
      </article>
      <article className="stat-card">
        <div className="stat-label">Promedio actual</div>
        <div className="stat-value">{currentAverage === null ? "—" : `${currentAverage}%`}</div>
      </article>
      <article className="stat-card">
        <div className="stat-label">Cursos activos</div>
        <div className="stat-value">{activeCourses === null ? "—" : activeCourses}</div>
      </article>
    </section>
  );
}
