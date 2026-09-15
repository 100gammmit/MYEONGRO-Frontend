import { z } from "zod";

export const readingModeSchema = z.enum([
  "standard",
  "health_fortune",
  "money_fortune",
  "relationship_fortune",
  "career_life_fortune",
]);

export type ReadingMode = z.infer<typeof readingModeSchema>;

const NOTICE: Record<ReadingMode, string | null> = {
  standard: null,
  health_fortune: "리딩은 건강에 관한 결정을 대신할 수 없어요. 진단이나 치료는 의료 전문가와 상의해 주세요.",
  money_fortune: "리딩은 돈에 관한 결정을 대신할 수 없어요. 돈이 걸린 판단은 정확한 정보와 전문가의 도움을 받아 직접 내려 주세요.",
  relationship_fortune: "리딩은 관계에 관한 결정을 대신할 수 없어요. 중요한 결정은 충분히 생각한 뒤 직접 내려 주세요.",
  career_life_fortune: "리딩은 일과 생활에 관한 결정을 대신할 수 없어요. 중요한 결정은 충분히 알아본 뒤 직접 내려 주세요.",
};

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

export function readingModeNotice(mode: ReadingMode): string | null {
  return NOTICE[mode];
}

export function readingModeHeadline(mode: ReadingMode): string | null {
  return HEADLINE[mode];
}

export function tarotPositionLabel(
  mode: ReadingMode,
  position: string,
  defaultLabel: string,
): string {
  return mode === "standard" ? defaultLabel : REDIRECTED_CHOICE_LABELS[position] ?? defaultLabel;
}
