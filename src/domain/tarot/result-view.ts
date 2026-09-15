import { parseReadingMode, type ReadingMode } from "@/domain/reading/reading-mode";

import { MAJOR_ARCANA } from "./deck";
import {
  TAROT_SPREADS,
  isAiTarotSpreadType,
  type AiTarotSpreadType,
  type TarotPositionId,
  type TarotSpreadType,
} from "./definitions";

export type TarotReadingResultData = {
  readingMode: ReadingMode;
  title: string;
  summary: string;
  sections: Array<{
    position: TarotPositionId;
    heading: string;
    body: string;
  }>;
  guidance: string[];
  disclaimer: string;
};

export type TarotResultView = {
  spreadType: AiTarotSpreadType;
  cardIds: string[];
  result: TarotReadingResultData;
};

// The stored reading as the records API returns it; only the fields the view needs.
export interface StoredTarotReading {
  kind: string;
  status: string;
  schemaVersion?: number;
  spreadType?: string | null;
  input?: unknown;
  result?: unknown;
}

const CARD_IDS = new Set<string>(MAJOR_ARCANA.map((card) => card.id));

// One reader for both the fresh result page and the saved record, so a reading never renders two ways.
export function parseTarotResultView(reading: StoredTarotReading): TarotResultView | null {
  if (
    reading.kind !== "tarot"
    || reading.status !== "completed"
    || (reading.schemaVersion !== 1 && reading.schemaVersion !== 2)
    || !reading.spreadType
    || !(reading.spreadType in TAROT_SPREADS)
    || !isRecord(reading.input)
    || !isRecord(reading.result)
  ) {
    return null;
  }

  const spreadType = reading.spreadType as TarotSpreadType;
  if (!isAiTarotSpreadType(spreadType)) return null;
  const definition = TAROT_SPREADS[spreadType];
  const cards = reading.input.cards;
  const result = reading.result;
  const readingMode = parseReadingMode(result.readingMode);
  if (
    !Array.isArray(cards)
    || cards.length !== definition.cardCount
    || !Array.isArray(result.sections)
    || result.sections.length !== definition.cardCount
    || !Array.isArray(result.guidance)
    || result.guidance.some((item) => typeof item !== "string")
    || typeof result.title !== "string"
    || typeof result.summary !== "string"
    || typeof result.disclaimer !== "string"
    || readingMode === null
  ) {
    return null;
  }

  const seenCardIds = new Set<string>();
  const cardIds: string[] = [];
  const sections: TarotReadingResultData["sections"] = [];
  for (let index = 0; index < definition.cardCount; index += 1) {
    const position = definition.positions[index].id;
    const card = cards[index];
    const section = result.sections[index];
    if (
      !isRecord(card)
      || typeof card.cardId !== "string"
      || !CARD_IDS.has(card.cardId)
      || seenCardIds.has(card.cardId)
      || card.position !== position
      || card.reversed !== false
      || section?.position !== position
      || typeof section.heading !== "string"
      || typeof section.body !== "string"
    ) {
      return null;
    }
    seenCardIds.add(card.cardId);
    cardIds.push(card.cardId);
    sections.push({
      position: position as TarotPositionId,
      heading: section.heading,
      body: section.body,
    });
  }

  return {
    spreadType,
    cardIds,
    result: {
      readingMode,
      title: result.title,
      summary: result.summary,
      sections,
      guidance: result.guidance,
      disclaimer: result.disclaimer,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
