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
  readonly metaLabel: string;
  readonly cardCount: 1 | 3 | 5;
  readonly inputMode: "fixed" | "question" | "choice";
  readonly positions: readonly TarotPositionDefinition[];
}

export const DAILY_QUESTION = "오늘 내가 살펴볼 마음과 작은 행동은 무엇인가요?";

export const TAROT_SPREADS: Readonly<Record<TarotSpreadType, TarotSpreadDefinition>> = {
  daily_one_card: {
    id: "daily_one_card",
    name: "오늘의 운세",
    summary: "오늘 하루의 흐름을 살펴보고, 도움이 될 태도와 작은 행동을 확인해요.",
    metaLabel: "카드 1장 · 오늘의 흐름",
    cardCount: 1,
    inputMode: "fixed",
    positions: [
      {
        id: "today",
        label: "오늘의 흐름",
        instruction: "오늘 어떤 태도로 하루를 보내면 좋을지 생각하며 한 장을 골라 보세요.",
      },
    ],
  },
  mind_three_card: {
    id: "mind_three_card",
    name: "마음 정리",
    summary: "지금 느끼는 감정의 이유를 살펴보고, 나를 위해 무엇을 하면 좋을지 정리해요.",
    metaLabel: "카드 3장 · 감정 정리",
    cardCount: 3,
    inputMode: "question",
    positions: [
      {
        id: "emotion",
        label: "지금의 감정",
        instruction: "지금 내 기분을 가장 잘 설명하는 감정이 무엇인지 떠올려 보세요.",
      },
      {
        id: "underlying_need",
        label: "감정 뒤의 욕구",
        instruction: "지금 내가 가장 필요로 하거나 바라는 것이 무엇인지 생각해 보세요.",
      },
      {
        id: "self_action",
        label: "나를 위한 행동",
        instruction: "내 마음을 돌보기 위해 오늘 바로 할 수 있는 일을 생각해 보세요.",
      },
    ],
  },
  relationship_three_card: {
    id: "relationship_three_card",
    name: "관계 리딩",
    summary: "연인, 친구, 가족 등 한 사람과의 관계를 살펴봐요. 내 마음과 그 사람 사이의 흐름, 직접 확인할 점을 정리해요.",
    metaLabel: "카드 3장 · 대인관계 살펴보기",
    cardCount: 3,
    inputMode: "question",
    positions: [
      {
        id: "my_heart",
        label: "내가 가져온 마음",
        instruction: "떠올린 사람에게 내가 느끼는 감정과 바라는 점을 생각해 보세요.",
      },
      {
        id: "relationship_flow",
        label: "관계에서 드러난 흐름",
        instruction: "그 사람과 최근 주고받은 말과 행동에서 반복된 상황을 떠올려 보세요.",
      },
      {
        id: "check_point",
        label: "내가 확인할 것",
        instruction: "혼자 짐작하지 않고 그 사람에게 직접 묻거나 확인할 것을 생각해 보세요.",
      },
    ],
  },
  choice_five_card: {
    id: "choice_five_card",
    name: "선택 리딩",
    summary: "두 선택 사이에서 원하는 것과 걱정되는 점을 살펴보고, 나에게 더 중요한 기준을 찾아봐요.",
    metaLabel: "카드 5장 · 선택 A와 B 비교",
    cardCount: 5,
    inputMode: "choice",
    positions: [
      {
        id: "desire",
        label: "원하는 것",
        instruction: "선택 A와 B를 고민하며 내가 얻고 싶은 결과가 무엇인지 생각해 보세요.",
      },
      {
        id: "fear",
        label: "두려운 것",
        instruction: "두 선택 중 하나를 결정했을 때 가장 걱정되는 점을 생각해 보세요.",
      },
      {
        id: "core_value",
        label: "중요한 가치",
        instruction: "이번 선택에서 포기하고 싶지 않은 기준이 무엇인지 생각해 보세요.",
      },
      {
        id: "option_a",
        label: "선택 A",
        instruction: "입력한 선택 A를 택한 뒤의 내 일상을 구체적으로 떠올려 보세요.",
      },
      {
        id: "option_b",
        label: "선택 B",
        instruction: "입력한 선택 B를 택한 뒤의 내 일상을 구체적으로 떠올려 보세요.",
      },
    ],
  },
};

export const TAROT_SPREAD_LIST = Object.values(TAROT_SPREADS);
