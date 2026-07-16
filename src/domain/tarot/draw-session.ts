import { z } from "zod";

import { MAJOR_ARCANA } from "./deck";
import { TAROT_SPREADS } from "./definitions";

const spreadTypeSchema = z.enum([
  "daily_one_card",
  "mind_three_card",
  "relationship_three_card",
  "choice_five_card",
]);

const positionSchema = z.enum([
  "today",
  "emotion",
  "underlying_need",
  "self_action",
  "my_heart",
  "relationship_flow",
  "check_point",
  "desire",
  "fear",
  "core_value",
  "option_a",
  "option_b",
]);

const baseSchema = z.object({
  drawSessionId: z.string().min(1),
  spreadType: spreadTypeSchema,
  selectedCount: z.number().int().nonnegative(),
  totalCount: z.union([z.literal(1), z.literal(3), z.literal(5)]),
  expiresAt: z.string().datetime({ offset: true }),
});

const inProgressSchema = baseSchema.extend({
  status: z.literal("in_progress"),
  currentPosition: positionSchema,
  candidates: z.array(z.object({ token: z.string().min(1) }).strict()).length(5),
}).strict();

const completeSchema = baseSchema.extend({
  status: z.literal("complete"),
  cards: z.array(z.object({
    position: positionSchema,
    cardId: z.string().min(1),
    reversed: z.literal(false),
  }).strict()),
}).strict();

const drawSessionSchema = z.discriminatedUnion("status", [
  inProgressSchema,
  completeSchema,
]);

export type TarotDrawInProgress = z.infer<typeof inProgressSchema>;
export type TarotDrawComplete = z.infer<typeof completeSchema>;
export type TarotDrawSessionState = TarotDrawInProgress | TarotDrawComplete;

export interface TarotDrawError {
  readonly code: string;
  readonly message: string;
}

const CANONICAL_CARD_IDS = new Set<string>(MAJOR_ARCANA.map((card) => card.id));

export function parseTarotDrawSessionState(input: unknown): TarotDrawSessionState {
  const parsed = drawSessionSchema.safeParse(input);
  if (!parsed.success || !stateMatchesSpread(parsed.data)) {
    throw new Error("Invalid tarot draw session response.");
  }
  return parsed.data;
}

function stateMatchesSpread(state: TarotDrawSessionState): boolean {
  const definition = TAROT_SPREADS[state.spreadType];
  if (state.totalCount !== definition.cardCount) return false;

  if (state.status === "in_progress") {
    return state.selectedCount < state.totalCount
      && state.currentPosition === definition.positions[state.selectedCount]?.id
      && new Set(state.candidates.map((candidate) => candidate.token)).size === 5;
  }

  return state.selectedCount === state.totalCount
    && state.cards.length === state.totalCount
    && new Set(state.cards.map((card) => card.cardId)).size === state.totalCount
    && state.cards.every((card, index) => (
      card.position === definition.positions[index]?.id
      && CANONICAL_CARD_IDS.has(card.cardId)
    ));
}
