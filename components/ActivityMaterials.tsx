"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Material = {
  id: string;
  storage_path: string;
  file_name: string;
  file_size: number;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ActivityMaterials({ activityId }: { activityId: string }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .from("activity_materials")
      .select("id, storage_path, file_name, file_size")
      .eq("activity_id", activityId)
      .order("created_at", { ascending: true })
      .then(({ data, error: loadError }) => {
        if (cancelled) return;
        if (loadError) {
          setError(loadError.message);
          setMaterials([]);
        } else {
          setMaterials((data ?? []) as Material[]);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [activityId]);

  async function openMaterial(material: Material) {
    setError(null);
    const { data, error: signedError } = await supabase.storage
      .from("activity-materials")
      .createSignedUrl(material.storage_path, 300);
    if (signedError || !data?.signedUrl) {
      setError(signedError?.message || "No se pudo abrir el archivo.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (loading) return null;
  if (materials.length === 0 && !error) return null;

  return (
    <section className="panel" style={{ marginTop: 16 }}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">📎 Material de la tarea</p>
          <h3>Archivos adjuntos</h3>
          <p className="muted-copy">Abre o descarga los documentos que dejó el profesor para esta actividad.</p>
        </div>
      </div>

      {materials.length > 0 && (
        <div style={{ display: "grid", gap: 10 }}>
          {materials.map((material) => (
            <article className="action-card" key={material.id} style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <div style={{ display: "grid", gap: 3 }}>
                <strong>📄 {material.file_name}</strong>
                <small>{formatBytes(Number(material.file_size))}</small>
              </div>
              <button className="secondary-button" type="button" onClick={() => void openMaterial(material)}>Abrir archivo</button>
            </article>
          ))}
        </div>
      )}

      {error && <div className="auth-message auth-error">{error}</div>}
    </section>
  );
}
