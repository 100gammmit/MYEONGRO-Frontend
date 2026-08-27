import { z } from "zod";

import {
  DAILY_CARD_CONTENT_VERSION,
  DAILY_CARD_VARIANT_COUNT,
  getDailyCardContent,
} from "./content";

const DAILY_CARD_STORAGE_KEY_PREFIX = "myeongro:daily-card:v2";

export type DailyCardStorageScope =
  | "guest"
  | "unavailable"
  | `user:${string}`;

export function getDailyCardStorageKey(scope: DailyCardStorageScope): string {
  return `${DAILY_CARD_STORAGE_KEY_PREFIX}:${encodeURIComponent(scope)}`;
}

const storedDailyCardSchema = z.object({
  schemaVersion: z.literal(1),
  contentVersion: z.literal(DAILY_CARD_CONTENT_VERSION),
  dateKst: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  drawId: z.string().uuid(),
  cardId: z.string().min(1),
  variantIndex: z.number().int().min(0).max(DAILY_CARD_VARIANT_COUNT - 1),
}).strict().refine(
  (value) => getDailyCardContent(value.cardId, value.variantIndex) !== null,
  { message: "지원하지 않는 오늘의 카드입니다." },
);

export type StoredDailyCard = z.infer<typeof storedDailyCardSchema>;

export function getKoreanDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function parseStoredDailyCard(
  serialized: string | null,
  dateKst = getKoreanDate(),
): StoredDailyCard | null {
  if (!serialized) return null;
  try {
    const parsed = storedDailyCardSchema.parse(JSON.parse(serialized));
    return parsed.dateKst === dateKst ? parsed : null;
  } catch {
    return null;
  }
}

export function serializeStoredDailyCard(value: StoredDailyCard): string {
  return JSON.stringify(storedDailyCardSchema.parse(value));
}
