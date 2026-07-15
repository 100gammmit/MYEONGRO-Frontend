export type TarotSpreadType =
  | "daily_one_card"
  | "mind_three_card"
  | "relationship_three_card"
  | "choice_five_card";

export type TarotPositionId =
  | "today"
  | "emotion"
  | "underlying_need"
  | "self_action"
  | "my_heart"
  | "relationship_flow"
  | "check_point"
  | "desire"
  | "fear"
  | "core_value"
  | "option_a"
  | "option_b";

export interface TarotPositionDefinition {
  readonly id: TarotPositionId;
  readonly label: string;
  readonly instruction: string;
}

export interface TarotSpreadDefinition {
  readonly id: TarotSpreadType;
  readonly name: string;
  readonly summary: string;
  readonly cardCount: 1 | 3 | 5;
  readonly inputMode: "fixed" | "question" | "choice";
  readonly positions: readonly TarotPositionDefinition[];
}

export const DAILY_QUESTION = "오늘 내가 살펴볼 마음과 작은 행동은 무엇인가요?";

export const TAROT_SPREADS: Readonly<Record<TarotSpreadType, TarotSpreadDefinition>> = {
  daily_one_card: {
    id: "daily_one_card",
    name: "오늘의 한 장",
    summary: "오늘 내 마음에 필요한 메시지와 작은 행동을 살펴봐요.",
    cardCount: 1,
    inputMode: "fixed",
    positions: [
      {
        id: "today",
        label: "지금 살펴볼 마음",
        instruction: "오늘 내 마음에 필요한 메시지를 떠올리며 한 장을 골라 보세요.",
      },
    ],
  },
  mind_three_card: {
    id: "mind_three_card",
    name: "마음 정리 3장",
    summary: "지금의 감정과 그 아래의 욕구, 나를 위한 행동을 연결해요.",
    cardCount: 3,
    inputMode: "question",
    positions: [
      {
        id: "emotion",
        label: "지금의 감정",
        instruction: "지금 가장 크게 느껴지는 감정에 마음을 두어 보세요.",
      },
      {
        id: "underlying_need",
        label: "감정 뒤의 욕구",
        instruction: "그 감정 아래에서 내가 바라고 있는 것을 떠올려 보세요.",
      },
      {
        id: "self_action",
        label: "나를 위한 행동",
        instruction: "오늘 나를 위해 할 수 있는 작은 행동을 생각해 보세요.",
      },
    ],
  },
  relationship_three_card: {
    id: "relationship_three_card",
    name: "관계 리딩 3장",
    summary: "내 마음과 관계의 흐름, 직접 확인할 지점을 차분히 살펴봐요.",
    cardCount: 3,
    inputMode: "question",
    positions: [
      {
        id: "my_heart",
        label: "내가 가져온 마음",
        instruction: "이 관계에 내가 어떤 마음으로 서 있는지 살펴보세요.",
      },
      {
        id: "relationship_flow",
        label: "관계에서 드러난 흐름",
        instruction: "최근 관계에서 반복되거나 달라진 흐름을 떠올려 보세요.",
      },
      {
        id: "check_point",
        label: "내가 확인할 것",
        instruction: "추측보다 직접 확인하고 싶은 것이 무엇인지 생각해 보세요.",
      },
    ],
  },
  choice_five_card: {
    id: "choice_five_card",
    name: "선택 리딩 5장",
    summary: "욕구와 두려움, 중요한 가치에 비추어 두 선택을 살펴봐요.",
    cardCount: 5,
    inputMode: "choice",
    positions: [
      {
        id: "desire",
        label: "원하는 것",
        instruction: "지금 내가 진짜 원하는 것을 떠올려 보세요.",
      },
      {
        id: "fear",
        label: "두려운 것",
        instruction: "이 선택에서 두려워하는 것은 무엇일까요?",
      },
      {
        id: "core_value",
        label: "중요한 가치",
        instruction: "놓치고 싶지 않은 중요한 가치를 생각해 보세요.",
      },
      {
        id: "option_a",
        label: "선택 A",
        instruction: "선택 A로 나아가는 모습을 떠올리며 골라 보세요.",
      },
      {
        id: "option_b",
        label: "선택 B",
        instruction: "선택 B로 나아가는 모습을 떠올리며 골라 보세요.",
      },
    ],
  },
};

export const TAROT_SPREAD_LIST = Object.values(TAROT_SPREADS);
