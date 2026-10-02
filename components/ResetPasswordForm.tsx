"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
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
  const recoverySession = useRef<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    function acceptSession(session: Session) {
      recoverySession.current = session;
      if (!mounted) return;
      setValidRecovery(true);
      setReady(true);
      setError(null);
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        acceptSession(session);
      }
    });

    async function prepareRecovery() {
      try {
        const search = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const errorDescription = search.get("error_description") || hash.get("error_description");
        if (errorDescription) throw new Error(errorDescription);

        const recoveryMarker =
          search.get("recovery") === "1" ||
          search.get("type") === "recovery" ||
          hash.get("type") === "recovery";

        if (!recoveryMarker) {
          throw new Error("Este enlace de recuperación no es válido o ya no contiene la información necesaria.");
        }

        // detectSessionInUrl está habilitado en el cliente de Supabase. No volvemos a
        // procesar aquí los tokens del enlace porque hacerlo dos veces puede crear una
        // carrera y dejar el formulario sin la sesión temporal de recuperación.
        let session: Session | null = null;

        for (let attempt = 0; attempt < 3 && !session; attempt += 1) {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          session = data.session;

          if (!session && attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }

        if (!session) {
          throw new Error("El enlace de recuperación venció, ya fue utilizado o la sesión no pudo iniciarse. Solicita uno nuevo.");
        }

        acceptSession(session);
        window.history.replaceState({}, document.title, `${getAppBaseUrl()}/reset-password/?recovery=1`);
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
      let session = recoverySession.current;

      if (!session) {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        session = data.session;
      }

      if (!session) {
        setValidRecovery(false);
        throw new Error("La sesión de recuperación ya no está disponible. Solicita un enlace nuevo.");
      }

      // Reinstala explícitamente la sesión que validó el enlace antes de actualizar la
      // contraseña. Esto evita perderla si el navegador terminó de procesar el enlace
      // entre la carga de la página y el envío del formulario.
      const { data: restored, error: restoreError } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      if (restoreError) throw restoreError;
      if (!restored.session) throw new Error("La sesión de recuperación ya no es válida. Solicita un enlace nuevo.");

      recoverySession.current = restored.session;

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
      recoverySession.current = null;
      await supabase.auth.signOut();
    } catch (caughtError) {
      const rawMessage = caughtError instanceof Error ? caughtError.message : "No se pudo cambiar la contraseña.";
      const normalized = rawMessage.toLowerCase();

      if (normalized.includes("same password")) {
        setError("Elige una contraseña diferente a la que usabas anteriormente.");
      } else if (
        normalized.includes("auth session missing") ||
        normalized.includes("session") ||
        normalized.includes("expired") ||
        normalized.includes("invalid")
      ) {
        setValidRecovery(false);
        setError("La sesión de recuperación venció o dejó de ser válida. Solicita un enlace nuevo.");
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
