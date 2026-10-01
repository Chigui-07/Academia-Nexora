import AppShell from "@/components/AppShell";

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="page-header">
        <div>
          <p className="eyebrow">Perfil</p>
          <h1>Mi progreso</h1>
          <p>Aquí se mostrarán tu etapa, año, historial e insignias.</p>
        </div>
        <span className="stage-badge">🌱 Fundamentos · Año 1</span>
      </div>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-label">Logros desbloqueados</div>
          <div className="stat-value">0</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Años completados</div>
          <div className="stat-value">0</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Promedio general</div>
          <div className="stat-value">—</div>
        </article>
      </section>

      <article className="panel" style={{ marginTop: 18 }}>
        <h2>🏅 Insignias</h2>
        <div className="empty-state">Tus primeras insignias aparecerán aquí.</div>
      </article>
    </AppShell>
  );
}
