"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getAppBaseUrl, goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "register";

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const isRegister = mode === "register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) goTo("/dashboard/");
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (isRegister && password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        if (!displayName.trim() || !username.trim()) {
          setError("Completa tu nombre y nombre de usuario.");
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${getAppBaseUrl()}/auth/callback/`,
            data: {
              display_name: displayName.trim(),
              username: username.trim().toLowerCase(),
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          goTo("/dashboard/");
          return;
        }

        setMessage("Cuenta creada. Revisa tu correo y confirma tu cuenta para poder iniciar sesión.");
        setPassword("");
        setConfirmPassword("");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;
        goTo("/dashboard/");
      }
    } catch (caughtError) {
      const authError = caughtError as { message?: string };
      const rawMessage = authError.message ?? "No fue posible completar la operación.";

      if (rawMessage.toLowerCase().includes("invalid login credentials")) {
        setError("Correo o contraseña incorrectos.");
      } else if (rawMessage.toLowerCase().includes("already registered")) {
        setError("Ya existe una cuenta con ese correo.");
      } else {
        setError(rawMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {isRegister && (
        <>
          <div className="form-group">
            <label htmlFor="display-name">Nombre para mostrar</label>
            <input
              id="display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Tu nombre"
              autoComplete="name"
              maxLength={60}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Nombre de usuario</label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value.replace(/\s/g, ""))}
              placeholder="chigui"
              autoComplete="username"
              minLength={3}
              maxLength={30}
              required
            />
          </div>
        </>
      )}

      <div className="form-group">
        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@correo.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo 8 caracteres"
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={8}
          required
        />
      </div>

      {isRegister && (
        <div className="form-group">
          <label htmlFor="confirm-password">Confirmar contraseña</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
      )}

      {error && <div className="auth-message auth-error">{error}</div>}
      {message && <div className="auth-message auth-success">{message}</div>}

      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? "Procesando..." : isRegister ? "Crear cuenta" : "Iniciar sesión"}
      </button>

      <div className="login-footnote">
        {isRegister ? (
          <>
            ¿Ya tienes cuenta? <Link href="/"><strong>Inicia sesión</strong></Link>
          </>
        ) : (
          <>
            ¿Todavía no tienes cuenta? <Link href="/register"><strong>Regístrate</strong></Link>
          </>
        )}
      </div>
    </form>
  );
}
