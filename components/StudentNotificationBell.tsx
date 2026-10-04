"use client";

import { useEffect, useState } from "react";
import { goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./StudentNotificationBell.module.css";

const VAPID_PUBLIC_KEY = "BKhEgUXM32Q3sprlz1Uv0NI65y0Q5RMmJNxfa_KhdaLWiK9dB0kH5tynNh-d5EHl0KBb80v0Rg4IfiKTEOLuSo8";

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

type PushState = "checking" | "unsupported" | "denied" | "disabled" | "enabled" | "working";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getBasePath() {
  return window.location.pathname.startsWith("/Academia-Nexora") ? "/Academia-Nexora" : "";
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

export default function StudentNotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pushState, setPushState] = useState<PushState>("checking");

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

  async function checkPushState() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setPushState("unsupported");
      return;
    }

    if (Notification.permission === "denied") {
      setPushState("denied");
      return;
    }

    const basePath = getBasePath();
    const registration = await navigator.serviceWorker.getRegistration(`${basePath}/`);
    const subscription = await registration?.pushManager.getSubscription();
    setPushState(subscription ? "enabled" : "disabled");
  }

  useEffect(() => {
    void loadNotifications(true);
    void checkPushState();

    const refresh = () => {
      if (document.visibilityState === "visible") {
        void loadNotifications(false);
        void checkPushState();
      }
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
    if (next) {
      await Promise.all([loadNotifications(false), checkPushState()]);
    }
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

  async function enablePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setPushState("unsupported");
      return;
    }

    setPushState("working");
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushState(permission === "denied" ? "denied" : "disabled");
        return;
      }

      const basePath = getBasePath();
      const registration = await navigator.serviceWorker.register(`${basePath}/sw.js`, {
        scope: `${basePath}/`,
      });

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) throw new Error("Tu sesión terminó. Vuelve a iniciar sesión.");

      const serialized = subscription.toJSON();
      const p256dh = serialized.keys?.p256dh;
      const authKey = serialized.keys?.auth;
      if (!p256dh || !authKey) throw new Error("El navegador no entregó las claves de la suscripción push.");

      const { error: saveError } = await supabase
        .from("student_push_subscriptions")
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh,
          auth_key: authKey,
          user_agent: navigator.userAgent,
          active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "endpoint" });

      if (saveError) throw saveError;
      setPushState("enabled");
    } catch (pushError) {
      setError(pushError instanceof Error ? pushError.message : "No se pudieron activar los avisos del dispositivo.");
      await checkPushState();
    }
  }

  async function disablePush() {
    setPushState("working");
    setError(null);

    try {
      const basePath = getBasePath();
      const registration = await navigator.serviceWorker.getRegistration(`${basePath}/`);
      const subscription = await registration?.pushManager.getSubscription();
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (subscription && user) {
        const { error: deleteError } = await supabase
          .from("student_push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint);
        if (deleteError) throw deleteError;
      }

      if (subscription) await subscription.unsubscribe();
      setPushState("disabled");
    } catch (pushError) {
      setError(pushError instanceof Error ? pushError.message : "No se pudieron desactivar los avisos del dispositivo.");
      await checkPushState();
    }
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

          <div className={styles.pushSettings}>
            <div className={styles.pushCopy}>
              <strong>📲 Avisos del dispositivo</strong>
              <span>Recibe tareas nuevas y un recordatorio si una entrega está por vencer.</span>
            </div>
            {pushState === "enabled" && (
              <button type="button" className={styles.pushAction} onClick={() => void disablePush()}>
                Desactivar
              </button>
            )}
            {pushState === "disabled" && (
              <button type="button" className={styles.pushAction} onClick={() => void enablePush()}>
                Activar
              </button>
            )}
            {(pushState === "checking" || pushState === "working") && (
              <span className={styles.pushStatus}>{pushState === "working" ? "Guardando..." : "Comprobando..."}</span>
            )}
            {pushState === "denied" && (
              <span className={styles.pushStatus}>Bloqueadas por el navegador</span>
            )}
            {pushState === "unsupported" && (
              <span className={styles.pushStatus}>No compatible en este navegador</span>
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

          <div className={styles.footer}>Los ejercicios prácticos no generan avisos externos para evitar saturarte.</div>
        </div>
      )}
    </div>
  );
}
