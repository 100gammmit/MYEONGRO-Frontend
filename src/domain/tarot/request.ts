import { DAILY_QUESTION, TAROT_SPREADS, type TarotSpreadType } from "./definitions";

export interface TarotChoiceOptions {
  readonly a: string;
  readonly b: string;
}

export interface CreateTarotReadingRequestInput {
  readonly spreadType: TarotSpreadType;
  readonly question: string;
  readonly choiceOptions?: TarotChoiceOptions;
  readonly requestId: string;
  readonly drawSessionId: string;
}

export interface TarotReadingRequest {
  readonly kind: "tarot";
  readonly spreadType: TarotSpreadType;
  readonly question: string;
  readonly requestId: string;
  readonly drawSessionId: string;
  readonly choiceOptions?: TarotChoiceOptions;
}

export function createTarotReadingRequest(
  input: CreateTarotReadingRequestInput,
): TarotReadingRequest {
  const definition = TAROT_SPREADS[input.spreadType];
  if (
    input.drawSessionId.length < 1
    || input.drawSessionId.trim() !== input.drawSessionId
  ) {
    throw new Error("완료된 타로 추첨 세션을 확인해 주세요.");
  }

  const question = definition.inputMode === "fixed"
    ? DAILY_QUESTION
    : input.question.trim();
  if (question.length < 1 || question.length > 300) {
    throw new Error("질문은 1자 이상 300자 이하여야 합니다.");
  }

  const request = {
    kind: "tarot",
    spreadType: input.spreadType,
    question,
    requestId: input.requestId,
    drawSessionId: input.drawSessionId,
  } as const;

  if (definition.inputMode === "choice") {
    const a = input.choiceOptions?.a.trim() ?? "";
    const b = input.choiceOptions?.b.trim() ?? "";
    if (a.length < 1 || a.length > 100 || b.length < 1 || b.length > 100) {
      throw new Error("선택 A와 B는 각각 1자 이상 100자 이하여야 합니다.");
    }
    if (a === b) {
      throw new Error("선택 A와 B는 서로 달라야 합니다.");
    }
    return { ...request, choiceOptions: { a, b } };
  }

  return request;
}
