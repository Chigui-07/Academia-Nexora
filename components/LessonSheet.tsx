"use client";

import { useEffect, useMemo, useState } from "react";
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

type LessonPage =
  | { kind: "explanation"; title: string; text: string }
  | { kind: "table"; title: string; table: ReturnType<typeof decodeLessonContent>["tables"][number] }
  | { kind: "examples"; title: string; text: string }
  | { kind: "resources"; title: string; text: string };

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
  const [currentPage, setCurrentPage] = useState(0);

  const pages = useMemo<LessonPage[]>(() => {
    const next: LessonPage[] = [];

    if (explanation.trim() || tables.length === 0) {
      next.push({
        kind: "explanation",
        title: "📖 Explicación",
        text: explanation.trim() || "El contenido de la clase aparecerá aquí.",
      });
    }

    tables.forEach((table, index) => {
      next.push({
        kind: "table",
        title: table.title.trim() || `📊 Tabla ${index + 1}`,
        table,
      });
    });

    if (examples.trim()) {
      next.push({ kind: "examples", title: "💡 Ejemplos", text: examples });
    }

    if (resources.trim()) {
      next.push({ kind: "resources", title: "🔗 Recursos y notas", text: resources });
    }

    return next.length > 0
      ? next
      : [{ kind: "explanation", title: "📖 Explicación", text: "El contenido de la clase aparecerá aquí." }];
  }, [explanation, tables, examples, resources]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(0, pages.length - 1)));
  }, [pages.length]);

  const page = pages[currentPage];

  return (
    <div className={styles.book}>
      <article className={styles.lesson}>
        <div className={styles.topline}>
          <span>{courseIcon} {courseName}</span>
          <span>{preview ? "Vista previa" : `Hoja ${currentPage + 1} de ${pages.length}`}</span>
        </div>

        <div className={styles.heading}>
          {unitTitle.trim() && <p>{unitTitle}</p>}
          <h2>{title || "Clase sin título"}</h2>
        </div>

        <section className={page.kind === "examples" ? styles.exampleSection : styles.section}>
          <h3>{page.title}</h3>

          {page.kind === "table" ? (
            <div className={styles.tableScroller}>
              <table className={styles.lessonTable}>
                <thead>
                  <tr>
                    {page.table.headers.map((header, columnIndex) => (
                      <th key={`${page.table.id}-header-${columnIndex}`}>{header || `Columna ${columnIndex + 1}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {page.table.rows.map((row, rowIndex) => (
                    <tr key={`${page.table.id}-row-${rowIndex}`}>
                      {page.table.headers.map((_, columnIndex) => (
                        <td key={`${page.table.id}-${rowIndex}-${columnIndex}`}>{row[columnIndex] ?? ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.text}>{page.text}</div>
          )}
        </section>
      </article>

      {pages.length > 1 && (
        <div className={styles.pager}>
          <button
            className="secondary-button"
            type="button"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((pageIndex) => Math.max(0, pageIndex - 1))}
          >
            ← Hoja anterior
          </button>
          <strong>Hoja {currentPage + 1} de {pages.length}</strong>
          <button
            className="secondary-button"
            type="button"
            disabled={currentPage === pages.length - 1}
            onClick={() => setCurrentPage((pageIndex) => Math.min(pages.length - 1, pageIndex + 1))}
          >
            Siguiente hoja →
          </button>
        </div>
      )}
    </div>
  );
}
