import AdminCourseRequests from "@/components/AdminCourseRequests";
import AppShell from "@/components/AppShell";

const actions = [
  ["📚 Crear materia", "Añade una materia y asígnala a uno o varios usuarios."],
  ["📝 Crear tarea", "Crea tareas de cuaderno con punteo, fechas e instrucciones."],
  ["💻 Crear tarea virtual", "Prepara actividades que se resuelven y califican dentro de la plataforma."],
  ["✏️ Crear ejercicio", "Añade práctica sin punteo ni fecha límite."],
  ["👥 Gestionar usuarios", "Administra estudiantes, cursos y asignaciones."],
  ["🏅 Gestionar logros", "Crea insignias y condiciones para desbloquearlas."],
] as const;

export default function AdminPage() {
  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Panel de control</h1>
          <p>Gestiona solicitudes, estudiantes, cursos y las próximas herramientas académicas.</p>
        </div>
      </div>

      <AdminCourseRequests />

      <section className="admin-actions" style={{ marginTop: 18 }}>
        {actions.map(([title, description]) => (
          <article className="action-card" key={title}>
            <strong>{title}</strong>
            <span>{description}</span>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
