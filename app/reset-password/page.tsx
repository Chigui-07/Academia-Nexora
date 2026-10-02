import ResetPasswordForm from "@/components/ResetPasswordForm";
import ThemeToggle from "@/components/ThemeToggle";

export default function ResetPasswordPage() {
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
          <p className="eyebrow" style={{ color: "rgba(255,255,255,.72)" }}>Nueva contraseña</p>
          <h1>Protege tu cuenta.</h1>
          <p>Elige una contraseña nueva para recuperar el acceso a Academia Nexora.</p>
        </div>

        <small>Academia Nexora · Recuperación de cuenta</small>
      </section>

      <section className="login-form-wrap">
        <div className="login-card">
          <p className="eyebrow">Enlace de recuperación</p>
          <h2>Crea una nueva contraseña</h2>
          <p>Cuando el enlace sea válido, podrás reemplazar tu contraseña anterior.</p>
          <ResetPasswordForm />
        </div>
      </section>
    </main>
  );
}
