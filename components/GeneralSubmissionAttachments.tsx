"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Attachment = {
  id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number;
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function safeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120) || "archivo";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GeneralSubmissionAttachments({
  attemptId,
  editable,
  maxFiles = 5,
}: {
  attemptId: string;
  editable: boolean;
  maxFiles?: number;
}) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const remaining = Math.max(0, maxFiles - attachments.length);

  async function loadAttachments() {
    const { data, error: loadError } = await supabase
      .from("activity_attempt_attachments")
      .select("id, storage_path, file_name, mime_type, file_size")
      .eq("attempt_id", attemptId)
      .is("question_id", null)
      .order("created_at", { ascending: true });
    if (loadError) throw loadError;

    const rows = (data ?? []) as Attachment[];
    setAttachments(rows);

    const images = rows.filter((item) => item.mime_type?.startsWith("image/"));
    const entries = await Promise.all(images.map(async (item) => {
      const { data: signed } = await supabase.storage.from("activity-submissions").createSignedUrl(item.storage_path, 600);
      return [item.id, signed?.signedUrl ?? ""] as const;
    }));
    setPreviewUrls(Object.fromEntries(entries.filter(([, url]) => Boolean(url))));
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadAttachments()
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar las fotos de la tarea.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [attemptId]);

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    if (!editable) { setError("Este intento ya fue entregado y no puede modificarse."); return; }
    if (files.length > remaining) { setError(`Solo puedes agregar ${remaining} archivo${remaining === 1 ? "" : "s"} más.`); return; }

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) throw new Error("Tu sesión terminó. Inicia sesión nuevamente.");

      for (const file of files) {
        if (file.size <= 0) throw new Error(`${file.name}: el archivo está vacío.`);
        if (file.size > MAX_FILE_SIZE) throw new Error(`${file.name}: supera el límite de 20 MB.`);

        const unique = typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const path = `${user.id}/${attemptId}/general/${unique}-${safeFileName(file.name)}`;

        const { error: uploadError } = await supabase.storage
          .from("activity-submissions")
          .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
        if (uploadError) throw uploadError;

        const { error: metadataError } = await supabase.from("activity_attempt_attachments").insert({
          attempt_id: attemptId,
          user_id: user.id,
          question_id: null,
          storage_path: path,
          file_name: file.name.slice(0, 255),
          mime_type: file.type || null,
          file_size: file.size,
        });
        if (metadataError) {
          await supabase.storage.from("activity-submissions").remove([path]);
          throw metadataError;
        }
      }

      await loadAttachments();
      setMessage(files.length === 1 ? "Foto o archivo agregado." : `${files.length} archivos agregados.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo subir la evidencia.");
    } finally {
      setUploading(false);
    }
  }

  async function openAttachment(item: Attachment) {
    const { data, error: signedError } = await supabase.storage.from("activity-submissions").createSignedUrl(item.storage_path, 300);
    if (signedError || !data?.signedUrl) { setError(signedError?.message || "No se pudo abrir el archivo."); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function removeAttachment(item: Attachment) {
    if (!editable) return;
    const { error: storageError } = await supabase.storage.from("activity-submissions").remove([item.storage_path]);
    if (storageError) { setError(storageError.message); return; }
    const { error: deleteError } = await supabase.from("activity_attempt_attachments").delete().eq("id", item.id);
    if (deleteError) { setError(deleteError.message); return; }
    await loadAttachments();
    setMessage("Archivo eliminado.");
  }

  return (
    <section className="panel" style={{ marginTop: 18 }}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">📷 Evidencia de la tarea escrita</p>
          <h3>Subir la tarea</h3>
          <p className="muted-copy">Adjunta fotos claras, completas y con buena iluminación de tu trabajo escrito. También puedes subir un PDF si corresponde.</p>
        </div>
        <span className="eyebrow">{attachments.length}/{maxFiles} archivos</span>
      </div>

      {loading ? <div className="empty-state">Cargando archivos...</div> : (
        <div style={{ display: "grid", gap: 12 }}>
          {attachments.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
              {attachments.map((item) => (
                <article className="action-card" key={item.id} style={{ display: "grid", gap: 8 }}>
                  {previewUrls[item.id] && <img src={previewUrls[item.id]} alt={item.file_name} style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 12 }} />}
                  <strong>{item.file_name}</strong>
                  <small>{formatBytes(Number(item.file_size))}</small>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="secondary-button" type="button" onClick={() => void openAttachment(item)}>Abrir</button>
                    {editable && <button className="secondary-button" type="button" onClick={() => void removeAttachment(item)}>Eliminar</button>}
                  </div>
                </article>
              ))}
            </div>
          )}

          {editable && remaining > 0 && (
            <label style={{ display: "grid", gap: 6, cursor: "pointer" }}>
              <span className="secondary-button" style={{ textAlign: "center" }}>{uploading ? "Subiendo..." : "＋ Seleccionar fotos o archivos"}</span>
              <input type="file" hidden multiple accept="image/*,application/pdf" onChange={handleFiles} disabled={uploading} />
              <small>Máximo 20 MB por archivo. Puedes agregar {remaining} más.</small>
            </label>
          )}

          {!editable && attachments.length === 0 && <div className="empty-state">No se adjuntaron fotos o archivos en esta entrega.</div>}
          {error && <div className="auth-message auth-error">{error}</div>}
          {message && <div className="auth-message auth-success">{message}</div>}
        </div>
      )}
    </section>
  );
}
