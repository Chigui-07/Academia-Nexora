import AppShell from "@/components/AppShell";
import CourseRequestForm from "@/components/CourseRequestForm";
import MathDiagnosticLauncher from "@/components/MathDiagnosticLauncher";

export default function CoursesPage() {
  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Cursos</p>
          <h1>Mis materias</h1>
          <p>Aquí aparecerán tus materias asignadas y siempre podrás solicitar una nueva.</p>
        </div>
      </div>

      <section className="card-grid" style={{ marginBottom: 18 }}>
        <article className="course-card">
          <div className="course-icon">📚</div>
          <h3>Aún no hay materias asignadas</h3>
          <p>Cuando Administración atienda tus solicitudes, tus cursos aparecerán en esta sección.</p>
        </article>
      </section>

      <MathDiagnosticLauncher />
      <CourseRequestForm />
    </AppShell>
  );
}
