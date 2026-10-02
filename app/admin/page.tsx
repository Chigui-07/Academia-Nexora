import AdminCourseRequests from "@/components/AdminCourseRequests";
import AdminEnrollmentManager from "@/components/AdminEnrollmentManager";
import AppShell from "@/components/AppShell";
import TeacherActivityManager from "@/components/TeacherActivityManager";
import TeacherLessonManager from "@/components/TeacherLessonManager";

const adminActions = [
  ["📚 Gestionar cursos", "Administra el catálogo de materias de Academia Nexora."],
  ["👥 Alumnos", "Selecciona un alumno para ver sus cursos, asignaciones y entregas."],
  ["📩 Solicitudes", "Revisa las solicitudes de cursos enviadas por los estudiantes."],
] as const;

export default function AdminPage() {
  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Administración y Profesor</p>
          <h1>Panel de gestión</h1>
          <p>Organiza primero por alumno: revisa sus cursos, asígnale materias y califica únicamente sus entregas.</p>
        </div>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Administración</p>
            <h2>⚙️ Cursos y usuarios</h2>
            <p className="muted-copy">La ficha de cada alumno concentra sus cursos y sus entregas para que no tengas información de usuarios distintos mezclada.</p>
          </div>
        </div>

        <section className="admin-actions">
          {adminActions.map(([title, description]) => (
            <article className="action-card" key={title}>
              <strong>{title}</strong>
              <span>{description}</span>
            </article>
          ))}
        </section>
      </section>

      <AdminEnrollmentManager />

      <div style={{ marginTop: 18 }}>
        <AdminCourseRequests />
      </div>

      <TeacherLessonManager />
      <TeacherActivityManager />
    </AppShell>
  );
}
