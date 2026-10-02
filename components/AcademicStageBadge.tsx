"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AcademicProgress = {
  stage: string;
  level: number;
};

const stageIcons: Record<string, string> = {
  fundamentos: "🌱",
  intermedio: "📘",
  avanzado: "🧠",
  superior: "🎓",
  dominio: "🏆",
};

function stageIcon(stage: string) {
  return stageIcons[stage.trim().toLocaleLowerCase()] ?? "📚";
}

export default function AcademicStageBadge() {
  const [progress, setProgress] = useState<AcademicProgress | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;

      const { data } = await supabase
        .from("profiles")
        .select("stage, level")
        .eq("id", userId)
        .maybeSingle();

      if (!cancelled && data) setProgress(data as AcademicProgress);
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  if (!progress) return <span className="stage-badge">📚 Nivel actual</span>;

  return (
    <span className="stage-badge">
      {stageIcon(progress.stage)} {progress.stage} · Nivel {Math.max(1, Number(progress.level) || 1)}
    </span>
  );
}
