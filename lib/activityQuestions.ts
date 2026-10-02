export type ActivityQuestionType = "written" | "single_choice" | "multiple_choice" | "true_false" | "matching_pairs";

export type ActivityQuestionOption = {
  id: string;
  label: string;
};

export type ActivityMatchingPair = {
  id: string;
  left: string;
  right: string;
};

export type ActivityQuestionBlock = {
  id: string;
  type: ActivityQuestionType;
  prompt: string;
  options?: ActivityQuestionOption[];
  pairs?: ActivityMatchingPair[];
  placeholder?: string;
};

export type ActivityMatchingAnswer = Record<string, string>;
export type ActivityAnswerValue = string | string[] | boolean | ActivityMatchingAnswer | null;
export type ActivityAnswerKey = Record<string, ActivityAnswerValue>;

export const activityQuestionTypeLabels: Record<ActivityQuestionType, string> = {
  written: "Respuesta escrita",
  single_choice: "Elección única",
  multiple_choice: "Selección múltiple",
  true_false: "Verdadero o falso",
  matching_pairs: "Relacionar parejas",
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

  if (type === "matching_pairs") {
    return {
      id,
      type,
      prompt: "",
      pairs: [
        { id: createQuestionId("p"), left: "", right: "" },
        { id: createQuestionId("p"), left: "", right: "" },
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
