import { ActivityAnswerKey, ActivityAnswerValue, ActivityQuestionBlock, activityQuestionTypeLabels } from "@/lib/activityQuestions";
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
  answers?: ActivityAnswerKey;
  responsesDisabled?: boolean;
  onAnswerChange?: (questionId: string, value: ActivityAnswerValue) => void;
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
  answers = {},
  responsesDisabled = false,
  onAnswerChange,
}: ActivitySheetProps) {
  const opensLabel = formatDate(opensAt);
  const closesLabel = formatDate(closesAt);
  const inputDisabled = preview || responsesDisabled;

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
            {questionBlocks.map((question, index) => {
              const current = answers[question.id];
              const selectedMultiple = Array.isArray(current) ? current : [];

              return (
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
                      value={typeof current === "string" ? current : ""}
                      disabled={inputDisabled}
                      onChange={(event) => onAnswerChange?.(question.id, event.target.value)}
                    />
                  )}

                  {question.type === "single_choice" && (
                    <div className={styles.choiceList}>
                      {(question.options ?? []).map((option) => (
                        <label key={option.id} className={current === option.id ? styles.choiceSelected : undefined}>
                          <input
                            type="radio"
                            name={`activity-${question.id}`}
                            checked={current === option.id}
                            disabled={inputDisabled}
                            onChange={() => onAnswerChange?.(question.id, option.id)}
                          />
                          <span>{option.label || "Opción sin texto"}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === "multiple_choice" && (
                    <div className={styles.choiceList}>
                      {(question.options ?? []).map((option) => {
                        const checked = selectedMultiple.includes(option.id);
                        return (
                          <label key={option.id} className={checked ? styles.choiceSelected : undefined}>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={inputDisabled}
                              onChange={(event) => {
                                const next = event.target.checked
                                  ? [...selectedMultiple, option.id]
                                  : selectedMultiple.filter((id) => id !== option.id);
                                onAnswerChange?.(question.id, next);
                              }}
                            />
                            <span>{option.label || "Opción sin texto"}</span>
                          </label>
                        );
                      })}
                      <small className={styles.choiceHint}>Puedes marcar más de una respuesta.</small>
                    </div>
                  )}

                  {question.type === "true_false" && (
                    <div className={styles.choiceList}>
                      <label className={current === true ? styles.choiceSelected : undefined}>
                        <input
                          type="radio"
                          name={`activity-${question.id}`}
                          checked={current === true}
                          disabled={inputDisabled}
                          onChange={() => onAnswerChange?.(question.id, true)}
                        />
                        <span>Verdadero</span>
                      </label>
                      <label className={current === false ? styles.choiceSelected : undefined}>
                        <input
                          type="radio"
                          name={`activity-${question.id}`}
                          checked={current === false}
                          disabled={inputDisabled}
                          onChange={() => onAnswerChange?.(question.id, false)}
                        />
                        <span>Falso</span>
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {timeLimitMinutes && preview && (
          <div className={styles.timerNote}>
            ⏱️ El cronómetro comenzará cuando el estudiante pulse Comenzar actividad.
          </div>
        )}
      </div>
    </article>
  );
}
