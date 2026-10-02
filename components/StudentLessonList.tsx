"use client";

import { useEffect, useMemo, useState } from "react";
import LessonSheet from "./LessonSheet";
import { goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./StudentLessonList.module.css";

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

type LessonFilter = "all" | "saved";

type StudentLessonListProps = {
  courseId: string;
  courseName: string;
  courseIcon?: string;
};

export default function StudentLessonList({ courseId, courseName, courseIcon = "📚" }: StudentLessonListProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [savedLessonIds, setSavedLessonIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<LessonFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingLessonId, setSavingLessonId] = useState<string | null>(null);
  const [courseKey, setCourseKey] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setReady(false);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData.session?.user.id;
      setUserId(currentUserId ?? null);
      if (!currentUserId) { setReady(true); return; }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("stage, level")
        .eq("id", currentUserId)
        .single();
      if (profileError) throw profileError;

      const [
        { data: lessonData, error: loadError },
        { data: bookmarkData, error: bookmarkError },
        { data: courseData, error: courseError },
      ] = await Promise.all([
        supabase
          .from("course_lessons")
          .select("id, course_id, unit_title, title, lesson_content, examples, resources, position")
          .eq("course_id", courseId)
          .eq("status", "published")
          .eq("academic_stage", profile.stage)
          .eq("academic_level", profile.level)
          .order("position", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("lesson_bookmarks")
          .select("lesson_id")
          .eq("user_id", currentUserId),
        supabase
          .from("courses")
          .select("course_key")
          .eq("id", courseId)
          .single(),
      ]);

      if (loadError) throw loadError;
      if (bookmarkError) throw bookmarkError;
      if (courseError) throw courseError;

      setLessons((lessonData ?? []) as Lesson[]);
      setSavedLessonIds((bookmarkData ?? []).map((row: { lesson_id: string }) => row.lesson_id));
      setCourseKey(courseData?.course_key ?? "");
      setSelectedId(null);
      setReady(true);
    }

    load().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar las clases.");
      setReady(true);
    });
  }, [courseId]);

  const savedSet = useMemo(() => new Set(savedLessonIds), [savedLessonIds]);
  const visibleLessons = useMemo(
    () => filter === "saved" ? lessons.filter((lesson) => savedSet.has(lesson.id)) : lessons,
    [filter, lessons, savedSet],
  );
  const savedInCourse = useMemo(
    () => lessons.filter((lesson) => savedSet.has(lesson.id)).length,
    [lessons, savedSet],
  );
  const selectedLesson = visibleLessons.find((lesson) => lesson.id === selectedId) ?? null;

  async function toggleSaved(lessonId: string) {
    if (!userId || savingLessonId) return;
    setSavingLessonId(lessonId);
    setError(null);

    try {
      if (savedSet.has(lessonId)) {
        const { error: removeError } = await supabase
          .from("lesson_bookmarks")
          .delete()
          .eq("user_id", userId)
          .eq("lesson_id", lessonId);
        if (removeError) throw removeError;
        setSavedLessonIds((current) => current.filter((id) => id !== lessonId));
      } else {
        const { error: saveError } = await supabase
          .from("lesson_bookmarks")
          .insert({ user_id: userId, lesson_id: lessonId });
        if (saveError) throw saveError;
        setSavedLessonIds((current) => current.includes(lessonId) ? current : [...current, lessonId]);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo actualizar la clase guardada.");
    } finally {
      setSavingLessonId(null);
    }
  }

  function openExercises() {
    if (!courseKey) return;
    goTo(`/course/?course=${encodeURIComponent(courseKey)}&tab=ejercicios`);
  }

  if (!ready) return <div className="empty-state">Cargando clases...</div>;
  if (error && lessons.length === 0) return <div className="auth-message auth-error">{error}</div>;
  if (lessons.length === 0) return <div className="empty-state">Todavía no hay clases publicadas para tu etapa y nivel actual.</div>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <button
            type="button"
            className={filter === "all" ? styles.filterActive : styles.filterButton}
            onClick={() => {
              setFilter("all");
              setSelectedId(null);
            }}
          >
            📚 Todas
          </button>
          <button
            type="button"
            className={filter === "saved" ? styles.filterActive : styles.filterButton}
            onClick={() => {
              setFilter("saved");
              setSelectedId(null);
            }}
          >
            🔖 Guardadas ({savedInCourse})
          </button>
        </div>
        <span className={styles.count}>
          {filter === "saved" ? `${visibleLessons.length} guardadas` : `${lessons.length} clases disponibles`}
        </span>
      </div>

      {error && <div className="auth-message auth-error">{error}</div>}

      {visibleLessons.length === 0 ? (
        <div className="empty-state">Todavía no has guardado ninguna clase de este curso. Pulsa 🔖 Guardar clase en la que quieras conservar a mano.</div>
      ) : (
        <div className={styles.cardGrid}>
          {visibleLessons.map((lesson) => {
            const isSaved = savedSet.has(lesson.id);
            const selected = selectedId === lesson.id;
            return (
              <article className={`${styles.lessonCard} ${selected ? styles.lessonCardSelected : ""}`} key={lesson.id}>
                <button
                  type="button"
                  className={styles.cardOpen}
                  onClick={() => setSelectedId(lesson.id)}
                >
                  <div className={styles.cardTopline}>
                    <span>{courseIcon} {courseName}</span>
                    <span className={styles.lessonBadge}>Clase {lesson.position}</span>
                  </div>
                  <strong>{lesson.title}</strong>
                  <small>{lesson.unit_title || "Clase del curso"}</small>
                  <span className={styles.openLabel}>Abrir clase →</span>
                </button>

                <button
                  type="button"
                  className={isSaved ? styles.bookmarkActive : styles.bookmarkButton}
                  disabled={savingLessonId === lesson.id}
                  onClick={() => void toggleSaved(lesson.id)}
                  aria-pressed={isSaved}
                >
                  {savingLessonId === lesson.id
                    ? "Guardando..."
                    : isSaved
                      ? "🔖 Guardada"
                      : "🔖 Guardar clase"}
                </button>
              </article>
            );
          })}
        </div>
      )}

      {!selectedLesson && visibleLessons.length > 0 && (
        <div className={styles.selectionHint}>Selecciona una tarjeta para abrir la clase.</div>
      )}

      {selectedLesson && (
        <section className={styles.detail}>
          <div className={styles.detailHeading}>
            <div>
              <p className="eyebrow">Clase seleccionada</p>
              <h3>{selectedLesson.title}</h3>
            </div>
            <button className="secondary-button" type="button" onClick={() => setSelectedId(null)}>Cerrar vista</button>
          </div>

          <LessonSheet
            courseName={courseName}
            courseIcon={courseIcon}
            unitTitle={selectedLesson.unit_title}
            title={selectedLesson.title}
            content={selectedLesson.lesson_content}
            examples={selectedLesson.examples}
            resources={selectedLesson.resources}
          />

          <div className={styles.reinforcementBox}>
            <div>
              <strong>¿Terminaste la clase?</strong>
              <p>Practica el tema con los ejercicios de este curso.</p>
            </div>
            <button className={styles.exerciseLink} type="button" onClick={openExercises} disabled={!courseKey}>
              ✏️ Haz el ejercicio para reforzar el tema →
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
