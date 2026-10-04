"use client";

import { useEffect, useState } from "react";
import { goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./StudentNotificationBell.module.css";

type NotificationCourse = {
  course_key: string;
  name: string;
  icon: string;
};

type StudentNotification = {
  id: string;
  activity_type: "notebook_task" | "virtual_task" | "exercise_sheet";
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
  courses: NotificationCourse | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function StudentNotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadNotifications(showLoading = false) {
    if (showLoading) setLoading(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setLoading(false);
      return;
    }

    const [listResponse, countResponse] = await Promise.all([
      supabase
        .from("student_notifications")
        .select("id, activity_type, title, body, read_at, created_at, courses(course_key, name, icon)")
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("student_notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null),
    ]);

    if (listResponse.error || countResponse.error) {
      setError(listResponse.error?.message || countResponse.error?.message || "No se pudieron cargar las notificaciones.");
      setLoading(false);
      return;
    }

    setNotifications((listResponse.data ?? []) as unknown as StudentNotification[]);
    setUnread(countResponse.count ?? 0);
    setLoading(false);
  }

  useEffect(() => {
    void loadNotifications(true);

    const refresh = () => {
      if (document.visibilityState === "visible") void loadNotifications(false);
    };
    const intervalId = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  async function togglePanel() {
    const next = !open;
    setOpen(next);
    if (next) await loadNotifications(false);
  }

  async function markAllRead() {
    if (unread === 0) return;
    const readAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("student_notifications")
      .update({ read_at: readAt })
      .is("read_at", null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setUnread(0);
    setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? readAt })));
  }

  async function openNotification(notification: StudentNotification) {
    if (!notification.read_at) {
      const readAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("student_notifications")
        .update({ read_at: readAt })
        .eq("id", notification.id);

      if (!updateError) {
        setUnread((current) => Math.max(0, current - 1));
        setNotifications((current) => current.map((item) => (
          item.id === notification.id ? { ...item, read_at: readAt } : item
        )));
      }
    }

    const courseKey = notification.courses?.course_key;
    if (!courseKey) {
      goTo("/tasks/");
      return;
    }

    const tab = notification.activity_type === "exercise_sheet" ? "hoja-ejercicios" : "tareas";
    goTo(`/course/?course=${encodeURIComponent(courseKey)}&tab=${tab}`);
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.bell}
        onClick={() => void togglePanel()}
        aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span aria-hidden="true">🔔</span>
        {unread > 0 && <span className={styles.badge}>{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Notificaciones">
          <div className={styles.header}>
            <div>
              <strong>Notificaciones</strong>
              <span>{unread > 0 ? `${unread} sin leer` : "Todo al día"}</span>
            </div>
            {unread > 0 && (
              <button type="button" className={styles.readAll} onClick={() => void markAllRead()}>
                Marcar leídas
              </button>
            )}
          </div>

          <div className={styles.list}>
            {loading ? (
              <div className={styles.empty}>Cargando avisos...</div>
            ) : error ? (
              <div className={styles.error}>{error}</div>
            ) : notifications.length === 0 ? (
              <div className={styles.empty}>No tienes notificaciones nuevas.</div>
            ) : (
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={`${styles.item} ${notification.read_at ? styles.read : styles.unread}`}
                  onClick={() => void openNotification(notification)}
                >
                  <span className={styles.itemIcon}>{notification.courses?.icon || "📚"}</span>
                  <span className={styles.itemCopy}>
                    <strong>{notification.title}</strong>
                    <span>{notification.body}</span>
                    <small>{formatDate(notification.created_at)}</small>
                  </span>
                  {!notification.read_at && <span className={styles.dot} aria-label="Sin leer" />}
                </button>
              ))
            )}
          </div>

          <div className={styles.footer}>Solo avisamos tareas nuevas para no llenar tu bandeja.</div>
        </div>
      )}
    </div>
  );
}
