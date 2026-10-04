"use client";

import { useState } from "react";
import AcademicContentManager from "./AcademicContentManager";
import AdminCourseManager from "./AdminCourseManager";
import AdminCourseRequests from "./AdminCourseRequests";
import AdminEnrollmentManager from "./AdminEnrollmentManager";
import TeacherActivityManager from "./TeacherActivityManager";
import TeacherLessonManager from "./TeacherLessonManager";
import styles from "./AdminWorkspace.module.css";

type AdminSection = "activities" | "lessons" | "courses" | "students" | "requests" | "academic";

const sections: Array<{
  id: AdminSection;
  title: string;
  description: string;
}> = [
  {
    id: "activities",
    title: "📝 Tareas y ejercicios",
    description: "Crea tareas de cuaderno, tareas virtuales y ejercicios prácticos.",
  },
  {
    id: "lessons",
    title: "📖 Clases",
    description: "Crea, edita y publica clases para tus materias.",
  },
  {
    id: "courses",
    title: "📚 Cursos",
    description: "Administra el catálogo de materias de Academia Nexora.",
  },
  {
    id: "students",
    title: "👥 Alumnos",
    description: "Asigna cursos y revisa las entregas de cada estudiante.",
  },
  {
    id: "requests",
    title: "📩 Solicitudes",
    description: "Acepta, revisa o rechaza solicitudes de cursos.",
  },
  {
    id: "academic",
    title: "🎓 Progresión académica",
    description: "Consulta bloques, niveles y herramientas de recuperación académica.",
  },
];

export default function AdminWorkspace() {
  const [activeSection, setActiveSection] = useState<AdminSection | null>("activities");

  function toggleSection(section: AdminSection) {
    setActiveSection((current) => current === section ? null : section);
  }

  return (
    <div className={styles.workspace}>
      <section className={`panel ${styles.menuPanel}`}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Administración y Profesor</p>
            <h1>⚙️ Panel de gestión</h1>
            <p className="muted-copy">
              Elige qué quieres administrar. Solo una herramienta permanece abierta a la vez para mantener el panel limpio.
            </p>
          </div>
        </div>

        <div className={styles.buttonGrid}>
          {sections.map((section) => {
            const active = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                className={`${styles.sectionButton} ${active ? styles.sectionButtonActive : ""}`}
                onClick={() => toggleSection(section.id)}
                aria-expanded={active}
              >
                <strong>{section.title}</strong>
                <span>{section.description}</span>
                <small>{active ? "▲ Cerrar" : "▼ Abrir"}</small>
              </button>
            );
          })}
        </div>
      </section>

      {activeSection && (
        <section className={styles.openSection} aria-live="polite">
          <div className={styles.openHeader}>
            <div>
              <p className="eyebrow">Herramienta abierta</p>
              <h2>{sections.find((section) => section.id === activeSection)?.title}</h2>
            </div>
            <button className="secondary-button" type="button" onClick={() => setActiveSection(null)}>
              Cerrar sección
            </button>
          </div>

          {activeSection === "activities" && <TeacherActivityManager />}
          {activeSection === "lessons" && <TeacherLessonManager />}
          {activeSection === "courses" && <AdminCourseManager />}
          {activeSection === "students" && <AdminEnrollmentManager />}
          {activeSection === "requests" && <AdminCourseRequests />}
          {activeSection === "academic" && <AcademicContentManager />}
        </section>
      )}

      {!activeSection && (
        <div className={styles.emptySelection}>
          Selecciona uno de los botones de arriba para abrir una herramienta de administración.
        </div>
      )}
    </div>
  );
}
