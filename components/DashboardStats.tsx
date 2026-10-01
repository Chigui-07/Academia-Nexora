"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardStats() {
  const [activeCourses, setActiveCourses] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadActiveCourses() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) return;

      const { count, error } = await supabase
        .from("course_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("status", "active");

      if (!mounted) return;

      if (error) {
        console.error("No se pudieron contar los cursos activos:", error.message);
        setActiveCourses(0);
        return;
      }

      setActiveCourses(count ?? 0);
    }

    loadActiveCourses();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="stats-grid">
      <article className="stat-card">
        <div className="stat-label">Tareas pendientes</div>
        <div className="stat-value">0</div>
      </article>
      <article className="stat-card">
        <div className="stat-label">Promedio actual</div>
        <div className="stat-value">—</div>
      </article>
      <article className="stat-card">
        <div className="stat-label">Cursos activos</div>
        <div className="stat-value">{activeCourses === null ? "—" : activeCourses}</div>
      </article>
    </section>
  );
}
