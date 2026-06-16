export type ReadingKind = "tarot" | "saju";
export type ReadingTier = "free";
export type ReadingStatus = "draft" | "generating" | "completed" | "failed";

export interface Reading {
  id: string;
  kind: ReadingKind;
  tier: ReadingTier;
  status: ReadingStatus;
  guestSessionId?: string;
  userId?: string;
  title: string;
  createdAt: string;
}
export interface TarotCardSelection {
  cardId: string;
  position: "past" | "present" | "guidance";
  reversed: boolean;
}

export interface TarotReading extends Reading {
  kind: "tarot";
  category: "love" | "career" | "money" | "general";
  question: string;
  cards: TarotCardSelection[];
}

export interface FourPillars {
  year: string;
  month: string;
  day: string;
  hour: string;
}

export interface SajuReading extends Reading {
  kind: "saju";
  calendarType: "solar" | "lunar";
  birthDate: string;
  birthTime?: string;
  gender: "female" | "male" | "unspecified";
  pillars: FourPillars;
}

export interface Consent {
  id: string;
  subjectId: string;
  subjectType: "guest" | "user";
  documentType: "terms" | "privacy" | "sensitive-data";
  documentVersion: string;
  acceptedAt: string;
}

export interface GenerationRecord {
  id: string;
  readingId: string;
  provider: string;
  model: string;
  promptVersion: string;
  inputTokens?: number;
  outputTokens?: number;
  status: "pending" | "completed" | "failed";
  createdAt: string;
}
