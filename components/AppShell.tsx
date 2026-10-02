"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PresenceHeartbeat from "./PresenceHeartbeat";
import ThemeToggle from "./ThemeToggle";
import { replaceWith } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";

const studentNavItems = [
  ["🏠", "Inicio", "/dashboard"],
  ["📚", "Cursos", "/courses"],
  ["➕", "Solicitar curso", "/request-course"],
  ["🧠", "Diagnósticos", "/diagnostics"],
  ["📝", "Tareas", "/tasks"],
  ["📊", "Calificaciones", "/grades"],
  ["🏅", "Perfil", "/profile"],
] as const;

const adminNavItem = ["⚙️", "Administración", "/admin"] as const;

const stageMeta: Record<string, { icon: string; minimum: number }> = {
  Fundamentos: { icon: "🌱", minimum: 60 },
  Intermedio: { icon: "📘", minimum: 65 },
  Avanzado: { icon: "🧠", minimum: 70 },
  Superior: { icon: "🎓", minimum: 75 },
  Dominio: { icon: "🏆", minimum: 80 },
};

type Profile = {
  display_name: string;
  stage: string;
  level: number;
  theme: "light" | "dark";
  onboarding_completed_at: string | null;
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [adminUnread, setAdminUnread] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        replaceWith("/");
        return;
      }

      const [{ data: profileData }, { data: roleData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, stage, level, theme, onboarding_completed_at")
          .eq("id", session.user.id)
          .single(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id),
      ]);

      if (!mounted) return;

      const loadedRoles = (roleData ?? []).map((item) => item.role as string);
      const loadedProfile = profileData as Profile | null;

      if (!loadedProfile?.onboarding_completed_at) {
        replaceWith("/welcome/");
        return;
      }

      setEmail(session.user.email ?? "");
      setProfile(loadedProfile);
      setRoles(loadedRoles);

      if (loadedRoles.includes("admin")) {
        const { count } = await supabase
          .from("admin_notifications")
          .select("id", { count: "exact", head: true })
          .is("read_at", null);

        if (mounted) setAdminUnread(count ?? 0);
      }

      if (loadedProfile?.theme) {
        localStorage.setItem("nexora-theme", loadedProfile.theme);
        document.documentElement.dataset.theme = loadedProfile.theme;
        document.documentElement.style.colorScheme = loadedProfile.theme;
      }

      const isAdminArea = window.location.pathname.includes("/admin");
      const canManage = loadedRoles.includes("admin") || loadedRoles.includes("teacher");

      if (isAdminArea && !canManage) {
        replaceWith("/dashboard/");
        return;
      }

      setReady(true);
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        replaceWith("/");
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.rpc("heartbeat_user_presence", { p_active: false });
    await supabase.auth.signOut();
    replaceWith("/");
  }

  if (!ready) {
    return (
      <div className="app-loading">
        <div className="logo-icon">N</div>
        <p>Cargando Academia Nexora...</p>
      </div>
    );
  }

  const canManage = roles.includes("admin") || roles.includes("teacher");
  const navItems = canManage ? [...studentNavItems, adminNavItem] : studentNavItems;
  const displayName = profile?.display_name || email.split("@")[0] || "Estudiante";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const currentStage = profile?.stage ?? "Fundamentos";
  const currentStageMeta = stageMeta[currentStage] ?? { icon: "📚", minimum: 60 };

  return (
    <div className="app-shell">
      <PresenceHeartbeat />

      <aside className="sidebar">
        <Link className="logo-mark" href="/dashboard">
          <span className="logo-icon">N</span>
          <span>Academia Nexora</span>
        </Link>

        <nav className="nav-list" aria-label="Navegación principal">
          {navItems.map(([icon, label, href]) => (
            <Link className="nav-link" href={href} key={href}>
              <span>{icon}</span>
              <span>{label}</span>
              {href === "/admin" && roles.includes("admin") && adminUnread > 0 && (
                <span
                  className="nav-notification-badge"
                  aria-label={`${adminUnread} avisos nuevos`}
                  style={{
                    marginLeft: "auto",
                    minWidth: 24,
                    height: 24,
                    padding: "0 7px",
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--primary)",
                    color: "white",
                    fontSize: "0.75rem",
                    fontWeight: 900,
                  }}
                >
                  {adminUnread}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-note">
          {currentStageMeta.icon} <strong>{currentStage} · Nivel {profile?.level ?? 1}</strong>
          <br />
          Nota mínima actual: {currentStageMeta.minimum}/100
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <strong>Academia Nexora</strong>
          <div className="topbar-actions">
            <ThemeToggle />
            <div className="user-chip">
              <span>{displayName}</span>
              <span className="avatar">{avatarLetter}</span>
            </div>
            <button className="logout-button" type="button" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
