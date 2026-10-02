"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import TeacherGradingManager from "./TeacherGradingManager";
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

type GradingSummary = {
  student_id: string;
  reviewed_at: string | null;
};

type WorkspaceTab = "courses" | "submissions";
type StudentFilter = "all" | "pending" | "enrolled";

function studentName(profile: StudentProfile) {
  const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
  return profile.display_name?.trim() || fullName || profile.username || "Estudiante";
}

export default function AdminEnrollmentManager() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [gradingRows, setGradingRows] = useState<GradingSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState<StudentFilter>("all");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("courses");
  const [ready, setReady] = useState(false);
  const [workingCourseId, setWorkingCourseId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setReady(false);
    setError(null);

    const [profileResult, courseResult, enrollmentResult, gradingResult] = await Promise.all([
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
      supabase.rpc("get_teacher_grading_queue"),
    ]);

    if (profileResult.error) throw profileResult.error;
    if (courseResult.error) throw courseResult.error;
    if (enrollmentResult.error) throw enrollmentResult.error;
    if (gradingResult.error) throw gradingResult.error;

    const loadedStudents = (profileResult.data ?? []) as StudentProfile[];
    setStudents(loadedStudents);
    setCourses((courseResult.data ?? []) as Course[]);
    setEnrollments((enrollmentResult.data ?? []) as Enrollment[]);
    setGradingRows(((gradingResult.data ?? []) as GradingSummary[]));
    setSelectedUserId((current) => current && loadedStudents.some((student) => student.id === current)
      ? current
      : loadedStudents[0]?.id ?? null);
    setReady(true);
  }

  useEffect(() => {
    load().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar los alumnos.");
      setReady(true);
    });
  }, []);

  const activeCountByStudent = useMemo(() => {
    const map = new Map<string, number>();
    for (const enrollment of enrollments) {
      if (enrollment.status !== "active") continue;
      map.set(enrollment.user_id, (map.get(enrollment.user_id) ?? 0) + 1);
    }
    return map;
  }, [enrollments]);

  const pendingCountByStudent = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of gradingRows) {
      if (row.reviewed_at) continue;
      map.set(row.student_id, (map.get(row.student_id) ?? 0) + 1);
    }
    return map;
  }, [gradingRows]);

  const reviewedCountByStudent = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of gradingRows) {
      if (!row.reviewed_at) continue;
      map.set(row.student_id, (map.get(row.student_id) ?? 0) + 1);
    }
    return map;
  }, [gradingRows]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    const rows = students.filter((student) => {
      const text = `${studentName(student)} ${student.username ?? ""} ${student.student_code ?? ""}`.toLocaleLowerCase("es");
      const matchesSearch = !term || text.includes(term);
      if (!matchesSearch) return false;
      if (studentFilter === "pending") return (pendingCountByStudent.get(student.id) ?? 0) > 0;
      if (studentFilter === "enrolled") return (activeCountByStudent.get(student.id) ?? 0) > 0;
      return true;
    });

    return rows.sort((a, b) => {
      const pendingDifference = (pendingCountByStudent.get(b.id) ?? 0) - (pendingCountByStudent.get(a.id) ?? 0);
      if (pendingDifference !== 0) return pendingDifference;
      return studentName(a).localeCompare(studentName(b), "es");
    });
  }, [students, search, studentFilter, pendingCountByStudent, activeCountByStudent]);

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
  const selectedActiveCourses = courses.filter((course) => selectedEnrollments.get(course.id)?.status === "active");
  const selectedPending = selectedUserId ? pendingCountByStudent.get(selectedUserId) ?? 0 : 0;
  const selectedReviewed = selectedUserId ? reviewedCountByStudent.get(selectedUserId) ?? 0 : 0;

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
          <h2>👥 Alumnos</h2>
          <p className="muted-copy">Selecciona primero a un alumno. Desde su ficha puedes administrar cursos y revisar únicamente sus entregas.</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => void load()}>↻ Actualizar todo</button>
      </div>

      {!ready ? (
        <div className="empty-state">Cargando alumnos, cursos y entregas...</div>
      ) : error && students.length === 0 ? (
        <div className="auth-message auth-error">{error}</div>
      ) : (
        <div className={styles.layout}>
          <aside className={styles.studentsPanel}>
            <label className={styles.searchLabel}>
              Buscar alumno
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre, usuario o Carné..."
              />
            </label>

            <label className={styles.searchLabel}>
              Clasificar
              <select value={studentFilter} onChange={(event) => setStudentFilter(event.target.value as StudentFilter)}>
                <option value="all">Todos los alumnos</option>
                <option value="pending">Con entregas pendientes</option>
                <option value="enrolled">Con cursos activos</option>
              </select>
            </label>

            <div className={styles.studentList}>
              {filteredStudents.length === 0 ? (
                <div className="empty-state">No encontramos alumnos con esos filtros.</div>
              ) : filteredStudents.map((student) => {
                const pending = pendingCountByStudent.get(student.id) ?? 0;
                const activeCourses = activeCountByStudent.get(student.id) ?? 0;
                return (
                  <button
                    key={student.id}
                    type="button"
                    className={`${styles.studentButton} ${selectedUserId === student.id ? styles.studentButtonActive : ""}`}
                    onClick={() => {
                      setSelectedUserId(student.id);
                      setActiveTab(pending > 0 ? "submissions" : "courses");
                      setMessage(null);
                      setError(null);
                    }}
                  >
                    <strong>{studentName(student)}</strong>
                    <small>{student.student_code || student.username || "Sin Carné"}</small>
                    <div className={styles.studentBadges}>
                      <span>📚 {activeCourses} cursos</span>
                      <span className={pending > 0 ? styles.pendingStudentBadge : undefined}>📝 {pending} pendientes</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className={styles.coursePanel}>
            {!selectedStudent ? (
              <div className="empty-state">Selecciona un alumno.</div>
            ) : (
              <>
                <div className={styles.selectedHeader}>
                  <div>
                    <p className="eyebrow">Alumno seleccionado</p>
                    <h3>{studentName(selectedStudent)}</h3>
                    <span>{selectedStudent.student_code || selectedStudent.username || "Sin Carné"}</span>
                  </div>
                  <div className={styles.selectedStats}>
                    <strong>📚 {selectedActiveCourses.length} cursos</strong>
                    <strong className={selectedPending > 0 ? styles.pendingStat : undefined}>📝 {selectedPending} pendientes</strong>
                    <strong>✅ {selectedReviewed} revisadas</strong>
                  </div>
                </div>

                <div className={styles.workspaceTabs}>
                  <button
                    type="button"
                    className={activeTab === "courses" ? "primary-button" : "secondary-button"}
                    onClick={() => setActiveTab("courses")}
                  >
                    📚 Cursos del alumno
                  </button>
                  <button
                    type="button"
                    className={activeTab === "submissions" ? "primary-button" : "secondary-button"}
                    onClick={() => setActiveTab("submissions")}
                  >
                    📝 Entregas {selectedPending > 0 ? `(${selectedPending} pendientes)` : ""}
                  </button>
                </div>

                {activeTab === "courses" && (
                  <>
                    <section className={styles.currentCourses}>
                      <div>
                        <p className="eyebrow">Cursos actuales</p>
                        <h3>Materias asignadas</h3>
                      </div>
                      {selectedActiveCourses.length === 0 ? (
                        <div className="empty-state">Este alumno todavía no tiene cursos activos.</div>
                      ) : (
                        <div className={styles.activeCourseChips}>
                          {selectedActiveCourses.map((course) => (
                            <span key={course.id}>{course.icon} {course.name}{course.is_essential ? " · esencial" : ""}</span>
                          ))}
                        </div>
                      )}
                    </section>

                    <div className={styles.note}>
                      🌱 Los cursos de Formación esencial se muestran arriba, pero se administran automáticamente y no pueden retirarse manualmente aquí.
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

                {activeTab === "submissions" && (
                  <TeacherGradingManager
                    key={selectedStudent.id}
                    studentId={selectedStudent.id}
                    studentName={studentName(selectedStudent)}
                    embedded
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
