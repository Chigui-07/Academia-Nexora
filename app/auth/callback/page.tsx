"use client";

import { useEffect, useState } from "react";
import { goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Confirmando tu cuenta...");

  useEffect(() => {
    let mounted = true;

    async function finishAuthentication() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const errorDescription = params.get("error_description");

        if (errorDescription) {
          throw new Error(errorDescription);
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        let { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!data.session) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          const retry = await supabase.auth.getSession();
          data = retry.data;
          if (!data.session) {
            throw new Error("No se pudo iniciar la sesión después de confirmar el correo.");
          }
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed_at")
          .eq("id", data.session.user.id)
          .single();

        if (mounted) {
          if (profile?.onboarding_completed_at) {
            setStatus("Cuenta confirmada. Entrando a Academia Nexora...");
            goTo("/dashboard/");
          } else {
            setStatus("Cuenta confirmada. Preparando tu bienvenida...");
            goTo("/welcome/");
          }
        }
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "No se pudo confirmar la cuenta.";
        if (mounted) setStatus(message);
      }
    }

    finishAuthentication();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="auth-callback-page">
      <div className="auth-callback-card">
        <div className="logo-icon">N</div>
        <h1>Academia Nexora</h1>
        <p>{status}</p>
      </div>
    </main>
  );
}
