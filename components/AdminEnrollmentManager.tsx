"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./AdminEnrollmentManager.module.css";

type StudentProfile = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  student_code: string | null;
};

type Course = {
  id: string;
  name: string;
  icon: string;
  category: string;
  active: boolean;
  is_essential: boolean;
};

type Enrollment = {
  user_id: string;
  course_id: string;
  status: "active" | "paused" | "completed";
};

function studentName(profile: StudentProfile) {
  const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
  return profile.display_name?.trim() || fullName || profile.username || "Estudiante";
}

export default function AdminEnrollmentManager() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [ready, setReady] = useState(false);
  const [workingCourseId, setWorkingCourseId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setReady(false);
    setError(null);

    const [profileResult, courseResult, enrollmentResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, first_name, last_name, username, student_code")
        .order("display_name", { ascending: true, nullsFirst: false }),
      supabase
        .from("courses")
        .select("id, name, icon, category, active, is_essential")
        .order("category", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("course_enrollments")
        .select("user_id, course_id, status"),
    ]);

    if (profileResult.error) throw profileResult.error;
    if (courseResult.error) throw courseResult.error;
    if (enrollmentResult.error) throw enrollmentResult.error;

    const loadedStudents = (profileResult.data ?? []) as StudentProfile[];
    setStudents(loadedStudents);
    setCourses((courseResult.data ?? []) as Course[]);
    setEnrollments((enrollmentResult.data ?? []) as Enrollment[]);
    setSelectedUserId((current) => current && loadedStudents.some((student) => student.id === current)
      ? current
      : loadedStudents[0]?.id ?? null);
    setReady(true);
  }

  useEffect(() => {
    load().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar las inscripciones.");
      setReady(true);
    });
  }, []);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    if (!term) return students;
    return students.filter((student) => {
      const text = `${studentName(student)} ${student.username ?? ""} ${student.student_code ?? ""}`.toLocaleLowerCase("es");
      return text.includes(term);
    });
  }, [students, search]);

  const selectedStudent = students.find((student) => student.id === selectedUserId) ?? null;
  const regularCourses = courses.filter((course) => !course.is_essential && course.active);
  const selectedEnrollments = useMemo(
    () => new Map(
      enrollments
        .filter((enrollment) => enrollment.user_id === selectedUserId)
        .map((enrollment) => [enrollment.course_id, enrollment]),
    ),
    [enrollments, selectedUserId],
  );

  async function toggleCourse(course: Course) {
    if (!selectedStudent) return;
    const current = selectedEnrollments.get(course.id);
    const shouldActivate = current?.status !== "active";

    setWorkingCourseId(course.id);
    setMessage(null);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc("admin_set_course_enrollment", {
        p_user_id: selectedStudent.id,
        p_course_id: course.id,
        p_active: shouldActivate,
      });
      if (rpcError) throw rpcError;

      const nextStatus = (data === "active" ? "active" : "paused") as Enrollment["status"];
      setEnrollments((currentRows) => {
        const found = currentRows.some((row) => row.user_id === selectedStudent.id && row.course_id === course.id);
        if (!found) {
          return [...currentRows, { user_id: selectedStudent.id, course_id: course.id, status: nextStatus }];
        }
        return currentRows.map((row) => row.user_id === selectedStudent.id && row.course_id === course.id
          ? { ...row, status: nextStatus }
          : row);
      });

      setMessage(shouldActivate
        ? `${course.name} fue asignado a ${studentName(selectedStudent)}.`
        : `${course.name} fue retirado de los cursos activos de ${studentName(selectedStudent)}. Su historial se conserva.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo cambiar la inscripción.");
    } finally {
      setWorkingCourseId(null);
    }
  }

  return (
    <section className={styles.wrapper} id="inscripciones">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h2>👥 Inscripciones</h2>
          <p className="muted-copy">Busca un usuario y asígnale o retírale cursos directamente. Retirar un curso lo pausa: no borra sus tareas, intentos ni calificaciones.</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => void load()}>↻ Actualizar</button>
      </div>

      {!ready ? (
        <div className="empty-state">Cargando usuarios y cursos...</div>
      ) : error && students.length === 0 ? (
        <div className="auth-message auth-error">{error}</div>
      ) : (
        <div className={styles.layout}>
          <aside className={styles.studentsPanel}>
            <label className={styles.searchLabel}>
              Buscar usuario
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre, usuario o Carné..."
              />
            </label>

            <div className={styles.studentList}>
              {filteredStudents.length === 0 ? (
                <div className="empty-state">No encontramos usuarios con esa búsqueda.</div>
              ) : filteredStudents.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  className={`${styles.studentButton} ${selectedUserId === student.id ? styles.studentButtonActive : ""}`}
                  onClick={() => {
                    setSelectedUserId(student.id);
                    setMessage(null);
                    setError(null);
                  }}
                >
                  <strong>{studentName(student)}</strong>
                  <small>{student.student_code || student.username || "Sin Carné"}</small>
                </button>
              ))}
            </div>
          </aside>

          <div className={styles.coursePanel}>
            {!selectedStudent ? (
              <div className="empty-state">Selecciona un usuario.</div>
            ) : (
              <>
                <div className={styles.selectedHeader}>
                  <div>
                    <p className="eyebrow">Usuario seleccionado</p>
                    <h3>{studentName(selectedStudent)}</h3>
                    <span>{selectedStudent.student_code || selectedStudent.username || "Sin Carné"}</span>
                  </div>
                  <strong>{Array.from(selectedEnrollments.values()).filter((row) => row.status === "active").length} cursos activos</strong>
                </div>

                <div className={styles.note}>
                  🌱 Los cursos de Formación esencial se administran automáticamente y por eso no aparecen en esta lista.
                </div>

                <div className={styles.courseGrid}>
                  {regularCourses.map((course) => {
                    const enrollment = selectedEnrollments.get(course.id);
                    const active = enrollment?.status === "active";
                    return (
                      <article className={styles.courseCard} key={course.id}>
                        <div>
                          <span>{course.category}</span>
                          <h4>{course.icon} {course.name}</h4>
                          <small>{active ? "✅ Asignado" : enrollment ? "⏸️ Pausado" : "Sin asignar"}</small>
                        </div>
                        <button
                          className={active ? "secondary-button" : "primary-button"}
                          type="button"
                          disabled={workingCourseId === course.id}
                          onClick={() => void toggleCourse(course)}
                        >
                          {workingCourseId === course.id ? "Guardando..." : active ? "Retirar curso" : "Asignar curso"}
                        </button>
                      </article>
                    );
                  })}
                </div>

                {error && <div className="auth-message auth-error">{error}</div>}
                {message && <div className="auth-message auth-success">{message}</div>}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
