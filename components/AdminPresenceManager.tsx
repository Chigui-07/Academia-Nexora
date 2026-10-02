"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./AdminPresenceManager.module.css";

type PresenceStatus = "online" | "idle" | "offline";

type PresenceRow = {
  user_id: string;
  display_name: string;
  username: string | null;
  student_code: string | null;
  last_seen_at: string | null;
  last_active_at: string | null;
  presence_status: PresenceStatus;
};

const labels: Record<PresenceStatus, string> = {
  online: "🟢 En línea",
  idle: "🟡 Inactivo",
  offline: "⚫ Desconectado",
};

function formatLastSeen(value: string | null) {
  if (!value) return "Nunca conectado";
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminPresenceManager() {
  const [allowed, setAllowed] = useState(false);
  const [rows, setRows] = useState<PresenceRow[]>([]);
  const [ready, setReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(showSpinner = false) {
    if (showSpinner) setRefreshing(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (roleError) throw roleError;

      const isAdmin = (roleData ?? []).some((item) => item.role === "admin");
      setAllowed(isAdmin);
      if (!isAdmin) return;

      const { data, error: presenceError } = await supabase.rpc("get_admin_presence");
      if (presenceError) throw presenceError;
      setRows((data ?? []) as PresenceRow[]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo cargar la presencia de usuarios.");
    } finally {
      setReady(true);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function firstLoad() {
      await load(false);
      if (cancelled) return;
    }

    void firstLoad();
    const interval = window.setInterval(() => {
      if (!cancelled) void load(false);
    }, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const counts = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc[row.presence_status] += 1;
        return acc;
      },
      { online: 0, idle: 0, offline: 0 } as Record<PresenceStatus, number>,
    );
  }, [rows]);

  if (!ready) return <section className="panel"><div className="empty-state">Cargando usuarios conectados...</div></section>;
  if (!allowed) return null;

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Presencia</p>
          <h2>🟢 Usuarios conectados</h2>
          <p className="muted-copy">Solo Administración puede ver este estado. La lista se actualiza automáticamente y no muestra la presencia entre alumnos.</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => void load(true)} disabled={refreshing}>
          {refreshing ? "Actualizando..." : "↻ Actualizar"}
        </button>
      </div>

      <div className={styles.summary}>
        <span><strong>{counts.online}</strong> 🟢 En línea</span>
        <span><strong>{counts.idle}</strong> 🟡 Inactivos</span>
        <span><strong>{counts.offline}</strong> ⚫ Desconectados</span>
      </div>

      {error && <div className="auth-message auth-error">{error}</div>}

      <div className={styles.list}>
        {rows.map((row) => (
          <article className={styles.userRow} key={row.user_id}>
            <div className={styles.identity}>
              <span className={`${styles.dot} ${styles[row.presence_status]}`} aria-hidden="true" />
              <div>
                <strong>{row.display_name}</strong>
                <small>
                  {row.username ? `@${row.username}` : "Sin usuario"}
                  {row.student_code ? ` · ${row.student_code}` : ""}
                </small>
              </div>
            </div>

            <div className={styles.statusBox}>
              <strong>{labels[row.presence_status]}</strong>
              <small>{row.presence_status === "offline" ? `Última conexión: ${formatLastSeen(row.last_seen_at)}` : `Último registro: ${formatLastSeen(row.last_seen_at)}`}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
