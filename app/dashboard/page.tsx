import AcademicStageBadge from "@/components/AcademicStageBadge";
import AppShell from "@/components/AppShell";
import DashboardLessonBoard from "@/components/DashboardLessonBoard";
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
        <AcademicStageBadge />
      </div>

      <DashboardStats />

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Aprendizaje</p>
            <h2>📖 Tus clases</h2>
            <p className="muted-copy">Las clases que todavía no has abierto aparecen como nuevas. Cuando entres a una, pasa automáticamente a Revisadas para que puedas volver a consultarla cuando quieras.</p>
          </div>
        </div>
        <DashboardLessonBoard />
      </section>

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
          <p className="muted-copy">Empieza por las clases nuevas y las tareas de la pestaña Pendientes con la fecha límite más cercana.</p>
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
