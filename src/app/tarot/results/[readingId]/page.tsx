import { notFound } from "next/navigation";

import {
  TarotReadingResult,
  type TarotReadingResultData,
} from "@/components/tarot-reading-result";
import { ProtectedPageUnavailable } from "@/components/protected-page-unavailable";
import {
  MAJOR_ARCANA,
  TAROT_SPREADS,
  type TarotPositionId,
  type TarotSpreadType,
} from "@/domain/tarot";
import {
  BackendReadingRecordsClient,
  type PublicReadingRecord,
} from "@/infrastructure/backend/reading-records-client";
import { getBackendCookieHeader } from "@/infrastructure/backend/request-cookies";
import { getSpringSessionState } from "@/infrastructure/backend/session-auth";

const CARD_IDS = new Set<string>(MAJOR_ARCANA.map((card) => card.id));

type TarotResultView = {
  spreadType: TarotSpreadType;
  cardIds: string[];
  result: TarotReadingResultData;
};

export default async function TarotResultPage({
  params,
}: {
  params: Promise<{ readingId: string }>;
}) {
  const cookieHeader = await getBackendCookieHeader();
  const session = await getSpringSessionState(cookieHeader);
  if (session.status === "unavailable") return <ProtectedPageUnavailable />;
  if (session.status === "unauthenticated") notFound();

  const { readingId } = await params;
  const reading = await new BackendReadingRecordsClient(cookieHeader).get(readingId);
  const view = reading ? parseTarotResultView(reading) : null;
  if (!view) notFound();

  return <TarotReadingResult {...view} />;
}

function parseTarotResultView(reading: PublicReadingRecord): TarotResultView | null {
  if (
    reading.kind !== "tarot"
    || reading.status !== "completed"
    || reading.schemaVersion !== 1
    || !reading.spreadType
    || !(reading.spreadType in TAROT_SPREADS)
    || !reading.result
  ) {
    return null;
  }

  const spreadType = reading.spreadType as TarotSpreadType;
  const definition = TAROT_SPREADS[spreadType];
  const cards = reading.input.cards;
  const result = reading.result;
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
