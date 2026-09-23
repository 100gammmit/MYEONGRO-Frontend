import { describe, expect, it } from "vitest";

import {
  DAILY_CARD_CONTENT_VERSION,
  cleanupStaleDailyCardStorage,
  getDailyCardStorageKey,
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
  it("uses separate storage keys for guests and authenticated users", () => {
    expect(getDailyCardStorageKey("guest"))
      .not.toBe(getDailyCardStorageKey("user:11111111-1111-4111-8111-111111111111"));
    expect(getDailyCardStorageKey("user:11111111-1111-4111-8111-111111111111"))
      .not.toBe(getDailyCardStorageKey("user:22222222-2222-4222-8222-222222222222"));
  });

  it("uses the v3 storage namespace", () => {
    expect(getDailyCardStorageKey("guest")).toBe("myeongro:daily-card:v3:guest");
  });

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

  it("removes every stale or invalid v3 card while preserving valid and unrelated keys", () => {
    localStorage.clear();
    const validGuestKey = getDailyCardStorageKey("guest");
    const validOtherAccountKey = getDailyCardStorageKey(`user:${"a".repeat(64)}`);
    const staleAccountKey = getDailyCardStorageKey(`user:${"b".repeat(64)}`);
    const invalidAccountKey = getDailyCardStorageKey(`user:${"c".repeat(64)}`);
    localStorage.setItem(validGuestKey, serializeStoredDailyCard(stored));
    localStorage.setItem(validOtherAccountKey, serializeStoredDailyCard({
      ...stored,
      cardId: "major-19-sun",
      variantIndex: 0,
    }));
    localStorage.setItem(staleAccountKey, serializeStoredDailyCard({
      ...stored,
      dateKst: "2026-08-24",
    }));
    localStorage.setItem(invalidAccountKey, "{broken");
    localStorage.setItem("other:application:key", "keep");

    cleanupStaleDailyCardStorage(localStorage, "2026-08-25");

    expect(localStorage.getItem(validGuestKey)).not.toBeNull();
    expect(localStorage.getItem(validOtherAccountKey)).not.toBeNull();
    expect(localStorage.getItem(staleAccountKey)).toBeNull();
    expect(localStorage.getItem(invalidAccountKey)).toBeNull();
    expect(localStorage.getItem("other:application:key")).toBe("keep");
  });
});
