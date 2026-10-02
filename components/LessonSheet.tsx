import { decodeLessonContent } from "@/lib/lessonTables";
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
  const decoded = decodeLessonContent(content);
  const explanation = decoded.text;
  const tables = decoded.tables;

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

      {(explanation.trim() || tables.length === 0) && (
        <section className={styles.section}>
          <h3>📖 Explicación</h3>
          <div className={styles.text}>{explanation.trim() || "El contenido de la clase aparecerá aquí."}</div>
        </section>
      )}

      {tables.length > 0 && (
        <section className={styles.tablesSection}>
          {tables.map((table, tableIndex) => (
            <div className={styles.tableBlock} key={table.id || `table-${tableIndex}`}>
              {table.title.trim() && <h3>{table.title}</h3>}
              <div className={styles.tableScroller}>
                <table className={styles.lessonTable}>
                  <thead>
                    <tr>
                      {table.headers.map((header, columnIndex) => (
                        <th key={`${table.id}-header-${columnIndex}`}>{header || `Columna ${columnIndex + 1}`}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, rowIndex) => (
                      <tr key={`${table.id}-row-${rowIndex}`}>
                        {table.headers.map((_, columnIndex) => (
                          <td key={`${table.id}-${rowIndex}-${columnIndex}`}>{row[columnIndex] ?? ""}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      )}

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
