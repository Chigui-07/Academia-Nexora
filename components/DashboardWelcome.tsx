"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardWelcome() {
  const [displayName, setDisplayName] = useState("Estudiante");

  useEffect(() => {
    let mounted = true;

    async function loadName() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();

      if (mounted && profile?.display_name) {
        setDisplayName(profile.display_name);
      }
    }

    loadName();

    return () => {
      mounted = false;
    };
  }, []);

  return <h1>Bienvenido, {displayName} 👋</h1>;
}
