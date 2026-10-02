"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./AdminCourseManager.module.css";

type Course = {
  id: string;
  course_key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  active: boolean;
  diagnostic_available: boolean;
  is_essential: boolean;
  mandatory_days: number | null;
};

type CourseForm = {
  id: string | null;
  course_key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  active: boolean;
  diagnostic_available: boolean;
};

type CatalogFilter = "all" | "active" | "inactive" | "essential";

const emptyForm: CourseForm = {
  id: null,
  course_key: "",
  name: "",
  description: "",
  icon: "📚",
  category: "General",
  active: true,
  diagnostic_available: false,
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function friendlyError(error: unknown) {
  if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "23505") {
    return "Ya existe un curso con ese nombre o identificador.";
  }

  const message = error instanceof Error
    ? error.message
    : typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";

  if (message.includes("Course key cannot be changed")) return "El identificador interno de un curso existente no puede cambiarse.";
  if (message.includes("Essential courses are system-managed")) return "Los cursos de Formación esencial son administrados por el sistema.";
  if (message.includes("Admin role required")) return "Solo una cuenta administradora puede modificar el catálogo.";
  if (message.includes("Course name is required")) return "Escribe el nombre del curso.";
  if (message.includes("Course key is required")) return "El curso necesita un identificador interno.";
  if (message.includes("Course key must use")) return "El identificador solo puede usar letras minúsculas, números y guiones.";
  return message || "No se pudo guardar el curso.";
}

