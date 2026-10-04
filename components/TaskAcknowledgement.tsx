"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AcknowledgementLabel = "enterado" | "revisado";

type TaskAcknowledgementProps = {
  activityId: string;
  label: AcknowledgementLabel;
};

function titleCase(value: AcknowledgementLabel) {
  return value === "enterado" ? "Enterado" : "Revisado";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function TaskAcknowledgement({ activityId, label }: TaskAcknowledgementProps) {
  const [acknowledgedAt, setAcknowledgedAt] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        if (!cancelled) setReady(true);
        return;
      }

      const { data, error: loadError } = await supabase
        .from("activity_acknowledgements")
        .select("acknowledged_at")
        .eq("activity_id", activityId)
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (cancelled) return;
      if (loadError) setError("No se pudo comprobar la confirmación de esta tarea.");
      else setAcknowledgedAt(data?.acknowledged_at ?? null);
      setReady(true);
    }

    void load();
    return () => { cancelled = true; };
  }, [activityId]);

  async function acknowledge() {
    setSaving(true);
    setError(null);

    const { data, error: saveError } = await supabase.rpc("acknowledge_course_activity", {
      p_activity_id: activityId,
    });

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    setAcknowledgedAt((data as string | null) ?? new Date().toISOString());
    setSaving(false);
  }

  if (!ready) return null;

  const buttonLabel = titleCase(label);

  return (
    <section
      style={{
        marginTop: 18,
        padding: "18px 20px",
        border: "1px solid var(--border)",
        borderRadius: 18,
        background: "var(--surface-soft)",
        display: "flex",
        gap: 14,
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Confirmación de lectura</strong>
        <span className="muted-copy">
          {acknowledgedAt
            ? `Confirmaste esta tarea el ${formatDate(acknowledgedAt)}.`
            : "Cuando termines de revisar la tarea, confirma que ya la viste."}
        </span>
      </div>

      <button
        className={acknowledgedAt ? "secondary-button" : "primary-button"}
        type="button"
        onClick={() => void acknowledge()}
        disabled={saving || Boolean(acknowledgedAt)}
      >
        {acknowledgedAt ? `✅ ${buttonLabel}` : saving ? "Guardando..." : `✅ ${buttonLabel}`}
      </button>

      {error && <div className="auth-message auth-error" style={{ width: "100%" }}>{error}</div>}
    </section>
  );
}
