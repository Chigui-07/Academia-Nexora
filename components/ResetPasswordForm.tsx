"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getAppBaseUrl, goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordForm() {
  const [ready, setReady] = useState(false);
  const [validRecovery, setValidRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        setValidRecovery(true);
        setReady(true);
        setError(null);
      }
    });

    async function prepareRecovery() {
      try {
        const search = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const errorDescription = search.get("error_description") || hash.get("error_description");
        if (errorDescription) throw new Error(errorDescription);

        const code = search.get("code");
        const tokenHash = search.get("token_hash");
        const recoveryType = search.get("recovery") === "1" || search.get("type") === "recovery" || hash.get("type") === "recovery";
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");

        if (tokenHash && recoveryType) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (verifyError) throw verifyError;
        } else if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (accessToken && refreshToken && recoveryType) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
        } else if (!recoveryType) {
          throw new Error("Este enlace de recuperación no es válido o ya no contiene la información necesaria.");
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) throw new Error("El enlace de recuperación venció o ya fue utilizado. Solicita uno nuevo.");

        if (!mounted) return;
        setValidRecovery(true);
        setReady(true);
        window.history.replaceState({}, document.title, `${getAppBaseUrl()}/reset-password/`);
      } catch (caughtError) {
        if (!mounted) return;
        const rawMessage = caughtError instanceof Error ? caughtError.message : "No se pudo validar el enlace de recuperación.";
        setError(rawMessage);
        setValidRecovery(false);
        setReady(true);
      }
    }

    void prepareRecovery();

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
      await supabase.auth.signOut();
    } catch (caughtError) {
      const rawMessage = caughtError instanceof Error ? caughtError.message : "No se pudo cambiar la contraseña.";
      const normalized = rawMessage.toLowerCase();

      if (normalized.includes("same password")) {
        setError("Elige una contraseña diferente a la que usabas anteriormente.");
      } else if (normalized.includes("expired") || normalized.includes("invalid")) {
        setError("El enlace de recuperación venció o dejó de ser válido. Solicita uno nuevo.");
      } else {
        setError(rawMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return <div className="empty-state">Validando tu enlace de recuperación...</div>;
  }

  if (success) {
    return (
      <div className="auth-form">
        <div className="auth-message auth-success">✅ Contraseña actualizada correctamente. Ya puedes entrar con tu nueva contraseña.</div>
        <button className="primary-button" type="button" onClick={() => goTo("/")}>Ir a iniciar sesión</button>
      </div>
    );
  }

  if (!validRecovery) {
    return (
      <div className="auth-form">
        {error && <div className="auth-message auth-error">{error}</div>}
        <div className="security-note">Por seguridad, los enlaces de recuperación son temporales y solo deben usarse desde el correo de la cuenta.</div>
        <Link className="primary-button" href="/forgot-password/">Solicitar un enlace nuevo</Link>
        <div className="login-footnote"><Link href="/"><strong>Volver al inicio de sesión</strong></Link></div>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="new-password">Nueva contraseña</label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirm-new-password">Confirmar nueva contraseña</label>
        <input
          id="confirm-new-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repite la nueva contraseña"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <div className="security-note">🔐 Después de cambiarla, esta sesión de recuperación se cerrará y deberás entrar con la contraseña nueva.</div>

      {error && <div className="auth-message auth-error">{error}</div>}

      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? "Actualizando..." : "Guardar nueva contraseña"}
      </button>
    </form>
  );
}
