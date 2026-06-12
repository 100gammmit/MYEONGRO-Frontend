import { MAJOR_ARCANA } from "./deck";
import { TarotDomainError } from "./errors";
import type {
  MajorArcanaCard,
  TarotCardChoice,
  TarotPosition,
  TarotSpreadCard,
} from "./types";

const POSITIONS: readonly TarotPosition[] = ["past", "present", "guidance"];
const CARDS_BY_ID: ReadonlyMap<string, MajorArcanaCard> = new Map(
  MAJOR_ARCANA.map((card) => [card.id, card]),
);

export function createThreeCardSpread(
  choices: readonly TarotCardChoice[],
): readonly TarotSpreadCard[] {
  if (choices.length !== 3) {
    throw new TarotDomainError(
      "INVALID_CARD_COUNT",
      `타로 스프레드는 정확히 3장의 카드가 필요합니다. 현재 ${choices.length}장이 선택되었습니다.`,
    );
  }

  const seenCardIds = new Set<string>();

  return choices.map((choice, index) => {
    if (seenCardIds.has(choice.cardId)) {
      throw new TarotDomainError(
        "DUPLICATE_CARD",
        `같은 카드를 두 번 선택할 수 없습니다: ${choice.cardId}`,
      );
    }
    seenCardIds.add(choice.cardId);

    const card = CARDS_BY_ID.get(choice.cardId);
    if (!card) {
      throw new TarotDomainError(
        "UNKNOWN_CARD",
        `메이저 아르카나 덱에 없는 카드입니다: ${choice.cardId}`,
      );
    }

    return {
      position: POSITIONS[index],
      card,
      reversed: choice.reversed,
    };
  });
}
