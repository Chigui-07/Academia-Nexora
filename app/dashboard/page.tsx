import AppShell from "@/components/AppShell";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Panel principal</p>
          <h1>Hola, Chigui 👋</h1>
          <p>Tu progreso académico empezará a aparecer aquí.</p>
        </div>
        <span className="stage-badge">🌱 Fundamentos · Año 1</span>
      </div>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-label">Tareas pendientes</div>
          <div className="stat-value">0</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Promedio actual</div>
          <div className="stat-value">—</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Cursos activos</div>
          <div className="stat-value">0</div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <h2>📝 Tareas disponibles</h2>
          <div className="empty-state">
            Aún no hay tareas activas. Cuando configuremos tus materias, aparecerán aquí automáticamente.
          </div>
        </article>

        <article className="panel">
          <h2>🏅 Próximo logro</h2>
          <div className="empty-state">
            Completa tu primera actividad para comenzar a desbloquear insignias.
          </div>
        </article>
      </section>
    </AppShell>
  );
}
