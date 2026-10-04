"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Activity = {
  id: string;
  title: string;
  course_id: string;
  status: string;
  allow_attachments: boolean;
  max_attachments: number | null;
  attachment_instructions: string | null;
  courses?: { name: string; icon: string } | null;
};

type Material = {
  id: string;
  activity_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number;
  created_at: string;
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

export default function TeacherTaskFileManager() {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [allowAttachments, setAllowAttachments] = useState(false);
  const [maxAttachments, setMaxAttachments] = useState("5");
  const [attachmentInstructions, setAttachmentInstructions] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => activities.find((item) => item.id === selectedId) ?? null, [activities, selectedId]);

  async function loadActivities(preferredId?: string) {
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
      .select("id, title, course_id, status, allow_attachments, max_attachments, attachment_instructions, courses(name, icon)")
      .eq("activity_type", "notebook_task")
      .order("created_at", { ascending: false });
    if (activityError) throw activityError;

    const rows = (data ?? []) as unknown as Activity[];
    setActivities(rows);
    setSelectedId((current) => {
      const target = preferredId || current;
      return target && rows.some((row) => row.id === target) ? target : rows[0]?.id || "";
    });
    setReady(true);
  }

  async function loadMaterials(activityId: string) {
    if (!activityId) { setMaterials([]); return; }
    const { data, error: materialError } = await supabase
      .from("activity_materials")
      .select("id, activity_id, storage_path, file_name, mime_type, file_size, created_at")
      .eq("activity_id", activityId)
      .order("created_at", { ascending: true });
    if (materialError) throw materialError;
    setMaterials((data ?? []) as Material[]);
  }

  useEffect(() => {
    loadActivities().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar las tareas escritas.");
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadMaterials(selectedId).catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar los archivos de la tarea.");
    });
  }, [selectedId]);

  useEffect(() => {
    if (!selected) {
      setAllowAttachments(false);
      setMaxAttachments("5");
      setAttachmentInstructions("");
      return;
    }
    setAllowAttachments(Boolean(selected.allow_attachments));
    setMaxAttachments(String(selected.max_attachments ?? 5));
    setAttachmentInstructions(selected.attachment_instructions ?? "");
  }, [selected]);

  async function saveSubmissionSettings() {
    if (!selectedId) return;
    const maxFiles = Number(maxAttachments);
    if (!Number.isInteger(maxFiles) || maxFiles < 1 || maxFiles > 10) {
      setError("La cantidad máxima de archivos debe estar entre 1 y 10.");
      return;
    }

    setSavingSettings(true);
    setError(null);
    setMessage(null);
    try {
      const { error: updateError } = await supabase
        .from("course_activities")
        .update({
          allow_attachments: allowAttachments,
          max_attachments: maxFiles,
          attachment_instructions: attachmentInstructions.trim() || null,
        })
        .eq("id", selectedId);
      if (updateError) throw updateError;

      await loadActivities(selectedId);
      setMessage(allowAttachments
        ? "Entrega por fotos o archivos activada para esta tarea."
        : "Entrega por fotos o archivos desactivada para esta tarea.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo guardar esta opción.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!selectedId || files.length === 0) return;

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
        const path = `${selectedId}/${user.id}/${unique}-${safeFileName(file.name)}`;

        const { error: uploadError } = await supabase.storage
          .from("activity-materials")
          .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
        if (uploadError) throw uploadError;

        const { error: metadataError } = await supabase.from("activity_materials").insert({
          activity_id: selectedId,
          uploaded_by: user.id,
          storage_path: path,
          file_name: file.name.slice(0, 255),
          mime_type: file.type || null,
          file_size: file.size,
        });
        if (metadataError) {
          await supabase.storage.from("activity-materials").remove([path]);
          throw metadataError;
        }
      }

      await loadMaterials(selectedId);
      setMessage(files.length === 1 ? "Archivo agregado a la tarea." : `${files.length} archivos agregados a la tarea.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo subir el archivo.");
    } finally {
      setUploading(false);
    }
  }

  async function openMaterial(material: Material) {
    const { data, error: signedError } = await supabase.storage
      .from("activity-materials")
      .createSignedUrl(material.storage_path, 300);
    if (signedError || !data?.signedUrl) {
      setError(signedError?.message || "No se pudo abrir el archivo.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function removeMaterial(material: Material) {
    setError(null);
    setMessage(null);
    const { error: storageError } = await supabase.storage.from("activity-materials").remove([material.storage_path]);
    if (storageError) { setError(storageError.message); return; }
    const { error: deleteError } = await supabase.from("activity_materials").delete().eq("id", material.id);
    if (deleteError) { setError(deleteError.message); return; }
    await loadMaterials(selectedId);
    setMessage("Archivo eliminado de la tarea.");
  }

  if (!ready) return <section className="panel"><div className="empty-state">Cargando archivos de tareas...</div></section>;
  if (!allowed) return null;

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Opciones de la tarea escrita</p>
          <h2>🧰 Archivos y forma de entrega</h2>
          <p className="muted-copy">Estas opciones se configuran por tarea. Si una tarea no necesita archivos o fotografías, puedes dejarlo desactivado.</p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="empty-state">Primero crea una tarea de cuaderno. Después podrás configurar sus archivos y forma de entrega desde aquí.</div>
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
            <div>
              <strong>📄 Documento o material de la tarea</strong>
              <span>{selected ? `Se mostrará dentro de “${selected.title}”.` : "Selecciona una tarea."}</span>
            </div>

            {materials.length > 0 && (
              <div style={{ display: "grid", gap: 8 }}>
                {materials.map((material) => (
                  <div key={material.id} style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                    <div style={{ display: "grid" }}>
                      <strong>{material.file_name}</strong>
                      <small>{formatBytes(Number(material.file_size))}</small>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="secondary-button" type="button" onClick={() => void openMaterial(material)}>Abrir</button>
                      <button className="secondary-button" type="button" onClick={() => void removeMaterial(material)}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <label style={{ display: "grid", gap: 6, cursor: "pointer" }}>
              <span className="secondary-button" style={{ textAlign: "center" }}>{uploading ? "Subiendo..." : "＋ Agregar archivo"}</span>
              <input type="file" multiple hidden disabled={uploading || !selectedId} onChange={handleFiles} />
              <small>Máximo 20 MB por archivo. Puedes usar PDF, DOCX, imágenes u otros documentos.</small>
            </label>
          </article>

          <article className="action-card" style={{ display: "grid", gap: 12 }}>
            <div>
              <strong>📷 Entrega con fotos o archivos</strong>
              <span>Actívala solo en las tareas donde el alumno deba subir evidencia al final.</span>
            </div>

            <label style={{ display: "grid", gap: 6 }}>
              Permitir entrega por archivos
              <select value={allowAttachments ? "yes" : "no"} onChange={(event) => setAllowAttachments(event.target.value === "yes")}>
                <option value="no">No</option>
                <option value="yes">Sí</option>
              </select>
            </label>

            {allowAttachments && (
              <>
                <label style={{ display: "grid", gap: 6 }}>
                  Máximo de archivos
                  <input type="number" min="1" max="10" value={maxAttachments} onChange={(event) => setMaxAttachments(event.target.value)} />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  Instrucciones para subir la evidencia
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={attachmentInstructions}
                    onChange={(event) => setAttachmentInstructions(event.target.value)}
                    placeholder="Ej. Sube fotos claras y completas de tu trabajo."
                  />
                </label>
              </>
            )}

            <button className="secondary-button" type="button" disabled={savingSettings || !selectedId} onClick={() => void saveSubmissionSettings()}>
              {savingSettings ? "Guardando..." : "Guardar opción de entrega"}
            </button>
          </article>
        </div>
      )}

      {error && <div className="auth-message auth-error">{error}</div>}
      {message && <div className="auth-message auth-success">{message}</div>}
    </section>
  );
}
