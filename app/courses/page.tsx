import AppShell from "@/components/AppShell";
import EnrolledCourses from "@/components/EnrolledCourses";

export default function CoursesPage() {
  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Cursos</p>
          <h1>Mis cursos</h1>
          <p>Aquí aparecen únicamente las materias que ya fueron aceptadas y asignadas a tu cuenta.</p>
        </div>
      </div>

      <EnrolledCourses />
    </AppShell>
  );
}
