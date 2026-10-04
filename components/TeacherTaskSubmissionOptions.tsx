"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Activity = {
  id: string;
  title: string;
  status: string;
  allow_attachments: boolean;
  max_attachments: number;
  attachment_instructions: string;
  courses?: { name: string; icon: string } | null;
};

export default function TeacherTaskSubmissionOptions() {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [maxFiles, setMaxFiles] = useState("5");
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => activities.find((item) => item.id === selectedId) ?? null, [activities, selectedId]);

  async function loadActivities() {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) { setReady(true); return; }

    const { data: roles, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (roleError) throw roleError;
    const canManage = (roles ?? []).some((row) => row.role === "teacher" || row.role === "admin");
    setAllowed(canManage);
    if (!canManage) { setReady(true); return; }

    const { data, error: activityError } = await supabase
      .from("course_activities")
      .select("id, title, status, allow_attachments, max_attachments, attachment_instructions, courses(name, icon)")
      .eq("activity_type", "notebook_task")
      .order("created_at", { ascending: false });
    if (activityError) throw activityError;

    const rows = (data ?? []) as unknown as Activity[];
    setActivities(rows);
    setSelectedId((current) => current && rows.some((item) => item.id === current) ? current : rows[0]?.id ?? "");
    setReady(true);
  }

  useEffect(() => {
    loadActivities().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar las tareas escritas.");
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setEnabled(Boolean(selected.allow_attachments));
    setMaxFiles(String(selected.max_attachments || 5));
    setInstructions(selected.attachment_instructions ?? "");
    setMessage(null);
    setError(null);
  }, [selectedId, selected]);

  async function saveOptions() {
    if (!selectedId) return;
    const max = Number(maxFiles);
    if (!Number.isInteger(max) || max < 1 || max > 10) {
      setError("La cantidad máxima de archivos debe estar entre 1 y 10.");
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from("course_activities")
        .update({
          allow_attachments: enabled,
          max_attachments: max,
          attachment_instructions: instructions.trim(),
        })
        .eq("id", selectedId);
      if (updateError) throw updateError;

      setMessage(enabled
        ? "La tarjeta para subir fotos o archivos quedó activada en esta tarea."
        : "La entrega por fotos o archivos quedó desactivada en esta tarea.");
      await loadActivities();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron guardar las opciones.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <section className="panel"><div className="empty-state">Cargando opciones de entrega...</div></section>;
  if (!allowed) return null;

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Tarea escrita · opción adicional</p>
          <h2>📷 Entrega con fotos o archivos</h2>
          <p className="muted-copy">Actívala solo en las tareas que realmente necesiten evidencia escrita. Las demás tareas no mostrarán esta tarjeta.</p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="empty-state">Primero crea una tarea de cuaderno.</div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 6 }}>
            Tarea escrita
            <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              {activities.map((activity) => (
                <option value={activity.id} key={activity.id}>
                  {activity.courses?.icon ?? "📚"} {activity.courses?.name ?? "Curso"} · {activity.title} · {activity.status === "published" ? "Publicada" : "Borrador"}
                </option>
              ))}
            </select>
          </label>

          <article className="action-card" style={{ display: "grid", gap: 12 }}>
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
              <span><strong>Permitir subir fotos o archivos al final</strong><br /><small>Si está desactivado, esta tarea no tendrá tarjeta de subida.</small></span>
            </label>

            {enabled && (
              <>
                <label style={{ display: "grid", gap: 6 }}>
                  Máximo de archivos
                  <input type="number" min="1" max="10" value={maxFiles} onChange={(event) => setMaxFiles(event.target.value)} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  Indicaciones para la entrega
                  <textarea rows={4} value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Ej. Sube fotos claras, completas y con buena iluminación." />
                </label>
              </>
            )}

            <button className="primary-button" type="button" onClick={() => void saveOptions()} disabled={saving}>
              {saving ? "Guardando..." : "Guardar opción de entrega"}
            </button>
          </article>
        </div>
      )}

      {error && <div className="auth-message auth-error">{error}</div>}
      {message && <div className="auth-message auth-success">{message}</div>}
    </section>
  );
}
