import { z } from "zod";

export const readingModeSchema = z.enum([
  "standard",
  "health_fortune",
  "money_fortune",
  "relationship_fortune",
  "career_life_fortune",
]);

export type ReadingMode = z.infer<typeof readingModeSchema>;

export type SajuFocusArea = "self" | "career" | "relationship" | "life_money";

const FORTUNE_NOTICE =
  "건강·돈·관계·일에 관한 질문은 결정 대신 운의 흐름을 읽어요. 명로는 중대한 결정을 대신할 수 없어요.";

const REDIRECTED_CHOICE_LABELS: Record<string, string> = {
  emotion: "현재의 운",
  underlying_need: "흐름을 움직이는 요인",
  self_action: "앞으로의 방향",
  my_heart: "운의 출발점",
  relationship_flow: "이어지는 흐름",
  check_point: "주의할 지점",
  desire: "바라는 흐름",
  fear: "주의할 흐름",
  core_value: "중심이 되는 힘",
  option_a: "운을 돕는 요소",
  option_b: "운을 막는 요소",
};

export function parseReadingMode(value: unknown): ReadingMode | null {
  if (value === undefined) return "standard";
  const parsed = readingModeSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

const HEADLINE: Record<ReadingMode, string | null> = {
  standard: null,
  health_fortune: "건강운을 중심으로 읽었어요",
  money_fortune: "금전운을 중심으로 읽었어요",
  relationship_fortune: "관계운을 중심으로 읽었어요",
  career_life_fortune: "직업·생활운을 중심으로 읽었어요",
};

const SAJU_FOCUS_LABELS: Record<SajuFocusArea, string> = {
  self: "나의 성향",
  career: "일·진로",
  relationship: "관계",
  life_money: "재정·생활",
};

const SAJU_MODE_BY_FOCUS: Partial<Record<SajuFocusArea, ReadingMode>> = {
  career: "career_life_fortune",
  relationship: "relationship_fortune",
  life_money: "money_fortune",
};

const READING_MODE_LABELS: Record<Exclude<ReadingMode, "standard">, string> = {
  health_fortune: "건강운",
  money_fortune: "금전운",
  relationship_fortune: "관계운",
  career_life_fortune: "직업·생활운",
};

export function readingModeNotice(mode: ReadingMode): string | null {
  return mode === "standard" ? null : FORTUNE_NOTICE;
}

export function readingModeHeadline(mode: ReadingMode): string | null {
  return HEADLINE[mode];
}

export function sajuFocusAreaLabel(focusArea: SajuFocusArea): string {
  return SAJU_FOCUS_LABELS[focusArea];
}

export function fortuneReadingModeLabel(mode: Exclude<ReadingMode, "standard">): string {
  return READING_MODE_LABELS[mode];
}

export function sajuReadingModeNotice(
  focusArea: SajuFocusArea,
  mode: ReadingMode,
  questionRedirected: boolean,
): string | null {
  if (mode === "standard") return null;
  const focusMismatch = SAJU_MODE_BY_FOCUS[focusArea] !== mode;
  if (!questionRedirected && !focusMismatch) return null;

  if (focusMismatch) {
    const prefix = `${sajuFocusAreaLabel(focusArea)}를 관심 분야로 선택했지만, `;
    return questionRedirected
      ? `${prefix}질문의 구체적인 결정은 대신하지 않고 ${fortuneReadingModeLabel(mode)}으로 바꿔 읽었어요.`
      : `${prefix}질문 내용에 맞춰 ${fortuneReadingModeLabel(mode)}으로 바꿔 읽었어요.`;
  }
  return FORTUNE_NOTICE;
}

export function tarotPositionLabel(
  mode: ReadingMode,
  position: string,
  defaultLabel: string,
): string {
  return mode === "standard" ? defaultLabel : REDIRECTED_CHOICE_LABELS[position] ?? defaultLabel;
}
