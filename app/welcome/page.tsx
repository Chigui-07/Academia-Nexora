"use client";

import { useEffect, useState } from "react";
import CourseRequestForm from "@/components/CourseRequestForm";
import ThemeToggle from "@/components/ThemeToggle";
import { goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";

export default function WelcomePage() {
  const [ready, setReady] = useState(false);
  const [displayName, setDisplayName] = useState("Estudiante");

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        goTo("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, onboarding_completed_at")
        .eq("id", session.user.id)
        .single();

      if (profile?.onboarding_completed_at) {
        goTo("/dashboard/");
        return;
      }

      setDisplayName(profile?.display_name || "Estudiante");
      setReady(true);
    }

    load();
  }, []);

  if (!ready) {
    return <div className="app-loading"><div className="logo-icon">N</div><p>Preparando tu bienvenida...</p></div>;
  }

  return (
    <main className="welcome-page">
      <div className="welcome-topbar">
        <div className="logo-mark">
          <span className="logo-icon">N</span>
          <span>Academia Nexora</span>
        </div>
        <ThemeToggle />
      </div>

      <section className="welcome-hero">
        <p className="eyebrow">Tu primer paso</p>
        <h1>¡Bienvenido, {displayName}!</h1>
        <p>
          Antes de entrar al panel, cuéntanos qué te gustaría aprender. Esta información llegará únicamente a Administración y nos ayudará a preparar tus cursos con una dificultad adecuada.
        </p>
      </section>

      <CourseRequestForm onboarding />
    </main>
  );
}
