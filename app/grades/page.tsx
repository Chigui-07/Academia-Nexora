import AppShell from "@/components/AppShell";
import StudentGrades from "@/components/StudentGrades";

export default function GradesPage() {
  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Calificaciones</p>
          <h1>Progreso académico</h1>
          <p>Consulta tus puntos por bloque, promedio actual y actividades revisadas por el profesor.</p>
        </div>
      </div>

      <StudentGrades />
    </AppShell>
  );
}
