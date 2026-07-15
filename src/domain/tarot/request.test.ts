import { describe, expect, it } from "vitest";

import { createTarotReadingRequest } from "./request";

const requestId = "11111111-1111-4111-8111-111111111111";

describe("createTarotReadingRequest", () => {
  it("uses the daily fixed question and preserves selected card order", () => {
    expect(createTarotReadingRequest({
      spreadType: "daily_one_card",
      question: "ignored",
      requestId,
      cardIds: ["major-17-star"],
    })).toEqual({
      kind: "tarot",
      spreadType: "daily_one_card",
      question: "오늘 내가 살펴볼 마음과 작은 행동은 무엇인가요?",
      requestId,
      cardIds: ["major-17-star"],
    });
  });

  it("includes choiceOptions only for choice_five_card", () => {
    const cardIds = [
      "major-17-star",
      "major-00-fool",
      "major-21-world",
      "major-06-lovers",
      "major-09-hermit",
    ];

    const request = createTarotReadingRequest({
      spreadType: "choice_five_card",
      question: "  어느 방향을 준비할지 고민돼요.  ",
      choiceOptions: { a: " 현재를 유지한다 ", b: " 새로운 기회를 준비한다 " },
      requestId,
      cardIds,
    });

    expect(request).toEqual({
      kind: "tarot",
      spreadType: "choice_five_card",
      question: "어느 방향을 준비할지 고민돼요.",
      requestId,
      cardIds,
      choiceOptions: { a: "현재를 유지한다", b: "새로운 기회를 준비한다" },
    });
    expect(request.cardIds).toEqual(cardIds);
    expect(request).not.toHaveProperty("positions");
    expect(request).not.toHaveProperty("candidateSets");
    expect(request).not.toHaveProperty("schemaVersion");
  });

  it.each(["mind_three_card", "relationship_three_card"] as const)(
    "builds a %s request without choice-only fields",
    (spreadType) => {
      const cardIds = ["major-09-hermit", "major-00-fool", "major-17-star"];
      const request = createTarotReadingRequest({
        spreadType,
        question: "  지금 살펴볼 흐름이 궁금해요.  ",
        requestId,
        cardIds,
      });

      expect(request.spreadType).toBe(spreadType);
      expect(request.question).toBe("지금 살펴볼 흐름이 궁금해요.");
      expect(request.cardIds).toEqual(cardIds);
      expect(request).not.toHaveProperty("choiceOptions");
    },
  );

  it("rejects wrong card counts, duplicates, invalid questions, and equal choices", () => {
    expect(() => createTarotReadingRequest({
      spreadType: "mind_three_card",
      question: "질문",
      requestId,
      cardIds: ["major-00-fool"],
    })).toThrow("카드 수");

    expect(() => createTarotReadingRequest({
      spreadType: "mind_three_card",
      question: "질문",
      requestId,
      cardIds: ["major-00-fool", "major-00-fool", "major-01-magician"],
    })).toThrow("중복");

    expect(() => createTarotReadingRequest({
      spreadType: "relationship_three_card",
      question: " ",
      requestId,
      cardIds: ["major-00-fool", "major-01-magician", "major-02-high-priestess"],
    })).toThrow("질문");

    expect(() => createTarotReadingRequest({
      spreadType: "choice_five_card",
      question: "고민",
      choiceOptions: { a: "같은 선택", b: " 같은 선택 " },
      requestId,
      cardIds: [
        "major-00-fool",
        "major-01-magician",
        "major-02-high-priestess",
        "major-03-empress",
        "major-04-emperor",
      ],
    })).toThrow("달라야");
  });
});
