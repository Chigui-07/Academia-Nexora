"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import LessonSheet from "./LessonSheet";
import { supabase } from "@/lib/supabase";
import styles from "./TeacherLessonManager.module.css";

type LessonStatus = "draft" | "published";

type Course = {
  id: string;
  name: string;
  icon: string;
};

type Lesson = {
  id: string;
  course_id: string;
  created_by: string;
  unit_title: string;
  title: string;
  lesson_content: string;
  examples: string;
  resources: string;
  position: number;
  status: LessonStatus;
  published_at: string | null;
  created_at: string;
};

export default function TeacherLessonManager() {
  const [isTeacher, setIsTeacher] = useState(false);
  const [ready, setReady] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [courseId, setCourseId] = useState("");
  const [unitTitle, setUnitTitle] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [examples, setExamples] = useState("");
  const [resources, setResources] = useState("");
  const [position, setPosition] = useState("1");
  const [status, setStatus] = useState<LessonStatus>("draft");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const courseMap = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);

  async function loadData() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) return;

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const teacher = (roleData ?? []).some((row) => row.role === "teacher");
    setIsTeacher(teacher);

    if (!teacher) {
      setReady(true);
      return;
    }

    const [{ data: courseData, error: courseError }, { data: lessonData, error: lessonError }] = await Promise.all([
      supabase
        .from("courses")
        .select("id, name, icon")
        .eq("active", true)
        .order("name"),
      supabase
        .from("course_lessons")
        .select("id, course_id, created_by, unit_title, title, lesson_content, examples, resources, position, status, published_at, created_at")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

    if (courseError) throw courseError;
    if (lessonError) throw lessonError;

    const loadedCourses = (courseData ?? []) as Course[];
    setCourses(loadedCourses);
    setLessons((lessonData ?? []) as Lesson[]);
    if (!courseId && loadedCourses[0]) setCourseId(loadedCourses[0].id);
    setReady(true);
  }

  useEffect(() => {
    loadData().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo cargar el creador de clases.");
      setReady(true);
    });
  }, []);

  function resetForm() {
    setEditingId(null);
    setUnitTitle("");
    setTitle("");
    setContent("");
    setExamples("");
    setResources("");
    setPosition("1");
    setStatus("draft");
    setPreviewOpen(false);
    setMessage(null);
    setError(null);
  }

  function editLesson(lesson: Lesson) {
    setEditingId(lesson.id);
    setCourseId(lesson.course_id);
    setUnitTitle(lesson.unit_title);
    setTitle(lesson.title);
    setContent(lesson.lesson_content);
    setExamples(lesson.examples);
    setResources(lesson.resources);
    setPosition(String(lesson.position));
    setStatus(lesson.status);
    setPreviewOpen(false);
    setMessage("Editando clase existente.");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) throw new Error("Tu sesión terminó. Inicia sesión nuevamente.");
      if (!courseId) throw new Error("Selecciona un curso.");
      if (title.trim().length < 2) throw new Error("Escribe un título para la clase.");
      if (status === "published" && !content.trim()) throw new Error("Una clase publicada necesita una explicación.");

      const positionValue = Number(position);
      if (!Number.isInteger(positionValue) || positionValue < 1 || positionValue > 999) {
        throw new Error("El orden de la clase debe ser un número entre 1 y 999.");
      }

      const payload = {
        course_id: courseId,
        unit_title: unitTitle.trim(),
        title: title.trim(),
        lesson_content: content.trim(),
        examples: examples.trim(),
        resources: resources.trim(),
        position: positionValue,
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("course_lessons")
          .update(payload)
          .eq("id", editingId);
        if (updateError) throw updateError;
        setMessage("Clase actualizada correctamente.");
      } else {
        const { error: insertError } = await supabase
          .from("course_lessons")
          .insert({ ...payload, created_by: session.user.id });
        if (insertError) throw insertError;
        setMessage(status === "published" ? "Clase publicada correctamente." : "Borrador de clase guardado.");
      }

      setEditingId(null);
      setUnitTitle("");
      setTitle("");
      setContent("");
      setExamples("");
      setResources("");
      setPosition("1");
      setStatus("draft");
      setPreviewOpen(false);
      await loadData();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo guardar la clase.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <div className="empty-state">Cargando clases...</div>;
  if (!isTeacher) return null;

  const previewCourse = courseMap.get(courseId);

  return (
    <section className={styles.wrapper}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Profesor</p>
          <h2>📖 Crear y gestionar clases</h2>
          <p className="muted-copy">Publica teoría, explicaciones y ejemplos para que el estudiante pueda estudiar antes de practicar.</p>
        </div>
      </div>

      <form className={styles.builder} onSubmit={handleSubmit}>
        <div className={styles.settingsPanel}>
          <h3>{editingId ? "Editar clase" : "Nueva clase"}</h3>

          <label>
            Curso
            <select value={courseId} onChange={(event) => setCourseId(event.target.value)} required>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.icon} {course.name}</option>
              ))}
            </select>
          </label>

          <label>
            Unidad o tema
            <input value={unitTitle} onChange={(event) => setUnitTitle(event.target.value)} placeholder="Ej. Unidad 1 · Números enteros" maxLength={120} />
          </label>

          <label>
            Título de la clase
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Suma y resta de enteros" maxLength={160} required />
          </label>

          <label>
            Orden
            <input type="number" min="1" max="999" value={position} onChange={(event) => setPosition(event.target.value)} required />
            <small>Las clases con números menores aparecen primero.</small>
          </label>

          <label>
            Estado
            <select value={status} onChange={(event) => setStatus(event.target.value as LessonStatus)}>
              <option value="draft">Borrador</option>
              <option value="published">Publicada</option>
            </select>
          </label>

          {error && <div className="auth-message auth-error">{error}</div>}
          {message && <div className="auth-message auth-success">{message}</div>}

          <div className={styles.actions}>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Guardando..." : editingId ? "Guardar cambios" : status === "published" ? "Publicar clase" : "Guardar borrador"}
            </button>
            <button className="secondary-button" type="button" onClick={() => setPreviewOpen((value) => !value)}>
              {previewOpen ? "Ocultar vista previa" : "👁️ Vista previa"}
            </button>
            {editingId && <button className="secondary-button" type="button" onClick={resetForm}>Cancelar edición</button>}
          </div>
        </div>

        <div className={styles.editorPanel}>
          <label>
            Explicación de la clase
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Explica el tema paso a paso. Puedes usar párrafos, listas simples y procedimientos..."
              rows={13}
            />
          </label>

          <label>
            Ejemplos guiados
            <textarea
              value={examples}
              onChange={(event) => setExamples(event.target.value)}
              placeholder="Ejemplo 1: ...\nProcedimiento: ..."
              rows={8}
            />
          </label>

          <label>
            Recursos o notas adicionales
            <textarea
              value={resources}
              onChange={(event) => setResources(event.target.value)}
              placeholder="Fórmulas, recordatorios, enlaces escritos o indicaciones para estudiar..."
              rows={5}
            />
          </label>
        </div>
      </form>

      {previewOpen && (
        <div className={styles.previewSection}>
          <p className="eyebrow">Vista del estudiante</p>
          <LessonSheet
            courseName={previewCourse?.name ?? "Curso"}
            courseIcon={previewCourse?.icon ?? "📚"}
            unitTitle={unitTitle}
            title={title}
            content={content}
            examples={examples}
            resources={resources}
            preview
          />
        </div>
      )}

      <div className={styles.savedSection}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Contenido creado</p>
            <h3>Clases guardadas</h3>
          </div>
        </div>

        {lessons.length === 0 ? (
          <div className="empty-state">Todavía no has creado clases.</div>
        ) : (
          <div className={styles.lessonList}>
            {lessons.map((lesson) => {
              const course = courseMap.get(lesson.course_id);
              return (
                <article className={styles.lessonRow} key={lesson.id}>
                  <div>
                    <span>{course?.icon ?? "📚"} {course?.name ?? "Curso"} · Orden {lesson.position}</span>
                    <strong>{lesson.title}</strong>
                    <small>{lesson.unit_title || "Sin unidad"} · {lesson.status === "published" ? "Publicada" : "Borrador"}</small>
                  </div>
                  <button className="secondary-button" type="button" onClick={() => editLesson(lesson)}>Editar</button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
