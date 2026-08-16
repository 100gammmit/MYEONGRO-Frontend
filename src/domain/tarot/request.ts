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
  readonly selectedSlots: readonly number[];
}

export interface TarotReadingRequest {
  readonly spreadType: TarotSpreadType;
  readonly question: string;
  readonly requestId: string;
  readonly selectedSlots: readonly number[];
  readonly choiceOptions?: TarotChoiceOptions;
}

export function createTarotReadingRequest(
  input: CreateTarotReadingRequestInput,
): TarotReadingRequest {
  const definition = TAROT_SPREADS[input.spreadType];
  if (
    input.selectedSlots.length !== definition.cardCount
    || input.selectedSlots.some((slot) => !Number.isInteger(slot) || slot < 1 || slot > 5)
  ) {
    throw new Error(`카드 선택 번호 ${definition.cardCount}개를 확인해 주세요.`);
  }

  const question = definition.inputMode === "fixed"
    ? DAILY_QUESTION
    : input.question.trim();
  if (question.length < 1 || question.length > 300) {
    throw new Error("질문은 1자 이상 300자 이하여야 합니다.");
  }

  const request = {
    spreadType: input.spreadType,
    question,
    requestId: input.requestId,
    selectedSlots: [...input.selectedSlots],
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
