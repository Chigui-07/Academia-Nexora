"use client";

import { useEffect, useMemo, useState } from "react";
import { goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./DashboardLessonBoard.module.css";

type LessonTab = "new" | "reviewed";

type Profile = {
  stage: string;
  level: number;
};

type Enrollment = {
  course_id: string;
  required_until: string | null;
};

type Course = {
  id: string;
  course_key: string;
  name: string;
  icon: string;
  is_essential: boolean;
};

type Lesson = {
  id: string;
  course_id: string;
  unit_title: string;
  title: string;
  position: number;
  published_at: string | null;
  created_at: string;
  assignment_mode: "course" | "students";
  academic_stage: string;
  academic_level: number;
};

type LessonView = {
  lesson_id: string;
  reviewed_at: string;
};

type LessonRow = {
  lesson: Lesson;
  course: Course;
  reviewedAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function sameStage(a: string, b: string) {
  return a.trim().toLocaleLowerCase("es") === b.trim().toLocaleLowerCase("es");
}

function essentialEnrollmentIsActive(requiredUntil: string | null) {
  return !requiredUntil || new Date(requiredUntil).getTime() > Date.now();
}

export default function DashboardLessonBoard() {
  const [rows, setRows] = useState<LessonRow[]>([]);
  const [activeTab, setActiveTab] = useState<LessonTab>("new");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setReady(false);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        if (!cancelled) setReady(true);
        return;
      }

      const [
        { data: profileData, error: profileError },
        { data: enrollmentData, error: enrollmentError },
      ] = await Promise.all([
        supabase.from("profiles").select("stage, level").eq("id", userId).single(),
        supabase
          .from("course_enrollments")
          .select("course_id, required_until")
          .eq("user_id", userId)
          .eq("status", "active"),
      ]);

      if (profileError) throw profileError;
      if (enrollmentError) throw enrollmentError;

      const profile = profileData as Profile;
      const enrollments = (enrollmentData ?? []) as Enrollment[];
      if (enrollments.length === 0) {
        if (!cancelled) {
          setRows([]);
          setReady(true);
        }
        return;
      }

      const enrolledCourseIds = Array.from(new Set(enrollments.map((item) => item.course_id)));
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("id, course_key, name, icon, is_essential")
        .in("id", enrolledCourseIds)
        .eq("active", true);
      if (courseError) throw courseError;

      const courses = (courseData ?? []) as Course[];
      const courseMap = new Map(courses.map((course) => [course.id, course]));
      const enrollmentMap = new Map(enrollments.map((item) => [item.course_id, item]));
      const visibleCourseIds = courses
        .filter((course) => {
          const enrollment = enrollmentMap.get(course.id);
          return Boolean(enrollment) && (!course.is_essential || essentialEnrollmentIsActive(enrollment?.required_until ?? null));
        })
        .map((course) => course.id);

      if (visibleCourseIds.length === 0) {
        if (!cancelled) {
          setRows([]);
          setReady(true);
        }
        return;
      }

      const { data: lessonData, error: lessonError } = await supabase
        .from("course_lessons")
        .select("id, course_id, unit_title, title, position, published_at, created_at, assignment_mode, academic_stage, academic_level")
        .eq("status", "published")
        .in("course_id", visibleCourseIds)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (lessonError) throw lessonError;

      let lessons = ((lessonData ?? []) as Lesson[]).filter((lesson) => {
        const course = courseMap.get(lesson.course_id);
        if (!course) return false;
        if (course.is_essential) return true;
        return sameStage(lesson.academic_stage, profile.stage) && lesson.academic_level === profile.level;
      });

      const targetedLessonIds = lessons
        .filter((lesson) => lesson.assignment_mode === "students")
        .map((lesson) => lesson.id);

      let assignedSet = new Set<string>();
      if (targetedLessonIds.length > 0) {
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("course_lesson_assignments")
          .select("lesson_id")
          .eq("user_id", userId)
          .in("lesson_id", targetedLessonIds);
        if (assignmentError) throw assignmentError;
        assignedSet = new Set((assignmentData ?? []).map((item: { lesson_id: string }) => item.lesson_id));
      }

      lessons = lessons.filter(
        (lesson) => lesson.assignment_mode === "course" || assignedSet.has(lesson.id),
      );

      if (lessons.length === 0) {
        if (!cancelled) {
          setRows([]);
          setReady(true);
        }
        return;
      }

      const lessonIds = lessons.map((lesson) => lesson.id);
      const { data: viewData, error: viewError } = await supabase
        .from("lesson_views")
        .select("lesson_id, reviewed_at")
        .eq("user_id", userId)
        .in("lesson_id", lessonIds);
      if (viewError) throw viewError;

      const viewMap = new Map(
        ((viewData ?? []) as LessonView[]).map((view) => [view.lesson_id, view.reviewed_at]),
      );

      const nextRows: LessonRow[] = [];
      for (const lesson of lessons) {
        const course = courseMap.get(lesson.course_id);
        if (!course) continue;
        nextRows.push({
          lesson,
          course,
          reviewedAt: viewMap.get(lesson.id) ?? null,
        });
      }

      if (!cancelled) {
        setRows(nextRows);
        setReady(true);
      }
    }

    load().catch((caughtError) => {
      if (cancelled) return;
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar tus clases.");
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => ({
    new: rows.filter((row) => !row.reviewedAt).length,
    reviewed: rows.filter((row) => Boolean(row.reviewedAt)).length,
  }), [rows]);

  const visibleRows = useMemo(() => {
    const filtered = rows.filter((row) => activeTab === "new" ? !row.reviewedAt : Boolean(row.reviewedAt));
    return filtered.slice().sort((a, b) => {
      if (activeTab === "reviewed") {
        return new Date(b.reviewedAt ?? 0).getTime() - new Date(a.reviewedAt ?? 0).getTime();
      }
      const aDate = a.lesson.published_at ?? a.lesson.created_at;
      const bDate = b.lesson.published_at ?? b.lesson.created_at;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  }, [activeTab, rows]);

  if (!ready) return <div className="empty-state">Cargando clases...</div>;
  if (error) return <div className="auth-message auth-error">{error}</div>;

  return (
    <div className={styles.board}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={activeTab === "new" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("new")}
        >
          🆕 Nuevas <span>{counts.new}</span>
        </button>
        <button
          type="button"
          className={activeTab === "reviewed" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("reviewed")}
        >
          ✅ Revisadas <span>{counts.reviewed}</span>
        </button>
      </div>

      {visibleRows.length === 0 ? (
        <div className="empty-state">
          {activeTab === "new"
            ? "No tienes clases nuevas. Ya revisaste todas las que están disponibles para ti."
            : "Todavía no has revisado ninguna clase."}
        </div>
      ) : (
        <div className={styles.grid}>
          {visibleRows.map(({ lesson, course, reviewedAt }) => (
            <article className={styles.card} key={lesson.id}>
              <div className={styles.topline}>
                <span>{course.icon} {course.name}</span>
                <strong className={reviewedAt ? styles.reviewedBadge : styles.newBadge}>
                  {reviewedAt ? "✅ Revisada" : "🆕 Nueva"}
                </strong>
              </div>

              <div>
                <p className="eyebrow">Clase {lesson.position}</p>
                <h3>{lesson.title}</h3>
                <p className={styles.unit}>{lesson.unit_title || "Clase del curso"}</p>
              </div>

              <div className={styles.dateBox}>
                <small>{reviewedAt ? "Última revisión" : "Publicada"}</small>
                <strong>{formatDate(reviewedAt ?? lesson.published_at ?? lesson.created_at)}</strong>
              </div>

              <button
                className="secondary-button"
                type="button"
                onClick={() => goTo(`/course/?course=${encodeURIComponent(course.course_key)}&tab=clases&lesson=${encodeURIComponent(lesson.id)}`)}
              >
                {reviewedAt ? "Volver a revisar" : "Abrir clase"} →
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
