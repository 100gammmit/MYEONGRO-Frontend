import { z } from "zod";

import type { ReadingGenerationInput } from "@/domain/generation/contracts";
import { calculateFourPillars } from "@/domain/saju";
import { createThreeCardSpread, type TarotSpreadCard } from "@/domain/tarot";

const baseSchema = z.object({
  question: z.string().trim().min(1).max(300),
  requestId: z.string().uuid(),
});

const tarotSchema = baseSchema.extend({
  kind: z.literal("tarot"),
  cardIds: z.array(z.string().min(1)).length(3),
}).strict();

const sajuSchema = baseSchema.extend({
  kind: z.literal("saju"),
  birthDate: z.string().min(1),
  birthTime: z.string().min(1).optional(),
  gender: z.enum(["female", "male", "unspecified"]),
}).strict();

type ParsedTarotRequest = {
  kind: "tarot";
  question: string;
  requestId: string;
  spread: readonly TarotSpreadCard[];
  generationInput: ReadingGenerationInput;
  storageInput: Record<string, unknown>;
};

type ParsedSajuRequest = {
  kind: "saju";
  question: string;
  requestId: string;
  profile: Extract<ReadingGenerationInput, { kind: "saju" }>["profile"];
  generationInput: ReadingGenerationInput;
  storageInput: Record<string, unknown>;
};

export type ParsedFreeReadingRequest = ParsedTarotRequest | ParsedSajuRequest;

export function parseFreeReadingRequest(input: unknown): ParsedFreeReadingRequest {
  const kind = z.object({ kind: z.enum(["tarot", "saju"]) }).parse(input).kind;

  if (kind === "tarot") {
    const parsed = tarotSchema.parse(input);
    const spread = createThreeCardSpread(
      parsed.cardIds.map((cardId) => ({ cardId, reversed: false })),
    );
    const cards = spread.map(({ card, position, reversed }) => ({
      name: card.name,
      position,
      reversed,
    }));

    return {
      kind,
      question: parsed.question,
      requestId: parsed.requestId,
      spread,
      storageInput: {
        question: parsed.question,
        cards: spread.map(({ card, position, reversed }) => ({
          cardId: card.id,
          position,
          reversed,
        })),
      },
      generationInput: {
        kind,
        tier: "free",
        locale: "ko-KR",
        question: parsed.question,
        cards,
      },
    };
  }

  const parsed = sajuSchema.parse(input);
  const birthInput = {
    calendarType: "solar" as const,
    birthDate: parsed.birthDate,
    birthTime: parsed.birthTime,
    gender: parsed.gender,
  };
  const pillars = calculateFourPillars(birthInput);
  const profile = { ...birthInput, pillars };

  return {
    kind,
    question: parsed.question,
    requestId: parsed.requestId,
    profile,
    storageInput: {
      question: parsed.question,
      profile,
    },
    generationInput: {
      kind,
      tier: "free",
      locale: "ko-KR",
      question: parsed.question,
      profile,
    },
  };
}
