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

export type ReadingModeNoticeCopy = { headline: string; body: string };

const REDIRECT_BODY =
  "중대한 결정이 걸린 질문은 명로가 대신 답할 수 없어요. 결정은 직접 내려 주시고, 리딩은 흐름만 참고해 주세요.";

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

export function sajuFocusAreaLabel(focusArea: SajuFocusArea): string {
  return SAJU_FOCUS_LABELS[focusArea];
}

export function fortuneReadingModeLabel(mode: Exclude<ReadingMode, "standard">): string {
  return READING_MODE_LABELS[mode];
}

// Only a decision question the server turned into a fortune gets this notice; asking for the fortune itself gets none.
export function redirectedReadingNotice(
  mode: ReadingMode,
  questionRedirected: boolean,
): ReadingModeNoticeCopy | null {
  if (mode === "standard" || !questionRedirected) return null;
  return {
    headline: `질문 대신 ${fortuneReadingModeLabel(mode)}을 읽었어요`,
    body: REDIRECT_BODY,
  };
}

// The redirect notice wins; otherwise saju explains only a fortune that differs from the chosen focus area.
export function sajuReadingModeNotice(
  focusArea: SajuFocusArea,
  mode: ReadingMode,
  questionRedirected: boolean,
): ReadingModeNoticeCopy | null {
  if (mode === "standard") return null;
  const redirected = redirectedReadingNotice(mode, questionRedirected);
  if (redirected) return redirected;
  if (SAJU_MODE_BY_FOCUS[focusArea] === mode) return null;

  const fortune = fortuneReadingModeLabel(mode);
  return {
    headline: `${fortune}을 중심으로 읽었어요`,
    body: `${withObjectParticle(sajuFocusAreaLabel(focusArea))} 관심 분야로 선택했지만, 질문 내용에 맞춰 ${fortune}으로 읽었어요.`,
  };
}

// 을 after a final consonant (나의 성향을, 재정·생활을), 를 otherwise (일·진로를, 관계를).
function withObjectParticle(word: string): string {
  const syllable = word.charCodeAt(word.length - 1) - 0xac00;
  const hasFinalConsonant = syllable >= 0 && syllable < 11172 && syllable % 28 !== 0;
  return `${word}${hasFinalConsonant ? "을" : "를"}`;
}

export function tarotPositionLabel(
  mode: ReadingMode,
  position: string,
  defaultLabel: string,
): string {
  return mode === "standard" ? defaultLabel : REDIRECTED_CHOICE_LABELS[position] ?? defaultLabel;
}
