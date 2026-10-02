"use client";

import {
  ActivityAnswerKey,
  ActivityQuestionBlock,
  ActivityQuestionType,
  activityQuestionTypeLabels,
  createQuestionBlock,
  createQuestionId,
} from "@/lib/activityQuestions";
import styles from "./ActivityQuestionBuilder.module.css";

type Props = {
  questions: ActivityQuestionBlock[];
  answerKey: ActivityAnswerKey;
  onQuestionsChange: (questions: ActivityQuestionBlock[]) => void;
  onAnswerKeyChange: (answerKey: ActivityAnswerKey) => void;
};

function matchingAnswer(question: ActivityQuestionBlock) {
  return Object.fromEntries((question.pairs ?? []).map((pair) => [pair.id, pair.id]));
}

export default function ActivityQuestionBuilder({
  questions,
  answerKey,
  onQuestionsChange,
  onAnswerKeyChange,
}: Props) {
  function updateQuestion(id: string, patch: Partial<ActivityQuestionBlock>) {
    onQuestionsChange(questions.map((question) => question.id === id ? { ...question, ...patch } : question));
  }

  function addQuestion(type: ActivityQuestionType) {
    const question = createQuestionBlock(type);
    onQuestionsChange([...questions, question]);
    const initialAnswer = type === "multiple_choice"
      ? []
      : type === "matching_pairs"
        ? matchingAnswer(question)
        : null;
    onAnswerKeyChange({ ...answerKey, [question.id]: initialAnswer });
  }

  function removeQuestion(id: string) {
    onQuestionsChange(questions.filter((question) => question.id !== id));
    const next = { ...answerKey };
    delete next[id];
    onAnswerKeyChange(next);
  }

  function addOption(question: ActivityQuestionBlock) {
    const options = [...(question.options ?? []), { id: createQuestionId("o"), label: "" }];
    updateQuestion(question.id, { options });
  }

  function updateOption(question: ActivityQuestionBlock, optionId: string, label: string) {
    updateQuestion(question.id, {
      options: (question.options ?? []).map((option) => option.id === optionId ? { ...option, label } : option),
    });
  }

  function removeOption(question: ActivityQuestionBlock, optionId: string) {
    const options = (question.options ?? []).filter((option) => option.id !== optionId);
    updateQuestion(question.id, { options });

    const current = answerKey[question.id];
    if (Array.isArray(current)) {
      onAnswerKeyChange({ ...answerKey, [question.id]: current.filter((value) => value !== optionId) });
    } else if (current === optionId) {
      onAnswerKeyChange({ ...answerKey, [question.id]: null });
    }
  }

  function toggleMultiple(questionId: string, optionId: string) {
    const current = Array.isArray(answerKey[questionId]) ? answerKey[questionId] as string[] : [];
    const next = current.includes(optionId)
      ? current.filter((value) => value !== optionId)
      : [...current, optionId];
    onAnswerKeyChange({ ...answerKey, [questionId]: next });
  }

  function setPairs(question: ActivityQuestionBlock, pairs: NonNullable<ActivityQuestionBlock["pairs"]>) {
    const nextQuestion = { ...question, pairs };
    updateQuestion(question.id, { pairs });
    onAnswerKeyChange({ ...answerKey, [question.id]: matchingAnswer(nextQuestion) });
  }

  function addPair(question: ActivityQuestionBlock) {
    setPairs(question, [
      ...(question.pairs ?? []),
      { id: createQuestionId("p"), left: "", right: "" },
    ]);
  }

  function updatePair(question: ActivityQuestionBlock, pairId: string, side: "left" | "right", value: string) {
    setPairs(
      question,
      (question.pairs ?? []).map((pair) => pair.id === pairId ? { ...pair, [side]: value } : pair),
    );
  }

  function removePair(question: ActivityQuestionBlock, pairId: string) {
    setPairs(question, (question.pairs ?? []).filter((pair) => pair.id !== pairId));
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.heading}>
        <div>
          <p className="eyebrow">Preguntas interactivas</p>
          <h3>Construye la actividad por bloques</h3>
          <p className="muted-copy">Puedes combinar varios tipos de pregunta en una misma tarea o ejercicio.</p>
        </div>
      </div>

      <div className={styles.addGrid}>
        {(Object.keys(activityQuestionTypeLabels) as ActivityQuestionType[]).map((type) => (
          <button className="secondary-button" type="button" key={type} onClick={() => addQuestion(type)}>
            + {activityQuestionTypeLabels[type]}
          </button>
        ))}
      </div>

      {questions.length === 0 ? (
        <div className="empty-state">Todavía no agregaste preguntas. La hoja de instrucciones puede usarse sola o junto con preguntas interactivas.</div>
      ) : (
        <div className={styles.questionList}>
          {questions.map((question, index) => (
            <article className={styles.questionCard} key={question.id}>
              <div className={styles.questionTop}>
                <div>
                  <span>Pregunta {index + 1}</span>
                  <strong>{activityQuestionTypeLabels[question.type]}</strong>
                </div>
                <button className={styles.removeButton} type="button" onClick={() => removeQuestion(question.id)}>Eliminar</button>
              </div>

              <label>
                Enunciado
                <textarea
                  value={question.prompt}
                  onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })}
                  placeholder={question.type === "matching_pairs" ? "Ej. Relaciona cada concepto con su definición." : "Escribe la pregunta..."}
                  rows={3}
                />
              </label>

              {question.type === "written" && (
                <>
                  <label>
                    Texto de ayuda en la caja de respuesta
                    <input
                      value={question.placeholder ?? ""}
                      onChange={(event) => updateQuestion(question.id, { placeholder: event.target.value })}
                      placeholder="Ej. Explica con tus propias palabras..."
                    />
                  </label>
                  <label>
                    Respuesta esperada <small>(opcional; útil para corrección futura)</small>
                    <textarea
                      value={typeof answerKey[question.id] === "string" ? answerKey[question.id] as string : ""}
                      onChange={(event) => onAnswerKeyChange({ ...answerKey, [question.id]: event.target.value || null })}
                      placeholder="Déjalo vacío si será revisada manualmente."
                      rows={2}
                    />
                  </label>
                </>
              )}

              {(question.type === "single_choice" || question.type === "multiple_choice") && (
                <div className={styles.optionsBox}>
                  <span className={styles.optionHelp}>
                    {question.type === "single_choice" ? "Marca una respuesta correcta." : "Marca todas las respuestas correctas."}
                  </span>

                  {(question.options ?? []).map((option, optionIndex) => {
                    const selected = question.type === "multiple_choice"
                      ? Array.isArray(answerKey[question.id]) && (answerKey[question.id] as string[]).includes(option.id)
                      : answerKey[question.id] === option.id;

                    return (
                      <div className={styles.optionRow} key={option.id}>
                        <input
                          type={question.type === "single_choice" ? "radio" : "checkbox"}
                          name={`correct-${question.id}`}
                          checked={selected}
                          onChange={() => {
                            if (question.type === "single_choice") {
                              onAnswerKeyChange({ ...answerKey, [question.id]: option.id });
                            } else {
                              toggleMultiple(question.id, option.id);
                            }
                          }}
                          aria-label={`Marcar opción ${optionIndex + 1} como correcta`}
                        />
                        <input
                          value={option.label}
                          onChange={(event) => updateOption(question, option.id, event.target.value)}
                          placeholder={`Opción ${optionIndex + 1}`}
                        />
                        {(question.options?.length ?? 0) > 2 && (
                          <button type="button" className={styles.optionDelete} onClick={() => removeOption(question, option.id)}>×</button>
                        )}
                      </div>
                    );
                  })}

                  <button className="secondary-button" type="button" onClick={() => addOption(question)}>+ Agregar opción</button>
                </div>
              )}

              {question.type === "true_false" && (
                <fieldset className={styles.trueFalse}>
                  <legend>Respuesta correcta</legend>
                  <label>
                    <input
                      type="radio"
                      name={`tf-${question.id}`}
                      checked={answerKey[question.id] === true}
                      onChange={() => onAnswerKeyChange({ ...answerKey, [question.id]: true })}
                    />
                    Verdadero
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`tf-${question.id}`}
                      checked={answerKey[question.id] === false}
                      onChange={() => onAnswerKeyChange({ ...answerKey, [question.id]: false })}
                    />
                    Falso
                  </label>
                </fieldset>
              )}

              {question.type === "matching_pairs" && (
                <div className={styles.optionsBox}>
                  <span className={styles.optionHelp}>Escribe las parejas correctas. Al estudiante se le mostrarán las opciones de la derecha mezcladas.</span>
                  {(question.pairs ?? []).map((pair, pairIndex) => (
                    <div className={styles.optionRow} key={pair.id}>
                      <input
                        value={pair.left}
                        onChange={(event) => updatePair(question, pair.id, "left", event.target.value)}
                        placeholder={`Elemento ${pairIndex + 1}`}
                      />
                      <span aria-hidden="true">↔</span>
                      <input
                        value={pair.right}
                        onChange={(event) => updatePair(question, pair.id, "right", event.target.value)}
                        placeholder={`Pareja ${pairIndex + 1}`}
                      />
                      {(question.pairs?.length ?? 0) > 2 && (
                        <button type="button" className={styles.optionDelete} onClick={() => removePair(question, pair.id)}>×</button>
                      )}
                    </div>
                  ))}
                  <button className="secondary-button" type="button" onClick={() => addPair(question)}>+ Agregar pareja</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
