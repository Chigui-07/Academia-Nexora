"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { goTo } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";

type Question = { attempt_id: string; attempt_status: string; level_number: number; question_id: string; question_key: string; prompt: string; answer_type: string; difficulty: string; question_position: number; response: string | null; answered: boolean };
type SaveResult = { saved: boolean; attempt_status: string; current_level: number; level_completed: boolean };
type Level = { level_number: number; title: string };
type Result = { final_status: "completed" | "limit_reached"; placement_level: number; placement_title: string; mastered_through_level: number; mastered_topics: Array<{level:number;key:string;topic:string}>; reinforce_topics: Array<{level:number;key:string;topic:string}>; level_summary: Array<{level:number;title:string;answered:number;total:number;correct:number;percentage:number;mastered:boolean}> };

export default function DiagnosticRunnerPage() {
  const [courseKey, setCourseKey] = useState("");
  const [courseName, setCourseName] = useState("Diagnóstico");
  const [courseIcon, setCourseIcon] = useState("🧠");
  const [levels, setLevels] = useState<Level[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [status, setStatus] = useState("loading");
  const [level, setLevel] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string,string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = questions[index] ?? null;
  const answered = useMemo(() => questions.filter((q) => q.answered).length, [questions]);
  const levelTitle = levels.find((item) => item.level_number === level)?.title ?? "Diagnóstico";

  async function loadResult(id: string) {
    const { data, error: e } = await supabase.from("diagnostic_results").select("final_status, placement_level, placement_title, mastered_through_level, mastered_topics, reinforce_topics, level_summary").eq("attempt_id", id).maybeSingle();
    if (e) throw e; setResult((data as Result | null) ?? null);
  }

  async function loadQuestions(id: string) {
    const { data, error: e } = await supabase.rpc("get_diagnostic_questions", { p_attempt_id: id });
    if (e) throw e;
    const rows = (data ?? []) as Question[];
    setQuestions(rows);
    if (rows[0]) setLevel(rows[0].level_number);
    setDrafts(Object.fromEntries(rows.map((q) => [q.question_id, q.response ?? ""])));
    const pending = rows.findIndex((q) => !q.answered); setIndex(pending >= 0 ? pending : 0);
  }

  useEffect(() => {
    async function start() {
      try {
        const params = new URLSearchParams(window.location.search); const key = params.get("course") ?? ""; const request = params.get("request");
        if (!key) { setStatus("error"); setError("Falta identificar el curso del diagnóstico."); return; }
        setCourseKey(key);
        const { data: sessionData } = await supabase.auth.getSession(); if (!sessionData.session) { goTo("/"); return; }
        const [{ data: course }, { data: levelData }] = await Promise.all([
          supabase.from("courses").select("name, icon").eq("course_key", key).maybeSingle(),
          supabase.from("diagnostic_levels").select("level_number, title").eq("course_key", key).order("level_number")
        ]);
        if (course) { setCourseName(course.name); setCourseIcon(course.icon); }
        setLevels((levelData ?? []) as Level[]);
        const { data, error: startError } = await supabase.rpc("start_diagnostic", { p_course_key: key, p_course_request_id: request || null });
        if (startError) throw startError;
        const attempt = data?.[0] as { attempt_id:string; status:string; current_level:number } | undefined;
        if (!attempt) throw new Error("No se pudo iniciar el diagnóstico.");
        setAttemptId(attempt.attempt_id); setStatus(attempt.status); setLevel(attempt.current_level);
        if (attempt.status === "in_progress") await loadQuestions(attempt.attempt_id); else await loadResult(attempt.attempt_id);
      } catch (e) { setError(e instanceof Error ? e.message : "No se pudo abrir el diagnóstico."); setStatus("error"); }
    }
    start();
  }, []);

  async function save(action: "save"|"next"|"limit") {
    if (!attemptId || !current) return null;
    const response = drafts[current.question_id] ?? "";
    if (action !== "limit" && !response.trim()) { setError("Escribe una respuesta o usa Mi límite si ya no sabes continuar."); return null; }
    setBusy(true); setError(null);
    try {
      const { data, error: e } = await supabase.rpc("save_diagnostic_answer", { p_attempt_id: attemptId, p_question_id: current.question_id, p_response: response, p_action: action });
      if (e) throw e; const saved = data?.[0] as SaveResult | undefined; if (!saved) throw new Error("No se pudo guardar la respuesta.");
      if (action !== "limit") setQuestions((items) => items.map((q) => q.question_id === current.question_id ? { ...q, response: response.trim(), answered: true } : q));
      if (action === "limit") { setStatus(saved.attempt_status); await loadResult(attemptId); return saved; }
      if (saved.level_completed) { setStatus(saved.attempt_status); setLevel(saved.current_level); if (saved.attempt_status === "in_progress") await loadQuestions(attemptId); else await loadResult(attemptId); }
      return saved;
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar la respuesta."); return null; } finally { setBusy(false); }
  }

  async function next(event: FormEvent) { event.preventDefault(); const saved = await save("next"); if (!saved || saved.level_completed) return; const nextIndex = index + 1; if (nextIndex < questions.length) setIndex(nextIndex); else { const pending = questions.findIndex((q, i) => i !== index && !q.answered); if (pending >= 0) setIndex(pending); } }
  async function limitHere() { if (!window.confirm("¿Este es tu límite actual? El diagnóstico terminará y no podrá repetirse.")) return; await save("limit"); }

  if (status === "loading") return <AppShell><div className="empty-state">Preparando diagnóstico...</div></AppShell>;
  if (status === "error") return <AppShell><article className="panel"><h2>No pudimos abrir el diagnóstico</h2><div className="auth-message auth-error">{error}</div><button className="secondary-button" onClick={() => goTo("/diagnostics/")}>Volver</button></article></AppShell>;
  if (status === "completed" || status === "limit_reached") return <AppShell><article className="panel" style={{display:"grid",gap:20}}><div><p className="eyebrow">{courseIcon} {courseName}</p><h1>{status === "completed" ? "🏁 Diagnóstico completado" : "🧠 Límite registrado"}</h1></div>{result && <><div className="action-card"><small>Ubicación estimada</small><h2>Nivel {result.placement_level}: {result.placement_title}</h2><p className="muted-copy">Base dominada hasta el nivel {result.mastered_through_level}.</p></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14}}><div className="action-card"><h3>✅ Temas dominados</h3>{result.mastered_topics.length ? result.mastered_topics.map((t) => <div key={`${t.level}-${t.key}`}>{t.topic}</div>) : <p className="muted-copy">Todavía no hay temas confirmados.</p>}</div><div className="action-card"><h3>📚 Para reforzar</h3>{result.reinforce_topics.length ? result.reinforce_topics.map((t) => <div key={`${t.level}-${t.key}`}>{t.topic}</div>) : <p className="muted-copy">No se detectaron temas pendientes.</p>}</div></div></>}<button className="primary-button" onClick={() => goTo("/diagnostics/")}>Ver mis diagnósticos</button></article></AppShell>;

  return <AppShell><div className="page-header"><div><p className="eyebrow">Diagnóstico único · {courseName}</p><h1>Nivel {level}: {levelTitle}</h1><p>Responde con calma. Las respuestas se corrigen en el servidor y no se muestran durante la prueba.</p></div><strong>{answered}/{questions.length}</strong></div><section className="panel" style={{display:"grid",gap:18}}><div className="action-card"><strong>🧠 Sé honesto contigo mismo.</strong><p className="muted-copy">Si llegas a una parte que aún no conoces, usa Mi límite. Eso ayuda a encontrar desde dónde conviene comenzar.</p></div>{current ? <form onSubmit={next} style={{display:"grid",gap:16}}><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{questions.map((q,i) => <button type="button" className={i===index ? "primary-button" : "secondary-button"} key={q.question_id} onClick={() => setIndex(i)}>{q.answered ? "✓ " : ""}{i+1}</button>)}</div><div className="action-card" style={{display:"grid",gap:12}}><small>Pregunta {index+1} de {questions.length}</small><h2>{current.prompt}</h2><input value={drafts[current.question_id] ?? ""} onChange={(e) => setDrafts((d) => ({...d,[current.question_id]:e.target.value}))} placeholder="Escribe tu respuesta" autoFocus /><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button className="primary-button" disabled={busy}>Guardar y continuar</button><button className="secondary-button" type="button" disabled={busy} onClick={limitHere}>Mi límite</button></div></div></form> : <div className="empty-state">No encontramos preguntas para este nivel.</div>}{error && <div className="auth-message auth-error">{error}</div>}</section></AppShell>;
}
