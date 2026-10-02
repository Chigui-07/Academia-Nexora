"use client";

import { useEffect, useMemo, useState } from "react";
import ActivitySheet, { ActivitySheetType } from "./ActivitySheet";
import { ActivityQuestionBlock } from "@/lib/activityQuestions";
import { supabase } from "@/lib/supabase";

type Activity = {
  id: string;
  course_id: string;
  activity_type: ActivitySheetType;
  title: string;
  worksheet_content: string;
  question_blocks: ActivityQuestionBlock[];
  points: number | null;
  opens_at: string | null;
  closes_at: string | null;
  time_limit_minutes: number | null;
};

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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      let query = supabase
        .from("course_activities")
        .select("id, course_id, activity_type, title, worksheet_content, question_blocks, points, opens_at, closes_at, time_limit_minutes")
        .eq("status", "published")
        .in("activity_type", types)
        .order("opens_at", { ascending: true, nullsFirst: true });

      if (courseId) query = query.eq("course_id", courseId);

      const { data, error: activityError } = await query;
      if (activityError) throw activityError;

      const loaded = (data ?? []) as Activity[];
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
    <div style={{ display: "grid", gap: 22 }}>
      {activities.map((activity) => {
        const course = courseMap.get(activity.course_id);
        return (
          <ActivitySheet
            key={activity.id}
            courseName={course?.name ?? "Curso"}
            courseIcon={course?.icon ?? "📚"}
            activityType={activity.activity_type}
            title={activity.title}
            content={activity.worksheet_content}
            questionBlocks={activity.question_blocks ?? []}
            points={activity.points}
            opensAt={activity.opens_at}
            closesAt={activity.closes_at}
            timeLimitMinutes={activity.time_limit_minutes}
          />
        );
      })}
    </div>
  );
}
