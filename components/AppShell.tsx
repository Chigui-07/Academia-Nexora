import Link from "next/link";

const navItems = [
  ["🏠", "Inicio", "/dashboard"],
  ["📚", "Cursos", "/courses"],
  ["📝", "Tareas", "/tasks"],
  ["📊", "Calificaciones", "/grades"],
  ["🏅", "Perfil", "/profile"],
  ["⚙️", "Administración", "/admin"],
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="logo-mark" href="/dashboard">
          <span className="logo-icon">N</span>
          <span>Academia Nexora</span>
        </Link>

        <nav className="nav-list" aria-label="Navegación principal">
          {navItems.map(([icon, label, href]) => (
            <Link className="nav-link" href={href} key={href}>
              <span>{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-note">
          🌱 <strong>Fundamentos · Año 1</strong>
          <br />
          Nota mínima actual: 60/100
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <strong>Academia Nexora</strong>
          <div className="user-chip">
            <span>Cuenta de demostración</span>
            <span className="avatar">C</span>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
