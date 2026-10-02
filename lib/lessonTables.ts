export type LessonTable = {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
};

const TABLE_MARKER = "\n\n<!-- NEXORA_TABLES:";
const TABLE_MARKER_END = " -->";

export function createEmptyLessonTable(): LessonTable {
  return {
    id: crypto.randomUUID(),
    title: "",
    headers: ["Columna 1", "Columna 2"],
    rows: [["", ""]],
  };
}

export function encodeLessonContent(text: string, tables: LessonTable[]) {
  const cleanText = text.trimEnd();
  if (tables.length === 0) return cleanText;
  const payload = encodeURIComponent(JSON.stringify(tables));
  return `${cleanText}${TABLE_MARKER}${payload}${TABLE_MARKER_END}`;
}

export function decodeLessonContent(value: string): { text: string; tables: LessonTable[] } {
  const markerIndex = value.lastIndexOf(TABLE_MARKER);
  if (markerIndex < 0 || !value.endsWith(TABLE_MARKER_END)) {
    return { text: value, tables: [] };
  }

  const payloadStart = markerIndex + TABLE_MARKER.length;
  const payloadEnd = value.length - TABLE_MARKER_END.length;

  try {
    const parsed = JSON.parse(decodeURIComponent(value.slice(payloadStart, payloadEnd))) as LessonTable[];
    if (!Array.isArray(parsed)) throw new Error("Formato inválido");
    return {
      text: value.slice(0, markerIndex),
      tables: parsed.map((table, index) => ({
        id: table.id || `table-${index + 1}`,
        title: table.title ?? "",
        headers: Array.isArray(table.headers) && table.headers.length > 0 ? table.headers : ["Columna 1", "Columna 2"],
        rows: Array.isArray(table.rows) ? table.rows : [],
      })),
    };
  } catch {
    return { text: value, tables: [] };
  }
}
