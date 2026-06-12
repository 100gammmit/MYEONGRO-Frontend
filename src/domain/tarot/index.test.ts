import { describe, expect, it } from "vitest";

import {
  MAJOR_ARCANA,
  TarotDomainError,
  createDemoInterpretation,
  createThreeCardSpread,
} from "./index";

describe("MAJOR_ARCANA", () => {
  it("defines all 22 Major Arcana cards with stable Korean-localized content", () => {
    expect(MAJOR_ARCANA).toHaveLength(22);
    expect(new Set(MAJOR_ARCANA.map((card) => card.id)).size).toBe(22);
    expect(MAJOR_ARCANA.map((card) => card.id)).toEqual([
      "major-00-fool",
      "major-01-magician",
      "major-02-high-priestess",
      "major-03-empress",
      "major-04-emperor",
      "major-05-hierophant",
      "major-06-lovers",
      "major-07-chariot",
      "major-08-strength",
      "major-09-hermit",
      "major-10-wheel-of-fortune",
      "major-11-justice",
      "major-12-hanged-man",
      "major-13-death",
      "major-14-temperance",
      "major-15-devil",
      "major-16-tower",
      "major-17-star",
      "major-18-moon",
      "major-19-sun",
      "major-20-judgement",
      "major-21-world",
    ]);

    for (const card of MAJOR_ARCANA) {
      expect(card.name).toMatch(/[가-힣]/);
      expect(card.keywords.length).toBeGreaterThanOrEqual(3);
      expect(card.keywords.every((keyword) => /[가-힣]/.test(keyword))).toBe(true);
      expect(card.uprightMeaning).toMatch(/[가-힣]/);
      expect(card.reversedMeaning).toMatch(/[가-힣]/);
    }
  });
});

describe("createThreeCardSpread", () => {
  it("assigns past, present, and guidance in choice order", () => {
    const spread = createThreeCardSpread([
      { cardId: "major-00-fool", reversed: false },
      { cardId: "major-10-wheel-of-fortune", reversed: true },
      { cardId: "major-21-world", reversed: false },
    ]);

    expect(spread.map(({ position, card, reversed }) => ({
      position,
      cardId: card.id,
      reversed,
    }))).toEqual([
      { position: "past", cardId: "major-00-fool", reversed: false },
      { position: "present", cardId: "major-10-wheel-of-fortune", reversed: true },
      { position: "guidance", cardId: "major-21-world", reversed: false },
    ]);
  });

  it("rejects a choice count other than exactly three", () => {
    expect(() =>
      createThreeCardSpread([
        { cardId: "major-00-fool", reversed: false },
        { cardId: "major-01-magician", reversed: false },
      ]),
    ).toThrowError(
      expect.objectContaining({
        name: "TarotDomainError",
        code: "INVALID_CARD_COUNT",
        message: expect.stringContaining("3장"),
      }),
    );
  });

  it("rejects duplicate card ids", () => {
    expect(() =>
      createThreeCardSpread([
        { cardId: "major-00-fool", reversed: false },
        { cardId: "major-00-fool", reversed: true },
        { cardId: "major-21-world", reversed: false },
      ]),
    ).toThrowError(
      expect.objectContaining({
        name: "TarotDomainError",
        code: "DUPLICATE_CARD",
        message: expect.stringContaining("major-00-fool"),
      }),
    );
  });

  it("rejects unknown card ids", () => {
    expect(() =>
      createThreeCardSpread([
        { cardId: "major-00-fool", reversed: false },
        { cardId: "major-01-magician", reversed: false },
        { cardId: "major-99-unknown", reversed: false },
      ]),
    ).toThrowError(
      expect.objectContaining({
        name: "TarotDomainError",
        code: "UNKNOWN_CARD",
        message: expect.stringContaining("major-99-unknown"),
      }),
    );
  });

  it("throws domain error instances", () => {
    expect(() => createThreeCardSpread([])).toThrow(TarotDomainError);
  });
});

describe("createDemoInterpretation", () => {
  it("returns a deterministic Korean interpretation using each card orientation", () => {
    const spread = createThreeCardSpread([
      { cardId: "major-00-fool", reversed: false },
      { cardId: "major-10-wheel-of-fortune", reversed: true },
      { cardId: "major-21-world", reversed: false },
    ]);

    const first = createDemoInterpretation(spread);
    const second = createDemoInterpretation(spread);

    expect(first).toEqual(second);
    expect(first.title).toMatch(/[가-힣]/);
    expect(first.overview).toMatch(/[가-힣]/);
    expect(first.cards).toHaveLength(3);
    expect(first.cards.map((card) => card.position)).toEqual([
      "past",
      "present",
      "guidance",
    ]);
    expect(first.cards[0].interpretation).toContain(
      spread[0].card.uprightMeaning,
    );
    expect(first.cards[1].interpretation).toContain(
      spread[1].card.reversedMeaning,
    );
    expect(first.cards[2].interpretation).toContain(
      spread[2].card.uprightMeaning,
    );
    expect(first.guidance).toMatch(/[가-힣]/);
    expect(first.disclaimer).toContain("오락");
    expect(first.disclaimer).toContain("결정");
  });
});
