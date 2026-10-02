import styles from "./ActivitySheet.module.css";

export type ActivitySheetType = "notebook_task" | "virtual_task" | "practice";

type ActivitySheetProps = {
  courseName: string;
  courseIcon?: string;
  activityType: ActivitySheetType;
  title: string;
  content: string;
  points?: number | null;
  opensAt?: string | null;
  closesAt?: string | null;
  timeLimitMinutes?: number | null;
  preview?: boolean;
};

const typeLabels: Record<ActivitySheetType, string> = {
  notebook_task: "Tarea de cuaderno",
  virtual_task: "Tarea virtual",
  practice: "Ejercicio práctico",
};

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ActivitySheet({
  courseName,
  courseIcon = "📚",
  activityType,
  title,
  content,
  points = null,
  opensAt = null,
  closesAt = null,
  timeLimitMinutes = null,
  preview = false,
}: ActivitySheetProps) {
  const opensLabel = formatDate(opensAt);
  const closesLabel = formatDate(closesAt);

  return (
    <article className={styles.paper}>
      <div className={styles.paperContent}>
        <div className={styles.topline}>
          <span>{courseIcon} {courseName}</span>
          <span>{preview ? "Vista previa" : typeLabels[activityType]}</span>
        </div>

        <div className={styles.heading}>
          <div>
            <p>{typeLabels[activityType]}</p>
            <h2>{title || "Actividad sin título"}</h2>
          </div>
          {points !== null && <span className={styles.points}>{points} pts</span>}
        </div>

        <div className={styles.metaRow}>
          {opensLabel && <span>🟢 Abre: {opensLabel}</span>}
          {closesLabel && <span>🔒 Cierra: {closesLabel}</span>}
          {timeLimitMinutes ? <span>⏱️ Límite: {timeLimitMinutes} min</span> : <span>⏱️ Sin cronómetro</span>}
        </div>

        <div className={styles.body}>
          {content.trim() ? content : "El contenido de la actividad aparecerá aquí."}
        </div>

        {timeLimitMinutes && (
          <div className={styles.timerNote}>
            ⏱️ El cronómetro comenzará cuando el estudiante inicie la actividad.
          </div>
        )}
      </div>
    </article>
  );
}
