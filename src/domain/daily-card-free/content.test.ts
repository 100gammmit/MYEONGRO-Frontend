import { describe, expect, it } from "vitest";

import { MAJOR_ARCANA } from "@/domain/tarot";
import { DAILY_CARD_VARIANT_COUNT, getDailyCardContent, type DailyCardContent } from "./content";

const DISCLAIMER = "이 내용은 오락과 자기 성찰을 위한 것으로 전문적인 조언을 대신하지 않아요.";
const COMMAND_LANGUAGE = /하세요|마세요|보세요|하십시오|반드시|해야 합니다|해야 해요/;
const FORMAL_LANGUAGE = /습니다|합니다|됩니다|입니다/;
const ACTION_HEADING = /해봐요|나눠봐요|살펴봐요/;
const ACTION_GUIDANCE = /해보|살펴보|정리해|확인해|기록해|준비해|시작해|중단해|멈춰/;
const GENERIC_GUIDANCE = /사용자|삶 전체|가능성 전체|미래 전체|이상한 일이 아니에요|둘은 함께 존재해요/;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Counts the card name as a standalone word, optionally followed by a particle.
function cardNameMentions(text: string, cardName: string): number {
  const pattern = new RegExp(
    `(?<![가-힣])${escapeRegExp(cardName)}(?=(?:은|는|이|가|의|을|를|과|와|에서|에게|으로|로|처럼)?(?:\\s|[,.!?:;]|$))`,
    "g",
  );
  return text.match(pattern)?.length ?? 0;
}

const entries: DailyCardContent[] = MAJOR_ARCANA.flatMap((card) =>
  Array.from({ length: DAILY_CARD_VARIANT_COUNT }, (_, variantIndex) => {
    const entry = getDailyCardContent(card.id, variantIndex);
    if (!entry) throw new Error(`Missing daily card content: ${card.id}#${variantIndex}`);
    return entry;
  }));

describe.each(entries.map((entry) => [`${entry.cardId}#${entry.variantIndex}`, entry] as const))(
  "daily card content %s",
  (_, entry) => {
    const guidance = entry.guidance[0];
    const userText = [entry.title, entry.today.heading, entry.today.body, guidance].join(" ");

    it("names the card exactly once in the body", () => {
      expect(cardNameMentions(entry.today.body, entry.cardName)).toBe(1);
    });

    it("uses the canonical disclaimer", () => {
      expect(entry.disclaimer).toBe(DISCLAIMER);
    });

    it("avoids commands and formal endings", () => {
      expect(userText).not.toMatch(COMMAND_LANGUAGE);
      expect(userText).not.toMatch(FORMAL_LANGUAGE);
      expect(entry.today.heading).not.toMatch(ACTION_HEADING);
    });

    it("keeps guidance to one declarative sentence without action or generic counseling language", () => {
      expect(guidance).toMatch(/^[^.!?]+\.$/);
      expect(guidance).not.toMatch(ACTION_GUIDANCE);
      expect(guidance).not.toMatch(GENERIC_GUIDANCE);
    });
  },
);

describe("daily card content set", () => {
  it("covers every major arcana card with distinct variants", () => {
    expect(entries).toHaveLength(MAJOR_ARCANA.length * DAILY_CARD_VARIANT_COUNT);
    const fingerprints = new Set(entries.map((entry) =>
      [entry.title, entry.today.heading, entry.today.body, entry.guidance[0]].join("|")));
    expect(fingerprints.size).toBe(entries.length);
  });
});
