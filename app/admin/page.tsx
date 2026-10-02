import AdminCourseRequests from "@/components/AdminCourseRequests";
import AdminEnrollmentManager from "@/components/AdminEnrollmentManager";
import AppShell from "@/components/AppShell";
import TeacherActivityManager from "@/components/TeacherActivityManager";
import TeacherGradingManager from "@/components/TeacherGradingManager";
import TeacherLessonManager from "@/components/TeacherLessonManager";

const adminActions = [
  ["📚 Gestionar cursos", "Administra el catálogo de materias de Academia Nexora."],
  ["👥 Inscripciones", "Agrega o retira cursos de los usuarios y revisa sus asignaciones."],
  ["📩 Solicitudes", "Revisa las solicitudes de cursos enviadas por los estudiantes."],
] as const;

export default function AdminPage() {
  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Administración y Profesor</p>
          <h1>Panel de gestión</h1>
          <p>Administración organiza cursos e inscripciones; Profesor prepara clases, actividades y revisa entregas.</p>
        </div>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Administración</p>
            <h2>⚙️ Cursos y usuarios</h2>
            <p className="muted-copy">Esta parte se encarga del catálogo, las solicitudes y de asignar cursos a los estudiantes.</p>
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
      <TeacherGradingManager />
    </AppShell>
  );
}
