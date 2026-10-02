import AppShell from "@/components/AppShell";
import DashboardWelcome from "@/components/DashboardWelcome";
import DashboardStats from "@/components/DashboardStats";
import StudentActivityList from "@/components/StudentActivityList";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Panel principal</p>
          <DashboardWelcome />
          <p>Tu progreso académico empezará a aparecer aquí.</p>
        </div>
        <span className="stage-badge">🌱 Fundamentos · Año 1</span>
      </div>

      <DashboardStats />

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

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Práctica rápida</p>
            <h2>✏️ Ejercicios disponibles</h2>
            <p className="muted-copy">Aquí aparecen solo ejercicios activos que todavía no has terminado. Cuando finalices uno, seguirá disponible dentro de su curso para consultar tu revisión y calificación.</p>
          </div>
        </div>
        <StudentActivityList
          types={["practice"]}
          hideFinished
          emptyMessage="No tienes ejercicios pendientes en este momento."
        />
      </section>
    </AppShell>
  );
}
