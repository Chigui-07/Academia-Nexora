import { ActivityQuestionBlock, activityQuestionTypeLabels } from "@/lib/activityQuestions";
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
  questionBlocks?: ActivityQuestionBlock[];
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
  questionBlocks = [],
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
          {content.trim() ? content : questionBlocks.length === 0 ? "El contenido de la actividad aparecerá aquí." : ""}
        </div>

        {questionBlocks.length > 0 && (
          <section className={styles.questions}>
            {questionBlocks.map((question, index) => (
              <div className={styles.question} key={question.id}>
                <div className={styles.questionHeading}>
                  <span>Pregunta {index + 1}</span>
                  <small>{activityQuestionTypeLabels[question.type]}</small>
                </div>
                <p>{question.prompt || "Pregunta sin enunciado"}</p>

                {question.type === "written" && (
                  <textarea
                    className={styles.writtenAnswer}
                    placeholder={question.placeholder || "Escribe tu respuesta..."}
                    rows={4}
                    disabled={preview}
                  />
                )}

                {question.type === "single_choice" && (
                  <div className={styles.choiceList}>
                    {(question.options ?? []).map((option) => (
                      <label key={option.id}>
                        <input type="radio" name={`activity-${question.id}`} disabled={preview} />
                        <span>{option.label || "Opción sin texto"}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === "multiple_choice" && (
                  <div className={styles.choiceList}>
                    {(question.options ?? []).map((option) => (
                      <label key={option.id}>
                        <input type="checkbox" disabled={preview} />
                        <span>{option.label || "Opción sin texto"}</span>
                      </label>
                    ))}
                    <small className={styles.choiceHint}>Puedes marcar más de una respuesta.</small>
                  </div>
                )}

                {question.type === "true_false" && (
                  <div className={styles.choiceList}>
                    <label>
                      <input type="radio" name={`activity-${question.id}`} disabled={preview} />
                      <span>Verdadero</span>
                    </label>
                    <label>
                      <input type="radio" name={`activity-${question.id}`} disabled={preview} />
                      <span>Falso</span>
                    </label>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {timeLimitMinutes && (
          <div className={styles.timerNote}>
            ⏱️ El cronómetro comenzará cuando el estudiante inicie la actividad.
          </div>
        )}

        {!preview && questionBlocks.length > 0 && (
          <div className={styles.draftAnswerNote}>
            Las cajas de respuesta ya forman parte de la actividad. El guardado y la entrega persistente se habilitarán con el sistema de intentos.
          </div>
        )}
      </div>
    </article>
  );
}
