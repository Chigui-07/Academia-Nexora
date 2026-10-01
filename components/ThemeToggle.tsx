"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Theme = "light" | "dark";

const STORAGE_KEY = "nexora-theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const preferredTheme: Theme = savedTheme ?? "dark";

    setTheme(preferredTheme);
    applyTheme(preferredTheme);
  }, []);

  async function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);

    const { data } = await supabase.auth.getSession();
    if (data.session) {
      await supabase
        .from("profiles")
        .update({ theme: nextTheme })
        .eq("id", data.session.user.id);
    }
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
    >
      <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
      <span className="theme-toggle-label">{theme === "dark" ? "Claro" : "Oscuro"}</span>
    </button>
  );
}
