"use client";

import { LessonTable, createEmptyLessonTable } from "@/lib/lessonTables";
import styles from "./LessonTableEditor.module.css";

type LessonTableEditorProps = {
  tables: LessonTable[];
  onChange: (tables: LessonTable[]) => void;
};

function fitRow(row: string[], columns: number) {
  return Array.from({ length: columns }, (_, index) => row[index] ?? "");
}

export default function LessonTableEditor({ tables, onChange }: LessonTableEditorProps) {
  function addTable() {
    onChange([...tables, createEmptyLessonTable()]);
  }

  function updateTable(tableId: string, updater: (table: LessonTable) => LessonTable) {
    onChange(tables.map((table) => (table.id === tableId ? updater(table) : table)));
  }

  function removeTable(tableId: string) {
    onChange(tables.filter((table) => table.id !== tableId));
  }

  function addColumn(tableId: string) {
    updateTable(tableId, (table) => ({
      ...table,
      headers: [...table.headers, `Columna ${table.headers.length + 1}`],
      rows: table.rows.map((row) => [...fitRow(row, table.headers.length), ""]),
    }));
  }

  function removeColumn(tableId: string) {
    updateTable(tableId, (table) => {
      if (table.headers.length <= 1) return table;
      const nextCount = table.headers.length - 1;
      return {
        ...table,
        headers: table.headers.slice(0, nextCount),
        rows: table.rows.map((row) => fitRow(row, table.headers.length).slice(0, nextCount)),
      };
    });
  }

  function addRow(tableId: string) {
    updateTable(tableId, (table) => ({
      ...table,
      rows: [...table.rows, Array.from({ length: table.headers.length }, () => "")],
    }));
  }

  function removeRow(tableId: string, rowIndex: number) {
    updateTable(tableId, (table) => ({
      ...table,
      rows: table.rows.filter((_, index) => index !== rowIndex),
    }));
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.heading}>
        <div>
          <strong>▦ Tablas de la clase</strong>
          <small>Añade comparaciones, vocabulario, fórmulas o cualquier información organizada por filas y columnas.</small>
        </div>
        <button className="secondary-button" type="button" onClick={addTable}>＋ Añadir tabla</button>
      </div>

      {tables.length === 0 ? (
        <div className={styles.empty}>Todavía no hay tablas en esta clase.</div>
      ) : (
        <div className={styles.tableList}>
          {tables.map((table, tableIndex) => (
            <article className={styles.card} key={table.id}>
              <div className={styles.cardTop}>
                <label>
                  <span>Título de la tabla</span>
                  <input
                    value={table.title}
                    onChange={(event) => updateTable(table.id, (current) => ({ ...current, title: event.target.value }))}
                    placeholder={`Ej. Tabla ${tableIndex + 1}: palabras con y sin tilde`}
                    maxLength={160}
                  />
                </label>
                <button className={styles.deleteButton} type="button" onClick={() => removeTable(table.id)}>Eliminar tabla</button>
              </div>

              <div className={styles.tableScroller}>
                <table className={styles.editorTable}>
                  <thead>
                    <tr>
                      {table.headers.map((header, columnIndex) => (
                        <th key={`${table.id}-header-${columnIndex}`}>
                          <input
                            value={header}
                            onChange={(event) => updateTable(table.id, (current) => ({
                              ...current,
                              headers: current.headers.map((item, index) => index === columnIndex ? event.target.value : item),
                            }))}
                            placeholder={`Columna ${columnIndex + 1}`}
                          />
                        </th>
                      ))}
                      <th className={styles.rowActionHeader} aria-label="Acciones de fila" />
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, rowIndex) => (
                      <tr key={`${table.id}-row-${rowIndex}`}>
                        {fitRow(row, table.headers.length).map((cell, columnIndex) => (
                          <td key={`${table.id}-${rowIndex}-${columnIndex}`}>
                            <textarea
                              rows={2}
                              value={cell}
                              onChange={(event) => updateTable(table.id, (current) => ({
                                ...current,
                                rows: current.rows.map((currentRow, currentRowIndex) => {
                                  if (currentRowIndex !== rowIndex) return currentRow;
                                  const nextRow = fitRow(currentRow, current.headers.length);
                                  nextRow[columnIndex] = event.target.value;
                                  return nextRow;
                                }),
                              }))}
                              placeholder="Contenido..."
                            />
                          </td>
                        ))}
                        <td className={styles.rowActionCell}>
                          <button type="button" onClick={() => removeRow(table.id, rowIndex)} title="Eliminar fila">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.actions}>
                <button className="secondary-button" type="button" onClick={() => addRow(table.id)}>＋ Fila</button>
                <button className="secondary-button" type="button" onClick={() => addColumn(table.id)}>＋ Columna</button>
                <button className="secondary-button" type="button" onClick={() => removeColumn(table.id)} disabled={table.headers.length <= 1}>− Columna</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
