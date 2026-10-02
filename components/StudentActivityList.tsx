"use client";

import { useEffect, useMemo, useState } from "react";
import ActivityRunner, { RunnableActivity } from "./ActivityRunner";
import { ActivitySheetType } from "./ActivitySheet";
import { supabase } from "@/lib/supabase";

type Course = {
  id: string;
  name: string;
  icon: string;
};

type AttemptSummary = {
  activity_id: string;
  status: "in_progress" | "submitted" | "timed_out";
  attempt_number: number;
};

type StudentActivityListProps = {
  courseId?: string;
  types: ActivitySheetType[];
  emptyMessage: string;
  includeClosed?: boolean;
  hideFinished?: boolean;
};

export default function StudentActivityList({
  courseId,
  types,
  emptyMessage,
  includeClosed = false,
  hideFinished = false,
}: StudentActivityListProps) {
  const [activities, setActivities] = useState<RunnableActivity[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      let query = supabase
        .from("course_activities")
        .select("id, course_id, activity_type, title, worksheet_content, question_blocks, points, opens_at, closes_at, time_limit_minutes, max_attempts, block_number")
        .eq("status", "published")
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

      if (hideFinished && visible.length > 0) {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;

        if (session) {
          const activityIds = visible.map((activity) => activity.id);
          const { data: attemptData, error: attemptError } = await supabase
            .from("activity_attempts")
            .select("activity_id, status, attempt_number")
            .eq("user_id", session.user.id)
            .in("activity_id", activityIds);

          if (attemptError) throw attemptError;

          const latestAttempt = new Map<string, AttemptSummary>();
          for (const row of (attemptData ?? []) as AttemptSummary[]) {
            const current = latestAttempt.get(row.activity_id);
            if (!current || row.attempt_number > current.attempt_number) {
              latestAttempt.set(row.activity_id, row);
            }
          }

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

  if (!ready) return <div className="empty-state">Cargando actividades...</div>;
  if (error) return <div className="auth-message auth-error">{error}</div>;
  if (activities.length === 0) return <div className="empty-state">{emptyMessage}</div>;

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
