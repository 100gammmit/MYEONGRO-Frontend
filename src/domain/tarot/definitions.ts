export type TarotSpreadType =
  | "daily_one_card"
  | "mind_three_card"
  | "relationship_three_card"
  | "choice_five_card";

export type AiTarotSpreadType = Exclude<TarotSpreadType, "daily_one_card">;

export function isAiTarotSpreadType(
  spreadType: TarotSpreadType,
): spreadType is AiTarotSpreadType {
  return spreadType !== "daily_one_card";
}

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
  /** Placeholder shown in the question box; free daily cards take no question. */
  readonly questionExample?: string;
  readonly positions: readonly TarotPositionDefinition[];
}

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
    name: "고민 리딩",
    summary: "일, 공부, 창작, 생활 등 지금의 고민을 살펴봐요. 상황에 영향을 주는 요인과 앞으로의 전개를 읽어요.",
    metaLabel: "카드 3장 · 고민의 다음 전개",
    cardCount: 3,
    inputMode: "question",
    questionExample: "예시) 요즘 이직 준비가 자꾸 미뤄지는데 앞으로 어떻게 흘러갈까요?",
    positions: [
      {
        id: "emotion",
        label: "지금의 상황",
        instruction: "질문과 관련해 지금 어떤 상황에 놓여 있는지 떠올리며 골라 보세요.",
      },
      {
        id: "underlying_need",
        label: "영향을 주는 요인",
        instruction: "이 상황에 영향을 주는 기회나 어려움을 생각하며 골라 보세요.",
      },
      {
        id: "self_action",
        label: "앞으로의 전개",
        instruction: "궁금한 상황이 앞으로 어떻게 이어질지 떠올리며 골라 보세요.",
      },
    ],
  },
  relationship_three_card: {
    id: "relationship_three_card",
    name: "관계 리딩",
    summary: "연인, 친구, 가족 등 한 사람과의 관계를 살펴봐요. 내가 바라는 관계와 현재의 흐름, 앞으로의 관계를 읽어요.",
    metaLabel: "카드 3장 · 대인관계 살펴보기",
    cardCount: 3,
    inputMode: "question",
    questionExample: "예시) 연락이 뜸해진 친구와의 관계가 앞으로 어떻게 될까요?",
    positions: [
      {
        id: "my_heart",
        label: "내가 바라는 관계",
        instruction: "떠올린 사람에게 내가 느끼는 감정과 바라는 점을 생각해 보세요.",
      },
      {
        id: "relationship_flow",
        label: "현재의 관계 흐름",
        instruction: "그 사람과 지금 어떤 관계로 지내고 있는지 떠올리며 골라 보세요.",
      },
      {
        id: "check_point",
        label: "앞으로의 관계",
        instruction: "두 사람의 관계가 앞으로 어떻게 이어질지 떠올리며 골라 보세요.",
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
    questionExample: "예시) 주말에 새 취미를 시작할지, 쉬는 시간을 늘릴지 고민돼요.",
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

// For untrusted input such as a URL query: only an own spread id counts, so inherited keys
// like "toString" are rejected along with the free daily card.
export function parseAiTarotSpreadType(value: unknown): AiTarotSpreadType | null {
  if (typeof value !== "string" || !Object.hasOwn(TAROT_SPREADS, value)) return null;
  const spreadType = value as TarotSpreadType;
  return isAiTarotSpreadType(spreadType) ? spreadType : null;
}
