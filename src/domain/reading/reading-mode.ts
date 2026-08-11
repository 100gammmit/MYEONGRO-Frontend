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
  health_fortune: "구체적인 의료 결정은 다루지 않고, 지금의 건강운을 중심으로 읽었어요.",
  money_fortune: "구체적인 재정 결정은 다루지 않고, 지금의 금전운을 중심으로 읽었어요.",
  relationship_fortune: "구체적인 결정을 대신하지 않고, 지금의 관계운을 중심으로 읽었어요.",
  career_life_fortune: "구체적인 결정을 대신하지 않고, 지금의 직업·생활운을 중심으로 읽었어요.",
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

export function readingModeNotice(mode: ReadingMode): string | null {
  return NOTICE[mode];
}

export function tarotPositionLabel(
  mode: ReadingMode,
  position: string,
  defaultLabel: string,
): string {
  return mode === "standard" ? defaultLabel : REDIRECTED_CHOICE_LABELS[position] ?? defaultLabel;
}
