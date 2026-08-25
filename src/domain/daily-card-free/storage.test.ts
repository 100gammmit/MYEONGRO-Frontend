import { describe, expect, it } from "vitest";

import {
  DAILY_CARD_CONTENT_VERSION,
  getDailyCardContent,
  parseStoredDailyCard,
  serializeStoredDailyCard,
} from ".";

const stored = {
  schemaVersion: 1 as const,
  contentVersion: DAILY_CARD_CONTENT_VERSION,
  dateKst: "2026-08-25",
  drawId: "82ed11d5-2269-438c-9815-42e6f13735f4",
  cardId: "major-17-star",
  variantIndex: 3,
} as const;

describe("daily card static contract", () => {
  it("provides every canonical card variant", () => {
    const cardIds = [
      "major-00-fool", "major-01-magician", "major-02-high-priestess",
      "major-03-empress", "major-04-emperor", "major-05-hierophant",
      "major-06-lovers", "major-07-chariot", "major-08-strength",
      "major-09-hermit", "major-10-wheel-of-fortune", "major-11-justice",
      "major-12-hanged-man", "major-13-death", "major-14-temperance",
      "major-15-devil", "major-16-tower", "major-17-star", "major-18-moon",
      "major-19-sun", "major-20-judgement", "major-21-world",
    ];
    for (const cardId of cardIds) {
      for (let variantIndex = 0; variantIndex < 6; variantIndex += 1) {
        const content = getDailyCardContent(cardId, variantIndex);
        expect(content).not.toBeNull();
        expect(content?.guidance).toHaveLength(1);
      }
    }
  });

  it("restores only a valid result from the same Korean date", () => {
    const serialized = serializeStoredDailyCard(stored);

    expect(parseStoredDailyCard(serialized, "2026-08-25")).toEqual(stored);
    expect(parseStoredDailyCard(serialized, "2026-08-26")).toBeNull();
    expect(parseStoredDailyCard("{broken", "2026-08-25")).toBeNull();
    expect(parseStoredDailyCard(JSON.stringify({ ...stored, extra: true }), "2026-08-25"))
      .toBeNull();
  });
});
