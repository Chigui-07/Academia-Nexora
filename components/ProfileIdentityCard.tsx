"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type IdentityProfile = {
  display_name: string;
  username: string | null;
  student_code: string;
  stage: string;
  level: number;
};

const stageIcons: Record<string, string> = {
  fundamentos: "🌱",
  intermedio: "📘",
  avanzado: "🧠",
  superior: "🎓",
  dominio: "🏆",
};

export default function ProfileIdentityCard() {
  const [profile, setProfile] = useState<IdentityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadIdentity() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        if (mounted) setLoading(false);
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, username, student_code, stage, level")
        .eq("id", userId)
        .single();

      if (!mounted) return;

      if (profileError) {
        setError("No se pudo cargar tu identificación académica.");
      } else {
        setProfile(data as IdentityProfile);
      }

      setLoading(false);
    }

    loadIdentity();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className="empty-state">Cargando identificación académica...</div>;
  }

  if (error || !profile) {
    return <div className="auth-message auth-error">{error ?? "No se encontró tu perfil."}</div>;
  }

  const stageKey = profile.stage.trim().toLocaleLowerCase();
  const icon = stageIcons[stageKey] ?? "📚";

  return (
    <article className="panel" style={{ marginBottom: 18 }}>
      <p className="eyebrow">Identidad académica</p>
      <h2>🎓 Mi identificación en Nexora</h2>
      <p className="muted-copy">
        Tu nombre real y tu carné se usan en tareas, calificaciones y espacios administrativos. Tu nombre de usuario es personal y decorativo.
      </p>

      <section className="stats-grid" style={{ marginTop: 18 }}>
        <article className="stat-card">
          <div className="stat-label">Nombre académico</div>
          <div className="stat-value" style={{ fontSize: "1.2rem" }}>{profile.display_name}</div>
        </article>

        <article className="stat-card">
          <div className="stat-label">Carné Nexora</div>
          <div className="stat-value" style={{ fontSize: "1.2rem", letterSpacing: ".06em" }}>{profile.student_code}</div>
        </article>

        <article className="stat-card">
          <div className="stat-label">Nombre de usuario</div>
          <div className="stat-value" style={{ fontSize: "1.2rem" }}>@{profile.username ?? "usuario"}</div>
        </article>

        <article className="stat-card">
          <div className="stat-label">Progreso académico</div>
          <div className="stat-value" style={{ fontSize: "1.2rem" }}>
            {icon} {profile.stage} · Nivel {Math.max(1, Number(profile.level) || 1)}
          </div>
        </article>
      </section>

      <div className="security-note" style={{ marginTop: 16, marginBottom: 0 }}>
        🔐 El carné es único y permanente. Sirve para identificar tu expediente académico, pero no funciona como contraseña ni como método de acceso.
      </div>
    </article>
  );
}
