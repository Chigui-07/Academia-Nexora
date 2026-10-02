"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./ActivityAttachments.module.css";

type Attachment = {
  id: string;
  attempt_id: string;
  user_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number;
  created_at: string;
};

type Props = {
  attemptId: string;
  editable: boolean;
  maxFiles?: number;
  title?: string;
  description?: string;
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

function isImage(mime: string | null) {
  return Boolean(mime?.startsWith("image/"));
}

export default function ActivityAttachments({
  attemptId,
  editable,
  maxFiles = 5,
  title = "Archivos de la entrega",
  description = "Puedes adjuntar fotografías del procedimiento, documentos u otros archivos solicitados por el profesor.",
}: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const remaining = Math.max(0, maxFiles - attachments.length);
  const canUpload = editable && remaining > 0;

  async function loadAttachments() {
    const { data, error: loadError } = await supabase
      .from("activity_attempt_attachments")
      .select("id, attempt_id, user_id, storage_path, file_name, mime_type, file_size, created_at")
      .eq("attempt_id", attemptId)
      .order("created_at", { ascending: true });

    if (loadError) throw loadError;
    const rows = (data ?? []) as Attachment[];
    setAttachments(rows);

    const imageRows = rows.filter((item) => isImage(item.mime_type));
    if (imageRows.length === 0) {
      setPreviewUrls({});
      return;
    }

    const entries = await Promise.all(imageRows.map(async (item) => {
      const { data: signed } = await supabase.storage
        .from("activity-submissions")
        .createSignedUrl(item.storage_path, 600);
      return [item.id, signed?.signedUrl ?? ""] as const;
    }));

    setPreviewUrls(Object.fromEntries(entries.filter(([, url]) => Boolean(url))));
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    loadAttachments()
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar los archivos.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [attemptId]);

  async function uploadOne(file: File) {
    if (file.size <= 0) throw new Error(`${file.name}: el archivo está vacío.`);
    if (file.size > MAX_FILE_SIZE) throw new Error(`${file.name}: supera el límite de 20 MB.`);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) throw new Error("Tu sesión terminó. Inicia sesión nuevamente.");

    const unique = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `${user.id}/${attemptId}/${unique}-${safeFileName(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from("activity-submissions")
      .upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { error: metadataError } = await supabase.from("activity_attempt_attachments").insert({
      attempt_id: attemptId,
      user_id: user.id,
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

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selected.length === 0) return;

    if (!editable) {
      setError("Este intento ya terminó y sus archivos no pueden modificarse.");
      return;
    }
    if (selected.length > remaining) {
      setError(`Solo puedes agregar ${remaining} archivo${remaining === 1 ? "" : "s"} más en este intento.`);
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      for (const file of selected) await uploadOne(file);
      await loadAttachments();
      setMessage(selected.length === 1 ? "Archivo adjuntado correctamente." : `${selected.length} archivos adjuntados correctamente.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo subir el archivo.");
      await loadAttachments().catch(() => undefined);
    } finally {
      setUploading(false);
    }
  }

  async function removeAttachment(item: Attachment) {
    if (!editable) return;
    setError(null);
    setMessage(null);

    const { error: storageError } = await supabase.storage
      .from("activity-submissions")
      .remove([item.storage_path]);
    if (storageError) {
      setError(storageError.message);
      return;
    }

    const { error: deleteError } = await supabase
      .from("activity_attempt_attachments")
      .delete()
      .eq("id", item.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadAttachments();
    setMessage("Archivo eliminado.");
  }

  async function openAttachment(item: Attachment) {
    setError(null);
    const { data, error: signedError } = await supabase.storage
      .from("activity-submissions")
      .createSignedUrl(item.storage_path, 300);
    if (signedError || !data?.signedUrl) {
      setError(signedError?.message || "No se pudo abrir el archivo.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  const summary = useMemo(() => `${attachments.length}/${maxFiles} archivos`, [attachments.length, maxFiles]);

  return (
    <section className={styles.wrapper}>
      <div className={styles.heading}>
        <div>
          <p className="eyebrow">📎 Evidencia y documentos</p>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <span className={styles.counter}>{summary}</span>
      </div>

      {loading ? (
        <div className="empty-state">Cargando archivos...</div>
      ) : (
        <>
          {attachments.length > 0 && (
            <div className={styles.fileGrid}>
              {attachments.map((item) => (
                <article className={styles.fileCard} key={item.id}>
                  {previewUrls[item.id] ? (
                    <img className={styles.preview} src={previewUrls[item.id]} alt={item.file_name} />
                  ) : (
                    <div className={styles.fileIcon}>📄</div>
                  )}
                  <div className={styles.fileInfo}>
                    <strong title={item.file_name}>{item.file_name}</strong>
                    <small>{formatBytes(Number(item.file_size))}</small>
                  </div>
                  <div className={styles.actions}>
                    <button className="secondary-button" type="button" onClick={() => void openAttachment(item)}>Abrir</button>
                    {editable && (
                      <button className={styles.removeButton} type="button" onClick={() => void removeAttachment(item)}>Eliminar</button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {canUpload && (
            <label className={styles.dropZone}>
              <input type="file" multiple onChange={handleFiles} disabled={uploading} />
              <span>{uploading ? "Subiendo archivos..." : "＋ Adjuntar imágenes o archivos"}</span>
              <small>Máximo 20 MB por archivo · puedes agregar {remaining} más.</small>
            </label>
          )}

          {!editable && attachments.length === 0 && (
            <div className="empty-state">Este intento no incluye archivos adjuntos.</div>
          )}

          {error && <div className="auth-message auth-error">{error}</div>}
          {message && <div className="auth-message auth-success">{message}</div>}
        </>
      )}
    </section>
  );
}
