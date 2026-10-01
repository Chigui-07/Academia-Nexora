import AppShell from "@/components/AppShell";
import CourseRequestForm from "@/components/CourseRequestForm";

export default function RequestCoursePage() {
  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Solicitudes</p>
          <h1>Solicitar un curso</h1>
          <p>Busca una materia del catálogo y envía una solicitud a Administración.</p>
        </div>
      </div>

      <CourseRequestForm />
    </AppShell>
  );
}
