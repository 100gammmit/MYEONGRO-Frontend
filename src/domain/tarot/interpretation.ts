import type {
  DemoTarotInterpretation,
  TarotPosition,
  TarotSpreadCard,
} from "./types";

const POSITION_NAMES: Readonly<Record<TarotPosition, string>> = {
  past: "과거",
  present: "현재",
  guidance: "조언",
};

export function createDemoInterpretation(
  spread: readonly TarotSpreadCard[],
): DemoTarotInterpretation {
  const cards = spread.map((selection) => {
    const orientation = selection.reversed ? "reversed" : "upright";
    const orientationName = selection.reversed ? "역방향" : "정방향";
    const meaning = selection.reversed
      ? selection.card.reversedMeaning
      : selection.card.uprightMeaning;

    return {
      position: selection.position,
      positionName: POSITION_NAMES[selection.position],
      cardId: selection.card.id,
      cardName: selection.card.name,
      orientation,
      orientationName,
      keywords: selection.card.keywords,
      interpretation: `${POSITION_NAMES[selection.position]}의 ${
        selection.card.name
      } ${orientationName}: ${meaning}`,
    } as const;
  });

  const past = cards.find((card) => card.position === "past");
  const present = cards.find((card) => card.position === "present");
  const guidance = cards.find((card) => card.position === "guidance");

  return {
    title: "세 장의 메이저 아르카나가 전하는 흐름",
    overview: `${past?.cardName ?? "과거의 카드"}에서 시작된 흐름이 ${
      present?.cardName ?? "현재의 카드"
    }를 거쳐 ${guidance?.cardName ?? "조언의 카드"}의 메시지로 이어집니다.`,
    cards,
    guidance: guidance
      ? `${guidance.cardName}의 핵심어인 ${guidance.keywords.join(
          ", ",
        )}을 오늘의 선택에 차분히 적용해 보세요.`
      : "카드의 메시지를 현재 상황에 맞게 차분히 돌아보세요.",
    disclaimer:
      "이 해석은 자기 성찰과 오락을 위한 데모이며, 중요한 결정은 충분한 정보와 전문가의 조언을 바탕으로 내려야 합니다.",
  };
}
