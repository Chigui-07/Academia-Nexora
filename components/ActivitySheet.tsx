import {
  ActivityAnswerKey,
  ActivityAnswerValue,
  ActivityMatchingAnswer,
  ActivityQuestionBlock,
  activityQuestionTypeLabels,
} from "@/lib/activityQuestions";
import styles from "./ActivitySheet.module.css";

export type ActivitySheetType = "notebook_task" | "virtual_task" | "practice";
export type ActivityQuestionReview = "correct" | "neutral" | "incorrect";

export type ActivityReviewSummary = {
  reviewerName: string;
  gradeValue: number;
  gradeMax: number;
  feedback?: string | null;
  reviewedAt?: string | null;
};

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
  maxAttempts?: number;
  questionBlocks?: ActivityQuestionBlock[];
  preview?: boolean;
  answers?: ActivityAnswerKey;
  responsesDisabled?: boolean;
  onAnswerChange?: (questionId: string, value: ActivityAnswerValue) => void;
  questionReviews?: Record<string, ActivityQuestionReview>;
  questionFeedback?: Record<string, string>;
  reviewSummary?: ActivityReviewSummary | null;
  activeQuestionIndex?: number | null;
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

function matchingValue(value: ActivityAnswerValue | undefined): ActivityMatchingAnswer {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as ActivityMatchingAnswer;
  }
  return {};
}

const neutralReviewStyle = {
  border: "1px solid rgba(148, 163, 184, 0.5)",
  background: "rgba(148, 163, 184, 0.11)",
  color: "#cbd5e1",
};

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
  maxAttempts = 1,
  questionBlocks = [],
  preview = false,
  answers = {},
  responsesDisabled = false,
  onAnswerChange,
  questionReviews = {},
  questionFeedback = {},
  reviewSummary = null,
  activeQuestionIndex = null,
}: ActivitySheetProps) {
  const opensLabel = formatDate(opensAt);
  const closesLabel = formatDate(closesAt);
  const reviewedLabel = formatDate(reviewSummary?.reviewedAt);
  const inputDisabled = preview || responsesDisabled;
  const visibleQuestions = activeQuestionIndex === null
    ? questionBlocks.map((question, index) => ({ question, index }))
    : questionBlocks[activeQuestionIndex]
      ? [{ question: questionBlocks[activeQuestionIndex], index: activeQuestionIndex }]
      : [];
  const sheetLabel = !preview && activeQuestionIndex !== null && questionBlocks.length > 0
    ? `Hoja ${activeQuestionIndex + 1} de ${questionBlocks.length}`
    : preview
      ? "Vista previa"
      : typeLabels[activityType];

  return (
    <article className={styles.paper}>
      <div className={styles.paperContent}>
        <div className={styles.topline}>
          <span>{courseIcon} {courseName}</span>
          <span>{sheetLabel}</span>
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
          <span>🔁 {maxAttempts} {maxAttempts === 1 ? "intento" : "intentos"}</span>
        </div>

        <div className={styles.body}>
          {content.trim() ? content : questionBlocks.length === 0 ? "El contenido de la actividad aparecerá aquí." : ""}
        </div>

        {visibleQuestions.length > 0 && (
          <section className={styles.questions}>
            {visibleQuestions.map(({ question, index }) => {
              const current = answers[question.id];
              const selectedMultiple = Array.isArray(current) ? current : [];
              const selectedMatching = matchingValue(current);
              const questionReview = questionReviews[question.id];
              const teacherComment = questionFeedback[question.id]?.trim();

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

                  {question.type === "matching_pairs" && (
                    <div className={styles.choiceList}>
                      {(question.pairs ?? []).map((pair) => {
                        const rightOptions = [...(question.pairs ?? [])].reverse();
                        return (
                          <label key={pair.id} className={selectedMatching[pair.id] ? styles.choiceSelected : undefined}>
                            <span>{pair.left || "Elemento sin texto"}</span>
                            <select
                              value={selectedMatching[pair.id] ?? ""}
                              disabled={inputDisabled}
                              onChange={(event) => onAnswerChange?.(question.id, {
                                ...selectedMatching,
                                [pair.id]: event.target.value,
                              })}
                            >
                              <option value="">Selecciona la pareja...</option>
                              {rightOptions.map((rightPair) => (
                                <option key={rightPair.id} value={rightPair.id}>
                                  {rightPair.right || "Pareja sin texto"}
                                </option>
                              ))}
                            </select>
                          </label>
                        );
                      })}
                      <small className={styles.choiceHint}>
                        Relaciona cada elemento de la izquierda con una sola opción de la derecha.
                      </small>
                    </div>
                  )}

                  {questionReview && (
                    <div
                      className={`${styles.reviewMark} ${
                        questionReview === "correct"
                          ? styles.reviewCorrect
                          : questionReview === "incorrect"
                            ? styles.reviewIncorrect
                            : ""
                      }`}
                      style={questionReview === "neutral" ? neutralReviewStyle : undefined}
                    >
                      {questionReview === "correct"
                        ? "✅ Respuesta correcta"
                        : questionReview === "neutral"
                          ? "— Revisión neutral"
                          : "❌ Respuesta incorrecta"}
                    </div>
                  )}

                  {teacherComment && (
                    <div className={styles.questionFeedback}>
                      <small>🟡 Comentario del profesor</small>
                      <p>{teacherComment}</p>
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

        {reviewSummary && (
          <section className={styles.reviewSummary}>
            <div className={styles.reviewSummaryTop}>
              <div>
                <small>Calificación</small>
                <strong>{reviewSummary.gradeValue} / {reviewSummary.gradeMax}</strong>
              </div>
              <div className={styles.reviewSignature}>
                <span>Revisado y calificado por</span>
                <strong>{reviewSummary.reviewerName}</strong>
                {reviewedLabel && <small>{reviewedLabel}</small>}
              </div>
            </div>

            <div className={styles.feedbackBox}>
              <small>💬 Retroalimentación del profesor</small>
              <p>{reviewSummary.feedback?.trim() || "Sin comentario adicional."}</p>
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
