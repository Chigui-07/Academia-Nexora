"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type RequestStatus = "pending" | "in_review" | "handled" | "rejected";

type RequestRow = {
  id: string;
  user_id: string;
  course_name: string;
  grade_level: string;
  self_level: string;
  status: RequestStatus;
  created_at: string;
};

type Profile = {
  id: string;
  display_name: string;
  student_code: string;
};

const levelLabels: Record<string, string> = {
  casi_nada: "Casi nada",
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  no_seguro: "No está seguro",
};

const statusLabels: Record<RequestStatus, string> = {
  pending: "Pendiente",
  in_review: "En revisión",
  handled: "Aceptada",
  rejected: "Rechazada",
};

export default function AdminCourseRequests() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) return;

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    const admin = (roles ?? []).some((item) => item.role === "admin");
    setIsAdmin(admin);
    if (!admin) { setLoading(false); return; }

    const [requestResponse, notificationResponse] = await Promise.all([
      supabase
        .from("course_requests")
        .select("id, user_id, course_name, grade_level, self_level, status, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("admin_notifications")
        .select("id, read_at")
        .eq("notification_type", "course_request")
        .order("created_at", { ascending: false }),
    ]);

    if (requestResponse.error) throw requestResponse.error;
    if (notificationResponse.error) throw notificationResponse.error;

    const loadedRequests = (requestResponse.data ?? []) as RequestRow[];
    setRequests(loadedRequests);
    setUnreadCount((notificationResponse.data ?? []).filter((item) => !item.read_at).length);

    const userIds = Array.from(new Set(loadedRequests.map((request) => request.user_id)));
    if (userIds.length > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, student_code")
        .in("id", userIds);
      if (profileError) throw profileError;
      const map: Record<string, Profile> = {};
      for (const profile of (profileData ?? []) as Profile[]) map[profile.id] = profile;
      setProfiles(map);
    } else {
      setProfiles({});
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudieron cargar las solicitudes.");
      setLoading(false);
    });
  }, []);

  async function resolveRequest(id: string, action: "review" | "accept" | "reject") {
    setError(null);
    setBusyId(id);
    const { error: resolveError } = await supabase.rpc("admin_resolve_course_request", {
      p_request_id: id,
      p_action: action,
    });
    if (resolveError) {
      setError(resolveError.message.includes("course_not_in_catalog")
        ? "Esta solicitud antigua no está vinculada a un curso del catálogo."
        : resolveError.message);
      setBusyId(null);
      return;
    }
    await loadData();
    setBusyId(null);
  }

  async function markNotificationsRead() {
    const { error: updateError } = await supabase
      .from("admin_notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null)
      .eq("notification_type", "course_request");
    if (updateError) { setError(updateError.message); return; }
    setUnreadCount(0);
  }

  if (loading) return <div className="empty-state">Cargando solicitudes...</div>;
  if (!isAdmin) return null;

  return (
    <section className="panel admin-request-panel">
      <div className="section-heading">
        <div><p className="eyebrow">Solo Administración</p><h2>📩 Solicitudes de cursos</h2></div>
        <div className="admin-request-tools">
          <span className="notification-badge">{unreadCount} nuevas</span>
          {unreadCount > 0 && <button className="secondary-button" type="button" onClick={markNotificationsRead}>Marcar avisos como leídos</button>}
        </div>
      </div>

      <p className="muted-copy">Aceptar una solicitud crea la inscripción real del estudiante. Rechazarla no crea ningún curso y permite solicitarlo de nuevo más adelante.</p>
      {error && <div className="auth-message auth-error">{error}</div>}

      {requests.length === 0 ? <div className="empty-state">Todavía no hay solicitudes de cursos.</div> : (
        <div className="admin-request-list">
          {requests.map((request) => {
            const profile = profiles[request.user_id];
            const disabled = busyId === request.id;
            return (
              <article className="admin-request-card" key={request.id}>
                <div className="admin-request-main">
                  <div>
                    <span className="request-user">{profile?.display_name ?? "Estudiante"}{profile?.student_code ? ` · ${profile.student_code}` : ""}</span>
                    <h3>{request.course_name}</h3>
                    <p>{request.grade_level} · Nivel declarado: {levelLabels[request.self_level] ?? request.self_level}</p>
                  </div>
                  <span className={`status-pill ${request.status === "handled" ? "status-open" : "status-soon"}`}>{statusLabels[request.status]}</span>
                </div>

                {request.status !== "handled" && request.status !== "rejected" && (
                  <div className="request-actions">
                    <button className="secondary-button" type="button" onClick={() => resolveRequest(request.id, "review")} disabled={disabled || request.status === "in_review"}>En revisión</button>
                    <button className="primary-button" type="button" onClick={() => resolveRequest(request.id, "accept")} disabled={disabled}>Aceptar curso</button>
                    <button className="secondary-button" type="button" onClick={() => resolveRequest(request.id, "reject")} disabled={disabled}>Rechazar</button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
