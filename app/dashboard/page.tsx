import AppShell from "@/components/AppShell";
import DashboardTaskBoard from "@/components/DashboardTaskBoard";
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
          <p>Revisa qué tienes pendiente, qué viene después y cómo avanza tu rendimiento.</p>
        </div>
        <span className="stage-badge">🌱 Fundamentos · Año 1</span>
      </div>

      <DashboardStats />

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Organización académica</p>
            <h2>📝 Tus tareas</h2>
            <p className="muted-copy">Pendientes, próximas, entregadas, calificadas y vencidas se separan aquí para que sepas qué atender primero.</p>
          </div>
        </div>
        <DashboardTaskBoard />
      </section>

      <section className="dashboard-grid" style={{ marginTop: 18 }}>
        <article className="panel">
          <h2>🏅 Próximo logro</h2>
          <div className="empty-state">
            Completa tu primera actividad para comenzar a desbloquear insignias.
          </div>
        </article>

        <article className="panel">
          <h2>💡 Prioridad</h2>
          <p className="muted-copy">Empieza por las tareas de la pestaña Pendientes con la fecha límite más cercana. Las que ya entregaste dejan de contarse como pendientes.</p>
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