export default function AdminCourseManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<CourseForm>(emptyForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CatalogFilter>("all");
  const [keyTouched, setKeyTouched] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(preferredId?: string | null) {
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      setReady(true);
      return;
    }

    const { data: adminRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) throw roleError;
    if (!adminRole) {
      setCanManage(false);
      setReady(true);
      return;
    }

    setCanManage(true);
    const { data, error: courseError } = await supabase
      .from("courses")
      .select("id, course_key, name, description, icon, category, active, diagnostic_available, is_essential, mandatory_days")
      .order("is_essential", { ascending: true })
      .order("name", { ascending: true });

    if (courseError) throw courseError;
    const loaded = (data ?? []) as Course[];
    setCourses(loaded);

    const targetId = preferredId ?? selectedId;
    const target = loaded.find((course) => course.id === targetId) ?? null;
    if (target) selectCourse(target);
    setReady(true);
  }

  useEffect(() => {
    load().catch((caughtError) => {
      setError(friendlyError(caughtError));
      setReady(true);
    });
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(courses.map((course) => course.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, "es")),
    [courses],
  );

  const visibleCourses = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    return courses.filter((course) => {
      if (filter === "active" && !course.active) return false;
      if (filter === "inactive" && course.active) return false;
      if (filter === "essential" && !course.is_essential) return false;
      if (!term) return true;
      return `${course.name} ${course.course_key} ${course.category} ${course.description}`
        .toLocaleLowerCase("es")
        .includes(term);
    });
  }, [courses, search, filter]);

  const selectedCourse = courses.find((course) => course.id === selectedId) ?? null;
  const isNew = form.id === null;
  const diagnosticEngineReady = form.course_key === "matematica";

  function selectCourse(course: Course) {
    setSelectedId(course.id);
    setKeyTouched(true);
    setMessage(null);
    setError(null);
    setForm({
      id: course.id,
      course_key: course.course_key,
      name: course.name,
      description: course.description,
      icon: course.icon,
      category: course.category,
      active: course.active,
      diagnostic_available: course.diagnostic_available,
    });
  }

  function startNewCourse() {
    setSelectedId(null);
    setForm(emptyForm);
    setKeyTouched(false);
    setMessage(null);
    setError(null);
  }

  function updateName(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      course_key: current.id === null && !keyTouched ? slugify(value) : current.course_key,
    }));
  }

  async function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const cleanKey = form.course_key.trim();
      const cleanName = form.name.trim();
      if (!cleanName) throw new Error("Escribe el nombre del curso.");
      if (!cleanKey) throw new Error("El curso necesita un identificador interno.");

      const diagnosticAvailable = diagnosticEngineReady ? form.diagnostic_available : false;
      const { data, error: saveError } = await supabase.rpc("admin_save_course", {
        p_course_id: form.id,
        p_course_key: cleanKey,
        p_name: cleanName,
        p_description: form.description.trim(),
        p_icon: form.icon.trim() || "📚",
        p_category: form.category.trim() || "General",
        p_active: form.active,
        p_diagnostic_available: diagnosticAvailable,
      });

      if (saveError) throw saveError;
      const savedId = data as string;
      setMessage(form.id ? "✅ Curso actualizado correctamente." : "✅ Curso creado y añadido al catálogo.");
      await load(savedId);
    } catch (caughtError) {
      setError(friendlyError(caughtError));
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <section className="panel"><div className="empty-state">Cargando catálogo...</div></section>;
  if (!canManage) return null;

  return (
    <section className={`panel ${styles.wrapper}`}>
      <div className={styles.header}>
        <div>
          <p className="eyebrow">Administración</p>
          <h2>📚 Gestionar cursos</h2>
          <p className="muted-copy">Crea materias, edita su información y decide si aparecen activas en Nexora. Desactivar un curso no borra su historial.</p>
        </div>
        <button className="primary-button" type="button" onClick={startNewCourse}>＋ Nuevo curso</button>
      </div>

      <div className={styles.layout}>
        <aside className={styles.catalogPanel}>
          <label className={styles.fieldLabel}>
            Buscar curso
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, categoría o clave..." />
          </label>

          <div className={styles.filters}>
            {([
              ["all", "Todos"],
              ["active", "Activos"],
              ["inactive", "Inactivos"],
              ["essential", "Esenciales"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? styles.filterActive : styles.filterButton}
                type="button"
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={styles.courseList}>
            {visibleCourses.length === 0 ? (
              <div className="empty-state">No hay cursos con este filtro.</div>
            ) : visibleCourses.map((course) => (
              <button
                key={course.id}
                type="button"
                className={`${styles.courseButton} ${selectedId === course.id ? styles.courseButtonActive : ""}`}
                onClick={() => selectCourse(course)}
              >
                <div className={styles.courseTitleRow}>
                  <strong>{course.icon} {course.name}</strong>
                  <span className={course.active ? styles.activeBadge : styles.inactiveBadge}>{course.active ? "Activo" : "Inactivo"}</span>
                </div>
                <span>{course.category}</span>
                <small>{course.course_key}</small>
                <div className={styles.badges}>
                  {course.is_essential && <span>🌱 Esencial</span>}
                  {course.diagnostic_available && <span>🧠 Diagnóstico</span>}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className={styles.editorPanel}>
          {selectedCourse?.is_essential ? (
            <div className={styles.essentialView}>
              <div className={styles.essentialIcon}>{selectedCourse.icon}</div>
              <p className="eyebrow">Curso protegido del sistema</p>
              <h3>{selectedCourse.name}</h3>
              <p>{selectedCourse.description || "Sin descripción."}</p>
              <div className={styles.infoGrid}>
                <div><small>Categoría</small><strong>{selectedCourse.category}</strong></div>
                <div><small>Clave</small><strong>{selectedCourse.course_key}</strong></div>
                <div><small>Obligatorio</small><strong>{selectedCourse.mandatory_days ?? 365} días</strong></div>
                <div><small>Estado</small><strong>{selectedCourse.active ? "Activo" : "Inactivo"}</strong></div>
              </div>
              <div className={styles.systemNote}>🌱 Los cursos de Formación esencial se administran automáticamente para proteger la inscripción del primer año.</div>
            </div>
          ) : (
            <form className={styles.form} onSubmit={saveCourse}>
              <div className={styles.formHeading}>
                <div>
                  <p className="eyebrow">{isNew ? "Nuevo curso" : "Editar curso"}</p>
                  <h3>{isNew ? "Crear materia" : form.name || "Curso"}</h3>
                </div>
                {!isNew && <span className={form.active ? styles.activeBadge : styles.inactiveBadge}>{form.active ? "Activo" : "Inactivo"}</span>}
              </div>

              <div className={styles.twoColumns}>
                <label className={styles.fieldLabel}>
                  Icono
                  <input value={form.icon} maxLength={16} onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))} placeholder="📚" />
                </label>
                <label className={styles.fieldLabel}>
                  Categoría
                  <input list="course-categories" value={form.category} maxLength={80} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Ej. Ciencias" />
                  <datalist id="course-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist>
                </label>
              </div>

              <label className={styles.fieldLabel}>
                Nombre del curso
                <input value={form.name} maxLength={100} onChange={(event) => updateName(event.target.value)} placeholder="Ej. Astronomía" required />
              </label>

              <label className={styles.fieldLabel}>
                Identificador interno
                <input
                  value={form.course_key}
                  onChange={(event) => {
                    setKeyTouched(true);
                    setForm((current) => ({ ...current, course_key: slugify(event.target.value) }));
                  }}
                  placeholder="astronomia"
                  disabled={!isNew}
                  required
                />
                <small>{isNew ? "Se genera automáticamente. Usa minúsculas, números y guiones." : "Se mantiene fijo para no romper cursos, diagnósticos ni historial."}</small>
              </label>

              <label className={styles.fieldLabel}>
                Descripción
                <textarea value={form.description} maxLength={1200} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="¿Qué aprenderá el estudiante en esta materia?" />
              </label>

              <div className={styles.settingsGrid}>
                <label className={styles.toggleCard}>
                  <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
                  <span><strong>Curso activo</strong><small>Visible en el catálogo y accesible para estudiantes inscritos.</small></span>
                </label>

                <label className={`${styles.toggleCard} ${!diagnosticEngineReady ? styles.toggleDisabled : ""}`}>
                  <input
                    type="checkbox"
                    checked={diagnosticEngineReady && form.diagnostic_available}
                    disabled={!diagnosticEngineReady}
                    onChange={(event) => setForm((current) => ({ ...current, diagnostic_available: event.target.checked }))}
                  />
                  <span><strong>Diagnóstico inicial</strong><small>{diagnosticEngineReady ? "Puedes activar o desactivar el diagnóstico de Matemática." : "Por ahora el motor de diagnóstico está disponible únicamente para Matemática."}</small></span>
                </label>
              </div>

              {message && <div className="auth-message auth-success">{message}</div>}
              {error && <div className="auth-message auth-error">{error}</div>}

              <div className={styles.actions}>
                <button className="primary-button" type="submit" disabled={saving}>{saving ? "Guardando..." : isNew ? "Crear curso" : "Guardar cambios"}</button>
                {!isNew && <button className="secondary-button" type="button" onClick={startNewCourse}>Crear otro curso</button>}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
