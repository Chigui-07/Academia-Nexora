import AuthForm from "@/components/AuthForm";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
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
          <h1>Aprende. Avanza. Supera.</h1>
          <p>
            Cursos, tareas, ejercicios, calificaciones, logros y una experiencia que crece contigo año tras año.
          </p>
        </div>

        <small>Academia Nexora · Fundamentos Año 1</small>
      </section>

      <section className="login-form-wrap">
        <div className="login-card">
          <p className="eyebrow">Bienvenido</p>
          <h2>Inicia sesión</h2>
          <p>Accede a tus cursos y continúa tu progreso en Academia Nexora.</p>
          <AuthForm mode="login" />
        </div>
      </section>
    </main>
  );
}
