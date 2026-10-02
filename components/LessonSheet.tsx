import styles from "./LessonSheet.module.css";

type LessonSheetProps = {
  courseName: string;
  courseIcon?: string;
  unitTitle?: string;
  title: string;
  content: string;
  examples?: string;
  resources?: string;
  preview?: boolean;
};

export default function LessonSheet({
  courseName,
  courseIcon = "📚",
  unitTitle = "",
  title,
  content,
  examples = "",
  resources = "",
  preview = false,
}: LessonSheetProps) {
  return (
    <article className={styles.lesson}>
      <div className={styles.topline}>
        <span>{courseIcon} {courseName}</span>
        <span>{preview ? "Vista previa" : "Clase"}</span>
      </div>

      <div className={styles.heading}>
        {unitTitle.trim() && <p>{unitTitle}</p>}
        <h2>{title || "Clase sin título"}</h2>
      </div>

      <section className={styles.section}>
        <h3>📖 Explicación</h3>
        <div className={styles.text}>{content.trim() || "El contenido de la clase aparecerá aquí."}</div>
      </section>

      {examples.trim() && (
        <section className={styles.exampleSection}>
          <h3>💡 Ejemplos</h3>
          <div className={styles.text}>{examples}</div>
        </section>
      )}

      {resources.trim() && (
        <section className={styles.section}>
          <h3>🔗 Recursos y notas</h3>
          <div className={styles.text}>{resources}</div>
        </section>
      )}
    </article>
  );
}
