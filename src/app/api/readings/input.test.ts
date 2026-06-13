import { describe, expect, it } from "vitest";

import {
  parseFreeReadingRequest,
  restoreGenerationInput,
} from "./input";

const requestId = "11111111-1111-4111-8111-111111111111";

describe("parseFreeReadingRequest", () => {
  it("accepts exactly three distinct canonical tarot card ids", () => {
    const parsed = parseFreeReadingRequest({
      kind: "tarot",
      question: "새로운 일을 시작해도 좋을까요?",
      requestId,
      cardIds: [
        "major-00-fool",
        "major-17-star",
        "major-21-world",
      ],
    });

    expect(parsed.kind).toBe("tarot");
    if (parsed.kind === "tarot") {
      expect(parsed.spread.map(({ card, position }) => ({
        id: card.id,
        position,
      }))).toEqual([
        { id: "major-00-fool", position: "past" },
        { id: "major-17-star", position: "present" },
        { id: "major-21-world", position: "guidance" },
      ]);
    }
  });

  it.each([
    ["duplicate cards", ["major-00-fool", "major-00-fool", "major-21-world"]],
    ["unknown card", ["major-00-fool", "major-17-star", "major-99-unknown"]],
    ["too few cards", ["major-00-fool", "major-17-star"]],
  ])("rejects %s", (_case, cardIds) => {
    expect(() =>
      parseFreeReadingRequest({
        kind: "tarot",
        question: "질문입니다.",
        requestId,
        cardIds,
      }),
    ).toThrow();
  });

  it("calculates saju pillars from solar birth input on the server", () => {
    const parsed = parseFreeReadingRequest({
      kind: "saju",
      question: "올해 일의 흐름이 궁금해요.",
      requestId,
      birthDate: "2024-02-10",
      birthTime: "23:05",
      gender: "female",
    });

    expect(parsed.kind).toBe("saju");
    if (parsed.kind === "saju") {
      expect(parsed.profile.calendarType).toBe("solar");
      expect(parsed.profile.pillars).toEqual({
        year: expect.any(String),
        month: expect.any(String),
        day: expect.any(String),
        hour: expect.any(String),
      });
    }
  });

  it.each([
    { tier: "paid" },
    { model: "gpt-5.4" },
    { pillars: { year: "甲子", month: "甲子", day: "甲子", hour: "甲子" } },
    { calendarType: "lunar" },
  ])("rejects server-owned or unsupported fields: %o", (extra) => {
    expect(() =>
      parseFreeReadingRequest({
        kind: "saju",
        question: "질문입니다.",
        requestId,
        birthDate: "2024-02-10",
        gender: "unspecified",
        ...extra,
      }),
    ).toThrow();
  });

  it("rejects questions longer than 300 characters", () => {
    expect(() =>
      parseFreeReadingRequest({
        kind: "tarot",
        question: "가".repeat(301),
        requestId,
        cardIds: [
          "major-00-fool",
          "major-17-star",
          "major-21-world",
        ],
      }),
    ).toThrow();
  });
});

describe("restoreGenerationInput", () => {
  it("restores canonical tarot cards from persisted card ids", () => {
    const input = restoreGenerationInput("tarot", {
      question: "관계의 흐름이 궁금해요.",
      cards: [
        { cardId: "major-00-fool", position: "past", reversed: false },
        { cardId: "major-17-star", position: "present", reversed: false },
        { cardId: "major-21-world", position: "guidance", reversed: false },
      ],
    });

    expect(input).toMatchObject({
      kind: "tarot",
      tier: "free",
      question: "관계의 흐름이 궁금해요.",
      cards: [
        { name: "바보", position: "past", reversed: false },
        { name: "별", position: "present", reversed: false },
        { name: "세계", position: "guidance", reversed: false },
      ],
    });
  });

  it("restores the server-calculated saju profile without recalculation", () => {
    const profile = {
      calendarType: "solar" as const,
      birthDate: "1995-04-21",
      birthTime: "14:30",
      gender: "female" as const,
      pillars: {
        year: "乙亥",
        month: "庚辰",
        day: "壬午",
        hour: "丁未",
      },
    };

    expect(restoreGenerationInput("saju", {
      question: "올해의 흐름이 궁금해요.",
      profile,
    })).toEqual({
      kind: "saju",
      tier: "free",
      locale: "ko-KR",
      question: "올해의 흐름이 궁금해요.",
      profile,
    });
  });

  it("rejects malformed persisted input", () => {
    expect(() => restoreGenerationInput("tarot", {
      question: "질문",
      cards: [{ cardId: "unknown" }],
    })).toThrow();
  });
});
