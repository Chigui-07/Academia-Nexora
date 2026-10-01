import AppShell from "@/components/AppShell";

export default function GradesPage() {
  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Calificaciones</p>
          <h1>Progreso académico</h1>
          <p>Resumen por materia y bloque. El promedio se calculará automáticamente.</p>
        </div>
      </div>

      <section className="table-like">
        <div className="grade-row header">
          <span>Materia</span>
          <span>Bloque 1</span>
          <span>Bloque 2</span>
          <span>Bloque 3</span>
          <span>Bloque 4</span>
        </div>
        <div className="grade-row">
          <strong>Sin materias configuradas</strong>
          <span>—</span>
          <span>—</span>
          <span>—</span>
          <span>—</span>
        </div>
      </section>
    </AppShell>
  );
}
