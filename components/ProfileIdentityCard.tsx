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

type BlockProgress = {
  block: number;
  registered_points: number;
  earned_points: number;
  activities: number;
  graded_activities: number;
  closed: boolean;
  complete: boolean;
};

type CourseProgress = {
  course_id: string;
  name: string;
  icon: string;
  blocks: BlockProgress[];
  complete: boolean;
  grade: number;
  minimum: number;
  passed: boolean;
};

type HistoryItem = {
  stage: string;
  level: number;
  minimum: number;
  completed_at: string;
  course_results: CourseProgress[];
};

type AcademicProgress = {
  stage: string;
  level: number;
  minimum: number;
  levels_per_stage: number;
  status: string;
  courses: CourseProgress[];
  history: HistoryItem[];
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
  const [progress, setProgress] = useState<AcademicProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadIdentity() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) { if (mounted) setLoading(false); return; }

      const [profileResponse, progressResponse] = await Promise.all([
        supabase.from("profiles").select("display_name, username, student_code, stage, level").eq("id", userId).single(),
        supabase.rpc("get_my_academic_progress"),
      ]);

      if (!mounted) return;
      if (profileResponse.error) {
        setError("No se pudo cargar tu identificación académica.");
      } else {
        const loadedProfile = profileResponse.data as IdentityProfile;
        const loadedProgress = progressResponse.error ? null : progressResponse.data as AcademicProgress;
        setProfile(loadedProgress ? { ...loadedProfile, stage: loadedProgress.stage, level: loadedProgress.level } : loadedProfile);
        setProgress(loadedProgress);
      }
      setLoading(false);
    }

    void loadIdentity();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="empty-state">Cargando identificación académica...</div>;
  if (error || !profile) return <div className="auth-message auth-error">{error ?? "No se encontró tu perfil."}</div>;

  const stageKey = profile.stage.trim().toLocaleLowerCase();
  const icon = stageIcons[stageKey] ?? "📚";
  const level = Math.max(1, Number(profile.level) || 1);
  const stageProgress = Math.min(100, Math.max(0, (level / 10) * 100));

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <article className="panel">
        <p className="eyebrow">Identidad académica</p>
        <h2>🎓 Mi identificación en Nexora</h2>
        <p className="muted-copy">Tu expediente se actualiza automáticamente con calificaciones, bloques, nivel y etapa.</p>

        <section className="stats-grid" style={{ marginTop: 18 }}>
          <article className="stat-card"><div className="stat-label">Nombre académico</div><div className="stat-value" style={{ fontSize: "1.2rem" }}>{profile.display_name}</div></article>
          <article className="stat-card"><div className="stat-label">Carné Nexora</div><div className="stat-value" style={{ fontSize: "1.2rem", letterSpacing: ".06em" }}>{profile.student_code}</div></article>
          <article className="stat-card"><div className="stat-label">Nombre de usuario</div><div className="stat-value" style={{ fontSize: "1.2rem" }}>@{profile.username ?? "usuario"}</div></article>
          <article className="stat-card"><div className="stat-label">Progreso académico</div><div className="stat-value" style={{ fontSize: "1.2rem" }}>{icon} {profile.stage} · Nivel {level}</div></article>
        </section>

        <div style={{ marginTop: 18, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <strong>{progress?.status ?? "En progreso"}</strong>
            <span>{level}/10 · mínimo {progress?.minimum ?? 60}/100</span>
          </div>
          <div style={{ height: 12, borderRadius: 999, background: "var(--surface-soft)", overflow: "hidden", border: "1px solid var(--border)" }}>
            <div style={{ width: `${stageProgress}%`, height: "100%", background: "var(--primary)" }} />
          </div>
        </div>
      </article>

      {progress && progress.courses.length > 0 && (
        <section className="panel">
          <div className="section-heading"><div><p className="eyebrow">Nivel actual</p><h2>📚 Estado de materias</h2></div></div>
          <div style={{ display: "grid", gap: 12 }}>
            {progress.courses.map((course) => (
              <article className="action-card" key={course.course_id} style={{ display: "grid", gap: 8 }}>
                <strong>{course.icon} {course.name} · {course.complete ? `${course.grade}/100` : "En progreso"}</strong>
                <span>{course.complete ? (course.passed ? "✅ Aprobada" : `🟠 Debe alcanzar ${course.minimum}`) : "Completa los 4 bloques para obtener la nota final."}</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
                  {course.blocks.map((block) => (
                    <div key={block.block} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 10 }}>
                      <small>Bloque {block.block}</small><br />
                      <strong>{block.earned_points}/{block.registered_points}</strong><br />
                      <small>{block.complete ? "✅ Completo" : block.closed ? "100 pts registrados" : `${block.registered_points}/100 registrados`}</small>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">Expediente</p><h2>📜 Historial académico</h2><p className="muted-copy">Los niveles aprobados quedan guardados permanentemente.</p></div></div>
        {!progress || progress.history.length === 0 ? <div className="empty-state">Aún no has completado ningún nivel.</div> : (
          <div style={{ display: "grid", gap: 10 }}>
            {progress.history.map((item) => (
              <article className="action-card" key={`${item.stage}-${item.level}-${item.completed_at}`}>
                <strong>{stageIcons[item.stage.toLowerCase()] ?? "📚"} {item.stage} · Nivel {item.level} ✅</strong>
                <span>Mínimo requerido: {item.minimum}/100 · {new Intl.DateTimeFormat("es-GT", { dateStyle: "medium" }).format(new Date(item.completed_at))}</span>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="security-note">🔐 El carné es único y permanente. Sirve para identificar tu expediente académico, pero no funciona como contraseña ni como método de acceso.</div>
    </div>
  );
}
