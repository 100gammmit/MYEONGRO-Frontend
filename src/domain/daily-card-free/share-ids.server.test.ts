// @vitest-environment node
import { MAJOR_ARCANA } from "@/domain/tarot";

import { DAILY_CARD_VARIANT_COUNT } from "./content";
import { DAILY_CARD_SHARE_IDS, dailyCardFromShareId, dailyCardShareId, dailyCardSharePath } from "./share-ids.server";

describe("daily card share IDs", () => {
  it("gives every card and variant its own ten-character ID", () => {
    expect(DAILY_CARD_SHARE_IDS).toHaveLength(MAJOR_ARCANA.length * DAILY_CARD_VARIANT_COUNT);
    expect(new Set(DAILY_CARD_SHARE_IDS).size).toBe(DAILY_CARD_SHARE_IDS.length);
    for (const id of DAILY_CARD_SHARE_IDS) expect(id).toMatch(/^[A-Za-z0-9]{10}$/);
  });

  it("round-trips each card and variant through its ID", () => {
    for (const card of MAJOR_ARCANA) {
      for (let variantIndex = 0; variantIndex < DAILY_CARD_VARIANT_COUNT; variantIndex += 1) {
        const id = dailyCardShareId(card.id, variantIndex);
        expect(id).not.toBeNull();
        expect(dailyCardFromShareId(id!)).toEqual({ cardId: card.id, variantIndex });
      }
    }
  });

  it("knows nothing about unknown cards, variants or IDs", () => {
    expect(dailyCardShareId("major-17-star", DAILY_CARD_VARIANT_COUNT)).toBeNull();
    expect(dailyCardShareId("constructor", 0)).toBeNull();
    expect(dailyCardFromShareId("AAAAAAAAAA")).toBeNull();
    expect(dailyCardFromShareId("toString")).toBeNull();
  });

  it("places the shared page under /tarot/daily", () => {
    expect(dailyCardSharePath("osWSGvBYg4")).toBe("/tarot/daily/osWSGvBYg4");
  });
});
