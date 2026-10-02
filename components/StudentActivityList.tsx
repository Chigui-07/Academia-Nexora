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

type StudentActivityListProps = {
  courseId?: string;
  types: ActivitySheetType[];
  emptyMessage: string;
};

export default function StudentActivityList({ courseId, types, emptyMessage }: StudentActivityListProps) {
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
      const visible = loaded.filter((activity) => {
        const opens = activity.opens_at ? new Date(activity.opens_at).getTime() : null;
        const closes = activity.closes_at ? new Date(activity.closes_at).getTime() : null;
        return (opens === null || opens <= now) && (closes === null || closes >= now);
      });

      setActivities(visible);

      const courseIds = Array.from(new Set(visible.map((activity) => activity.course_id)));
      if (courseIds.length > 0) {
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("id, name, icon")
          .in("id", courseIds);
        if (courseError) throw courseError;
        setCourses((courseData ?? []) as Course[]);
      }

      setReady(true);
    }

    load().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar las actividades.");
      setReady(true);
    });
  }, [courseId, types.join("|")]);

  const courseMap = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);

  if (!ready) return <div className="empty-state">Cargando actividades...</div>;
  if (error) return <div className="auth-message auth-error">{error}</div>;
  if (activities.length === 0) return <div className="empty-state">{emptyMessage}</div>;

  return (
    <div style={{ display: "grid", gap: 28 }}>
      {activities.map((activity) => {
        const course = courseMap.get(activity.course_id);
        return (
          <ActivityRunner
            key={activity.id}
            activity={activity}
            courseName={course?.name ?? "Curso"}
            courseIcon={course?.icon ?? "📚"}
          />
        );
      })}
    </div>
  );
}
