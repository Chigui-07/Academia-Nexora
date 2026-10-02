import AITeacherManager from "@/components/AITeacherManager";
import AdminCourseManager from "@/components/AdminCourseManager";
import AdminCourseRequests from "@/components/AdminCourseRequests";
import AdminEnrollmentManager from "@/components/AdminEnrollmentManager";
import AppShell from "@/components/AppShell";
import TeacherActivityManager from "@/components/TeacherActivityManager";
import TeacherLessonManager from "@/components/TeacherLessonManager";

const adminActions = [
  ["🤖 Profesor IA", "Genera propuestas de clases, tareas y ejercicios para revisarlas antes de guardarlas."],
  ["📚 Gestionar cursos", "Crea, edita, activa o desactiva materias del catálogo."],
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
          <p>Gestiona el catálogo, organiza a tus alumnos y prepara el contenido académico desde un solo lugar.</p>
        </div>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Administración</p>
            <h2>⚙️ Cursos y usuarios</h2>
            <p className="muted-copy">Cada apartado tiene más espacio para que puedas trabajar con calma sin mezclar información entre cursos o estudiantes.</p>
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

      <div className="admin-management-stack">
        <AITeacherManager />
        <AdminCourseManager />
        <AdminEnrollmentManager />
        <AdminCourseRequests />
        <TeacherLessonManager />
        <TeacherActivityManager />
      </div>
    </AppShell>
  );
}
