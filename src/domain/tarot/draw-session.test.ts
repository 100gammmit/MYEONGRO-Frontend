import { describe, expect, it } from "vitest";

import { parseTarotDrawSessionState } from "./draw-session";

const inProgressFixture = {
  drawSessionId: "draw-session-1",
  spreadType: "mind_three_card",
  status: "in_progress",
  currentPosition: "underlying_need",
  selectedCount: 1,
  totalCount: 3,
  expiresAt: "2026-07-17T12:30:00Z",
  candidates: Array.from({ length: 5 }, (_, index) => ({
    token: `opaque-token-${index + 1}`,
  })),
};

const completeFixture = {
  drawSessionId: "draw-session-1",
  spreadType: "mind_three_card",
  status: "complete",
  selectedCount: 3,
  totalCount: 3,
  expiresAt: "2026-07-17T12:30:00Z",
  cards: [
    { position: "emotion", cardId: "major-02-high-priestess", reversed: false },
    { position: "underlying_need", cardId: "major-17-star", reversed: false },
    { position: "self_action", cardId: "major-08-strength", reversed: false },
  ],
};

describe("parseTarotDrawSessionState", () => {
  it("accepts an exact in-progress response with opaque candidates and no card IDs", () => {
    expect(JSON.stringify(inProgressFixture)).not.toContain("cardId");
    expect(parseTarotDrawSessionState(inProgressFixture)).toEqual(inProgressFixture);
  });

  it("accepts ordered cards only in a complete response", () => {
    expect(parseTarotDrawSessionState(completeFixture)).toEqual(completeFixture);
  });

  it("rejects card IDs in an in-progress candidate and malformed counts", () => {
    expect(() => parseTarotDrawSessionState({
      ...inProgressFixture,
      candidates: [
        ...inProgressFixture.candidates.slice(0, 4),
        { token: "opaque-token-5", cardId: "major-17-star" },
      ],
    })).toThrow("draw session");

    expect(() => parseTarotDrawSessionState({
      ...completeFixture,
      selectedCount: 2,
    })).toThrow("draw session");
  });
});
