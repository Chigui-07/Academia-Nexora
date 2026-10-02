export type ActivityQuestionType = "written" | "single_choice" | "multiple_choice" | "true_false";

export type ActivityQuestionOption = {
  id: string;
  label: string;
};

export type ActivityQuestionBlock = {
  id: string;
  type: ActivityQuestionType;
  prompt: string;
  options?: ActivityQuestionOption[];
  placeholder?: string;
};

export type ActivityAnswerValue = string | string[] | boolean | null;
export type ActivityAnswerKey = Record<string, ActivityAnswerValue>;

export const activityQuestionTypeLabels: Record<ActivityQuestionType, string> = {
  written: "Respuesta escrita",
  single_choice: "Elección única",
  multiple_choice: "Selección múltiple",
  true_false: "Verdadero o falso",
};

export function createQuestionId(prefix = "q") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createQuestionBlock(type: ActivityQuestionType): ActivityQuestionBlock {
  const id = createQuestionId();

  if (type === "single_choice" || type === "multiple_choice") {
    return {
      id,
      type,
      prompt: "",
      options: [
        { id: createQuestionId("o"), label: "" },
        { id: createQuestionId("o"), label: "" },
      ],
    };
  }

  return {
    id,
    type,
    prompt: "",
    placeholder: type === "written" ? "Escribe tu respuesta..." : undefined,
  };
}
