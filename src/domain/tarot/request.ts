import { MAJOR_ARCANA } from "./deck";
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
  readonly cardIds: readonly string[];
}

export interface TarotReadingRequest {
  readonly kind: "tarot";
  readonly spreadType: TarotSpreadType;
  readonly question: string;
  readonly requestId: string;
  readonly cardIds: string[];
  readonly choiceOptions?: TarotChoiceOptions;
}

const CARD_IDS = new Set<string>(MAJOR_ARCANA.map((card) => card.id));

export function createTarotReadingRequest(
  input: CreateTarotReadingRequestInput,
): TarotReadingRequest {
  const definition = TAROT_SPREADS[input.spreadType];
  const cardIds = [...input.cardIds];
  if (cardIds.length !== definition.cardCount) {
    throw new Error(`선택한 카드 수가 ${definition.cardCount}장이어야 합니다.`);
  }
  if (new Set(cardIds).size !== cardIds.length) {
    throw new Error("선택 카드 ID는 중복될 수 없습니다.");
  }
  if (cardIds.some((cardId) => !CARD_IDS.has(cardId))) {
    throw new Error("Major Arcana에 없는 카드가 포함되어 있습니다.");
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
    cardIds,
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
