import AppShell from "@/components/AppShell";

export default function TasksPage() {
  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Tareas</p>
          <h1>Esta semana</h1>
          <p>Solo se mostrarán las tareas disponibles y pendientes de todas tus materias.</p>
        </div>
      </div>

      <article className="panel">
        <h2>🗓️ Actividades disponibles</h2>
        <div className="empty-state">
          No tienes tareas activas. Las tareas aparecerán aquí al llegar su fecha y hora de apertura.
        </div>
      </article>
    </AppShell>
  );
}
