import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import ThemeToggle from "@/components/ThemeToggle";

export default function ForgotPasswordPage() {
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
          <p className="eyebrow" style={{ color: "rgba(255,255,255,.72)" }}>Recupera tu acceso</p>
          <h1>Vuelve a tu aprendizaje.</h1>
          <p>Solicita un enlace seguro para elegir una contraseña nueva sin perder cursos, tareas, intentos ni calificaciones.</p>
        </div>

        <small>Academia Nexora · Recuperación de cuenta</small>
      </section>

      <section className="login-form-wrap">
        <div className="login-card">
          <p className="eyebrow">Seguridad de cuenta</p>
          <h2>¿Olvidaste tu contraseña?</h2>
          <p>Escribe el correo de tu cuenta y te enviaremos las instrucciones.</p>
          <ForgotPasswordForm />
        </div>
      </section>
    </main>
  );
}
