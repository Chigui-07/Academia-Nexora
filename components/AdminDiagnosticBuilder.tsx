"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Course = { id: string; course_key: string; name: string; icon: string; diagnostic_available: boolean };
type Question = { id: string; prompt: string; difficulty: string; active: boolean; accepted_answers: string[] };
type Pool = { id: string; group_label: string; draw_count: number; questions: Question[] };
type Level = { id: string; level_number: number; title: string; description: string; pools: Pool[] };
type Blueprint = { course_key: string; levels: Level[] };

export default function AdminDiagnosticBuilder() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseKey, setCourseKey] = useState("");
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [levelNumber, setLevelNumber] = useState("1");
  const [levelTitle, setLevelTitle] = useState("");
  const [levelDescription, setLevelDescription] = useState("");
  const [drawCount, setDrawCount] = useState("3");
  const [questionLevel, setQuestionLevel] = useState("1");
  const [prompt, setPrompt] = useState("");
  const [answers, setAnswers] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadCourses() {
    const { data, error: loadError } = await supabase.from("courses").select("id, course_key, name, icon, diagnostic_available").order("name");
    if (loadError) throw loadError;
    const loaded = (data ?? []) as Course[];
    setCourses(loaded);
    if (!courseKey && loaded[0]) setCourseKey(loaded[0].course_key);
  }

  async function loadBlueprint(key: string) {
    if (!key) return;
    const { data, error: loadError } = await supabase.rpc("admin_get_diagnostic_blueprint", { p_course_key: key });
    if (loadError) throw loadError;
    setBlueprint((data ?? { course_key: key, levels: [] }) as Blueprint);
  }

  useEffect(() => { loadCourses().catch((e) => setError(e instanceof Error ? e.message : "No se pudieron cargar los cursos.")); }, []);
  useEffect(() => { if (courseKey) loadBlueprint(courseKey).catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar el diagnóstico.")); }, [courseKey]);

  const selectedCourse = useMemo(() => courses.find((course) => course.course_key === courseKey) ?? null, [courses, courseKey]);

  async function saveLevel(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(null); setMessage(null);
    try {
      const n = Number(levelNumber); const draws = Number(drawCount);
      if (!Number.isInteger(n) || n < 1 || n > 20) throw new Error("El nivel debe estar entre 1 y 20.");
      if (!levelTitle.trim()) throw new Error("Escribe el nombre del nivel.");
      const { error: saveError } = await supabase.rpc("admin_save_diagnostic_level", { p_course_key: courseKey, p_level_number: n, p_title: levelTitle.trim(), p_description: levelDescription.trim(), p_group_label: levelTitle.trim(), p_draw_count: Number.isInteger(draws) ? draws : 3 });
      if (saveError) throw saveError;
      setMessage("✅ Nivel guardado."); setQuestionLevel(String(n)); setLevelTitle(""); setLevelDescription(""); await loadBlueprint(courseKey);
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar el nivel."); } finally { setSaving(false); }
  }

  async function saveQuestion(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(null); setMessage(null);
    try {
      const accepted = answers.split(",").map((item) => item.trim()).filter(Boolean);
      if (!prompt.trim()) throw new Error("Escribe la pregunta.");
      if (accepted.length === 0) throw new Error("Agrega al menos una respuesta aceptada.");
      const { error: saveError } = await supabase.rpc("admin_save_diagnostic_question", { p_question_id: editingQuestionId, p_course_key: courseKey, p_level_number: Number(questionLevel), p_prompt: prompt.trim(), p_accepted_answers: accepted, p_difficulty: difficulty, p_explanation: "", p_active: true });
      if (saveError) throw saveError;
      setMessage(editingQuestionId ? "✅ Pregunta actualizada." : "✅ Pregunta añadida al diagnóstico.");
      setPrompt(""); setAnswers(""); setDifficulty("medium"); setEditingQuestionId(null); await loadBlueprint(courseKey); await loadCourses();
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar la pregunta."); } finally { setSaving(false); }
  }

  function editQuestion(level: number, question: Question) {
    setQuestionLevel(String(level)); setPrompt(question.prompt); setAnswers((question.accepted_answers ?? []).join(", ")); setDifficulty(question.difficulty); setEditingQuestionId(question.id); setMessage("Editando pregunta existente.");
  }

  async function toggleQuestion(question: Question) {
    const { error: toggleError } = await supabase.rpc("admin_set_diagnostic_question_active", { p_question_id: question.id, p_active: !question.active });
    if (toggleError) { setError(toggleError.message); return; }
    await loadBlueprint(courseKey);
  }

  return (
    <section className="panel" style={{ display: "grid", gap: 22 }}>
      <div className="section-heading"><div><p className="eyebrow">Administración · Cursos</p><h2>🧠 Constructor de diagnósticos</h2><p className="muted-copy">Crea el examen inicial de cualquier curso. Cada nivel puede tener sus propias preguntas y varias respuestas aceptadas.</p></div></div>
      <label style={{ display: "grid", gap: 8 }}><strong>Curso</strong><select value={courseKey} onChange={(e) => { setCourseKey(e.target.value); setMessage(null); setError(null); }}>{courses.map((course) => <option key={course.id} value={course.course_key}>{course.icon} {course.name}{course.diagnostic_available ? " · diagnóstico activo" : ""}</option>)}</select></label>

      <div className="admin-management-stack" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        <form className="action-card" onSubmit={saveLevel} style={{ display: "grid", gap: 12 }}>
          <h3>1. Crear nivel</h3>
          <label>Número<input type="number" min="1" max="20" value={levelNumber} onChange={(e) => setLevelNumber(e.target.value)} /></label>
          <label>Nombre<input value={levelTitle} onChange={(e) => setLevelTitle(e.target.value)} placeholder="Ej. Fundamentos" /></label>
          <label>Descripción<textarea value={levelDescription} onChange={(e) => setLevelDescription(e.target.value)} placeholder="Qué evalúa este nivel" /></label>
          <label>Preguntas que se seleccionan<input type="number" min="1" max="20" value={drawCount} onChange={(e) => setDrawCount(e.target.value)} /></label>
          <button className="secondary-button" disabled={saving}>Guardar nivel</button>
        </form>

        <form className="action-card" onSubmit={saveQuestion} style={{ display: "grid", gap: 12 }}>
          <h3>2. Añadir pregunta</h3>
          <label>Nivel<select value={questionLevel} onChange={(e) => setQuestionLevel(e.target.value)}>{(blueprint?.levels ?? []).map((level) => <option key={level.id} value={level.level_number}>Nivel {level.level_number}: {level.title}</option>)}</select></label>
          <label>Pregunta<textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Escribe la pregunta diagnóstica" /></label>
          <label>Respuestas aceptadas<input value={answers} onChange={(e) => setAnswers(e.target.value)} placeholder="Respuesta 1, alternativa 2" /><small className="muted-copy">Sepáralas con comas. Nexora aceptará cualquiera de ellas.</small></label>
          <label>Dificultad<select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option value="easy">Fácil</option><option value="medium">Media</option><option value="hard">Difícil</option></select></label>
          <button className="primary-button" disabled={saving || (blueprint?.levels.length ?? 0) === 0}>{editingQuestionId ? "Actualizar pregunta" : "Añadir pregunta"}</button>
          {editingQuestionId && <button className="secondary-button" type="button" onClick={() => { setEditingQuestionId(null); setPrompt(""); setAnswers(""); }}>Cancelar edición</button>}
        </form>
      </div>

      {message && <div className="auth-message auth-success">{message}</div>}{error && <div className="auth-message auth-error">{error}</div>}

      <div style={{ display: "grid", gap: 14 }}>
        <h3>{selectedCourse?.icon} {selectedCourse?.name} · examen actual</h3>
        {(blueprint?.levels ?? []).length === 0 ? <div className="empty-state">Este curso todavía no tiene niveles diagnósticos. Crea el primero arriba.</div> : (blueprint?.levels ?? []).map((level) => {
          const questions = level.pools.flatMap((pool) => pool.questions ?? []);
          return <article className="action-card" key={level.id} style={{ display: "grid", gap: 10 }}><div><strong>Nivel {level.level_number}: {level.title}</strong><div className="muted-copy">{questions.filter((q) => q.active).length} preguntas activas</div></div>{questions.map((question) => <div key={question.id} style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}><span>{question.active ? "✅" : "⏸️"} {question.prompt}</span><div style={{ display: "flex", gap: 8 }}><button type="button" className="secondary-button" onClick={() => editQuestion(level.level_number, question)}>Editar</button><button type="button" className="secondary-button" onClick={() => toggleQuestion(question)}>{question.active ? "Desactivar" : "Activar"}</button></div></div>)}</article>;
        })}
      </div>
    </section>
  );
}
