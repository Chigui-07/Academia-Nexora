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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function redirectExistingSession() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed_at")
        .eq("id", data.session.user.id)
        .single();

      goTo(profile?.onboarding_completed_at ? "/dashboard/" : "/welcome/");
    }

    redirectExistingSession();
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

    if (isRegister && !rulesAccepted) {
      setError("Debes leer y aceptar las reglas de Academia Nexora para crear tu cuenta.");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanUsername = username.trim().toLowerCase();

        if (!cleanFirstName || !cleanLastName || !cleanUsername) {
          setError("Completa tu nombre, apellido y nombre de usuario.");
          return;
        }

        if (cleanFirstName.length < 2 || cleanLastName.length < 2) {
          setError("Escribe un nombre y un apellido válidos.");
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${getAppBaseUrl()}/auth/callback/`,
            data: {
              first_name: cleanFirstName,
              last_name: cleanLastName,
              display_name: `${cleanFirstName} ${cleanLastName}`,
              username: cleanUsername,
              rules_accepted_at: new Date().toISOString(),
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          goTo("/welcome/");
          return;
        }

        setMessage("Cuenta creada. Revisa tu correo y confirma la cuenta. Guarda y recuerda tu contraseña: la necesitarás para volver a iniciar sesión en Academia Nexora.");
        setPassword("");
        setConfirmPassword("");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;

        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;

        if (userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed_at")
            .eq("id", userId)
            .single();

          goTo(profile?.onboarding_completed_at ? "/dashboard/" : "/welcome/");
          return;
        }

        goTo("/dashboard/");
      }
    } catch (caughtError) {
      const authError = caughtError as { message?: string };
      const rawMessage = authError.message ?? "No fue posible completar la operación.";
      const normalized = rawMessage.toLowerCase();

      if (normalized.includes("invalid login credentials")) {
        setError("Correo o contraseña incorrectos.");
      } else if (normalized.includes("already registered")) {
        setError("Ya existe una cuenta con ese correo.");
      } else if (normalized.includes("first_name_and_last_name_required")) {
        setError("Debes escribir tu nombre y apellido para crear la cuenta.");
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
          <div className="name-fields">
            <div className="form-group">
              <label htmlFor="first-name">Nombre</label>
              <input
                id="first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Tu nombre"
                autoComplete="given-name"
                minLength={2}
                maxLength={60}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="last-name">Apellido</label>
              <input
                id="last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Tu apellido"
                autoComplete="family-name"
                minLength={2}
                maxLength={80}
                required
              />
            </div>
          </div>

          <div className="identity-note">
            👤 Usa tu nombre y apellido reales, no apodos ni sobrenombres. Esto ayuda a mantener un ambiente académico más claro y profesional.
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
            <small className="muted-copy">
              Aquí sí puedes usar un apodo o sobrenombre. Es una parte personal del perfil y no reemplaza tu nombre académico.
            </small>
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
        <>
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

          <div className="security-note">
            🔑 <strong>Guarda y recuerda tu contraseña.</strong> La necesitarás para volver a entrar a Academia Nexora. No la compartas; si usas un gestor de contraseñas, puedes guardarla allí de forma segura.
          </div>

          <section className="academy-rules">
            <div className="academy-rules-title">
              <span>🎓</span>
              <div>
                <strong>Bienvenido a Academia Nexora</strong>
                <small>Antes de comenzar, estas son nuestras reglas.</small>
              </div>
            </div>

            <ol>
              <li><strong>Haz tu propio trabajo.</strong> Las actividades están hechas para ayudarte a aprender, no solamente para conseguir puntos.</li>
              <li><strong>Respeta las reglas sobre IA.</strong> Si una tarea indica que no se permite usar inteligencia artificial, debes resolverla por tu cuenta.</li>
              <li><strong>Muestra tu procedimiento cuando se solicite.</strong> En las tareas de cuaderno, el procedimiento forma parte de la entrega.</li>
              <li><strong>Respeta las fechas de entrega.</strong> Una tarea puede dejar de aceptar respuestas al llegar a su fecha de cierre.</li>
              <li><strong>El PMA es una segunda oportunidad.</strong> Solo estará disponible en algunas tareas y la plataforma conservará tu mejor nota.</li>
              <li><strong>Respeta a los demás usuarios.</strong> Academia Nexora es un espacio para aprender, practicar y ayudarnos.</li>
              <li><strong>Usa tu identidad académica.</strong> Regístrate con tu nombre y apellido reales; evita apodos o sobrenombres en esos campos.</li>
              <li><strong>Personaliza tu usuario.</strong> Tu nombre de usuario puede ser un apodo o sobrenombre y se usa como elemento personal del perfil.</li>
              <li><strong>Protege tu cuenta.</strong> No compartas tu contraseña y cierra sesión cuando termines, especialmente en una computadora compartida.</li>
              <li><strong>Equivocarse también es aprender.</strong> Los ejercicios pueden repetirse y corregirse; las tareas evaluadas siguen sus propias reglas.</li>
            </ol>

            <label className="rules-check">
              <input type="checkbox" checked={rulesAccepted} onChange={(event) => setRulesAccepted(event.target.checked)} />
              <span>He leído y acepto las reglas de Academia Nexora.</span>
            </label>

            <p className="academy-motto">Aprende. Avanza. Supera.</p>
          </section>
        </>
      )}

      {!isRegister && (
        <div className="security-note">🔐 Tu progreso es personal. No compartas tus datos de acceso y recuerda cerrar sesión al terminar.</div>
      )}

      {error && <div className="auth-message auth-error">{error}</div>}
      {message && <div className="auth-message auth-success">{message}</div>}

      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? "Procesando..." : isRegister ? "Crear mi cuenta" : "Iniciar sesión"}
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
