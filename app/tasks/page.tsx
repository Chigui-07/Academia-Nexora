import AppShell from "@/components/AppShell";
import StudentActivityList from "@/components/StudentActivityList";

export default function TasksPage() {
  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Tareas</p>
          <h1>Actividades disponibles</h1>
          <p>Aquí aparecen las tareas publicadas que ya están dentro de su fecha y hora de disponibilidad.</p>
        </div>
      </div>

      <StudentActivityList
        types={["notebook_task", "virtual_task"]}
        emptyMessage="No tienes tareas activas. Las tareas aparecerán aquí al llegar su fecha y hora de apertura."
      />
    </AppShell>
  );
}
