import AppShell from "@/components/AppShell";

export default function CoursesPage() {
  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Cursos</p>
          <h1>Mis materias</h1>
          <p>Aquí aparecerán las materias asignadas a tu cuenta.</p>
        </div>
      </div>

      <section className="card-grid">
        <article className="course-card">
          <div className="course-icon">➕</div>
          <h3>Aún no hay materias</h3>
          <p>Definiremos tus cursos de Fundamentos · Año 1 cuando estés listo.</p>
        </article>
      </section>
    </AppShell>
  );
}
