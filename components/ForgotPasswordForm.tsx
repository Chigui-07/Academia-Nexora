"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getAppBaseUrl } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const cleanEmail = email.trim();
      if (!cleanEmail) throw new Error("Escribe el correo de tu cuenta.");

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${getAppBaseUrl()}/reset-password/`,
      });

      if (resetError) throw resetError;

      setMessage(
        "Si existe una cuenta con ese correo, recibirás un enlace para crear una nueva contraseña. Revisa también Spam o Correo no deseado.",
      );
    } catch (caughtError) {
      const rawMessage = caughtError instanceof Error ? caughtError.message : "No se pudo enviar el correo de recuperación.";
      const normalized = rawMessage.toLowerCase();

      if (normalized.includes("rate limit") || normalized.includes("email rate limit")) {
        setError("Se enviaron demasiados correos recientemente. Espera un momento antes de volver a intentarlo.");
      } else {
        setError(rawMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="recovery-email">Correo electrónico</label>
        <input
          id="recovery-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@correo.com"
          autoComplete="email"
          required
        />
        <small className="muted-copy">Usa el mismo correo con el que creaste tu cuenta de Academia Nexora.</small>
      </div>

      <div className="security-note">
        🔑 Te enviaremos un enlace de un solo uso. Desde ese enlace podrás elegir una contraseña nueva; nunca mostraremos tu contraseña anterior.
      </div>

      {error && <div className="auth-message auth-error">{error}</div>}
      {message && <div className="auth-message auth-success">{message}</div>}

      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar enlace de recuperación"}
      </button>

      <div className="login-footnote">
        ¿Recordaste tu contraseña? <Link href="/"><strong>Volver al inicio de sesión</strong></Link>
      </div>
    </form>
  );
}
