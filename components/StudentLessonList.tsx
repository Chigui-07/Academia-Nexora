"use client";

import { useEffect, useState } from "react";
import LessonSheet from "./LessonSheet";
import { supabase } from "@/lib/supabase";

type Lesson = {
  id: string;
  course_id: string;
  unit_title: string;
  title: string;
  lesson_content: string;
  examples: string;
  resources: string;
  position: number;
};

type StudentLessonListProps = {
  courseId: string;
  courseName: string;
  courseIcon?: string;
};

export default function StudentLessonList({ courseId, courseName, courseIcon = "📚" }: StudentLessonListProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) { setReady(true); return; }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("stage, level")
        .eq("id", userId)
        .single();
      if (profileError) throw profileError;

      const { data, error: loadError } = await supabase
        .from("course_lessons")
        .select("id, course_id, unit_title, title, lesson_content, examples, resources, position")
        .eq("course_id", courseId)
        .eq("status", "published")
        .eq("academic_stage", profile.stage)
        .eq("academic_level", profile.level)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });

      if (loadError) throw loadError;
      setLessons((data ?? []) as Lesson[]);
      setReady(true);
    }

    load().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar las clases.");
      setReady(true);
    });
  }, [courseId]);

  if (!ready) return <div className="empty-state">Cargando clases...</div>;
  if (error) return <div className="auth-message auth-error">{error}</div>;
  if (lessons.length === 0) return <div className="empty-state">Todavía no hay clases publicadas para tu etapa y nivel actual.</div>;

  return (
    <div style={{ display: "grid", gap: 22 }}>
      {lessons.map((lesson) => (
        <LessonSheet
          key={lesson.id}
          courseName={courseName}
          courseIcon={courseIcon}
          unitTitle={lesson.unit_title}
          title={lesson.title}
          content={lesson.lesson_content}
          examples={lesson.examples}
          resources={lesson.resources}
        />
      ))}
    </div>
  );
}
