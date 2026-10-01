import AuthForm from "@/components/AuthForm";
import ThemeToggle from "@/components/ThemeToggle";

export default function RegisterPage() {
  return (
    <main className="login-page">
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>

      <section className="login-brand">
        <div className="logo-mark">
          <span className="logo-icon">N</span>
          <span>Academia Nexora</span>
        </div>

        <div className="login-brand-copy">
          <p className="eyebrow" style={{ color: "rgba(255,255,255,.72)" }}>Tu espacio de aprendizaje</p>
          <h1>Empieza tu recorrido.</h1>
          <p>
            Crea tu cuenta para guardar cursos, tareas, calificaciones, progreso e insignias.
          </p>
        </div>

        <small>Fundamentos · Año 1</small>
      </section>

      <section className="login-form-wrap">
        <div className="login-card">
          <p className="eyebrow">Nueva cuenta</p>
          <h2>Regístrate</h2>
          <p>Usa tu nombre y apellido reales. Tu perfil académico será más claro y profesional.</p>
          <AuthForm mode="register" />
        </div>
      </section>
    </main>
  );
}
