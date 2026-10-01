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
  diagnostic_opt_in: boolean;
  status: RequestStatus;
  created_at: string;
};

type Profile = {
  id: string;
  display_name: string;
  student_code: string;
};

type Attempt = {
  id: string;
  course_request_id: string;
  status: "in_progress" | "limit_reached" | "completed";
  current_level: number;
};

type Result = {
  attempt_id: string;
  placement_level: number;
  placement_title: string;
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
  const [attempts, setAttempts] = useState<Record<string, Attempt>>({});
  const [results, setResults] = useState<Record<string, Result>>({});
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

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    const admin = (roles ?? []).some((item) => item.role === "admin");
    setIsAdmin(admin);

    if (!admin) {
      setLoading(false);
      return;
    }

    const [requestResponse, notificationResponse, attemptResponse, resultResponse] = await Promise.all([
      supabase
        .from("course_requests")
        .select("id, user_id, course_name, grade_level, self_level, diagnostic_opt_in, status, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("admin_notifications")
        .select("id, read_at")
        .eq("notification_type", "course_request")
        .order("created_at", { ascending: false }),
      supabase
        .from("diagnostic_attempts")
        .select("id, course_request_id, status, current_level"),
      supabase
        .from("diagnostic_results")
        .select("attempt_id, placement_level, placement_title"),
    ]);

    if (requestResponse.error) throw requestResponse.error;
    if (notificationResponse.error) throw notificationResponse.error;
    if (attemptResponse.error) throw attemptResponse.error;
    if (resultResponse.error) throw resultResponse.error;

    const loadedRequests = (requestResponse.data ?? []) as RequestRow[];
    setRequests(loadedRequests);
    setUnreadCount((notificationResponse.data ?? []).filter((item) => !item.read_at).length);

    const attemptMap: Record<string, Attempt> = {};
    for (const attempt of (attemptResponse.data ?? []) as Attempt[]) attemptMap[attempt.course_request_id] = attempt;
    setAttempts(attemptMap);

    const resultMap: Record<string, Result> = {};
    for (const result of (resultResponse.data ?? []) as Result[]) resultMap[result.attempt_id] = result;
    setResults(resultMap);

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
      const message = resolveError.message.includes("course_not_in_catalog")
        ? "Esta solicitud antigua no está vinculada a un curso del catálogo."
        : resolveError.message;
      setError(message);
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

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setUnreadCount(0);
  }

  if (loading) return <div className="empty-state">Cargando solicitudes...</div>;
  if (!isAdmin) return null;

  return (
    <section className="panel admin-request-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Solo Administración</p>
          <h2>📩 Solicitudes de cursos</h2>
        </div>
        <div className="admin-request-tools">
          <span className="notification-badge">{unreadCount} nuevas</span>
          {unreadCount > 0 && (
            <button className="secondary-button" type="button" onClick={markNotificationsRead}>Marcar avisos como leídos</button>
          )}
        </div>
      </div>

      <p className="muted-copy">
        Aceptar una solicitud crea la inscripción real del estudiante. Rechazarla no crea ningún curso y permite que vuelva a solicitarlo más adelante.
      </p>

      {error && <div className="auth-message auth-error">{error}</div>}

      {requests.length === 0 ? (
        <div className="empty-state">Todavía no hay solicitudes de cursos.</div>
      ) : (
        <div className="admin-request-list">
          {requests.map((request) => {
            const profile = profiles[request.user_id];
            const attempt = attempts[request.id];
            const result = attempt ? results[attempt.id] : undefined;
            const disabled = busyId === request.id;

            let diagnosticText = "Sin diagnóstico";
            if (request.diagnostic_opt_in && !attempt) diagnosticText = "Diagnóstico disponible · no iniciado";
            if (attempt?.status === "in_progress") diagnosticText = `Diagnóstico en progreso · Nivel ${attempt.current_level}`;
            if (attempt?.status === "limit_reached") diagnosticText = result ? `Diagnóstico finalizado · ${result.placement_title}` : "Diagnóstico finalizado con Mi límite";
            if (attempt?.status === "completed") diagnosticText = result ? `Diagnóstico finalizado · Nivel ${result.placement_level}: ${result.placement_title}` : "Diagnóstico finalizado";

            return (
              <article className="admin-request-card" key={request.id}>
                <div className="admin-request-main">
                  <div>
                    <span className="request-user">
                      {profile?.display_name ?? "Estudiante"}{profile?.student_code ? ` · ${profile.student_code}` : ""}
                    </span>
                    <h3>{request.course_name}</h3>
                    <p>{request.grade_level} · Nivel declarado: {levelLabels[request.self_level] ?? request.self_level}</p>
                    <small>🧠 {diagnosticText}</small>
                  </div>
                  <span className={`status-pill ${request.status === "handled" ? "status-open" : "status-soon"}`}>
                    {statusLabels[request.status]}
                  </span>
                </div>

                {request.status !== "handled" && request.status !== "rejected" && (
                  <div className="request-actions">
                    <button className="secondary-button" type="button" onClick={() => resolveRequest(request.id, "review")} disabled={disabled || request.status === "in_review"}>
                      En revisión
                    </button>
                    <button className="primary-button" type="button" onClick={() => resolveRequest(request.id, "accept")} disabled={disabled}>
                      Aceptar curso
                    </button>
                    <button className="secondary-button" type="button" onClick={() => resolveRequest(request.id, "reject")} disabled={disabled}>
                      Rechazar
                    </button>
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
