import { describe, expect, it } from "vitest";

import { createTarotReadingRequest } from "./request";

const requestId = "11111111-1111-4111-8111-111111111111";

describe("createTarotReadingRequest", () => {
  it("uses the daily fixed question and submits one selected slot", () => {
    expect(createTarotReadingRequest({
      spreadType: "daily_one_card",
      question: "ignored",
      requestId,
      selectedSlots: [4],
    })).toEqual({
      kind: "tarot",
      spreadType: "daily_one_card",
      question: "오늘 내가 살펴볼 마음과 작은 행동은 무엇인가요?",
      requestId,
      selectedSlots: [4],
    });
  });

  it("includes choiceOptions only for choice_five_card", () => {
    const request = createTarotReadingRequest({
      spreadType: "choice_five_card",
      question: "  어느 방향을 준비할지 고민돼요.  ",
      choiceOptions: { a: " 현재를 유지한다 ", b: " 새로운 기회를 준비한다 " },
      requestId,
      selectedSlots: [2, 5, 1, 4, 3],
    });

    expect(request).toEqual({
      kind: "tarot",
      spreadType: "choice_five_card",
      question: "어느 방향을 준비할지 고민돼요.",
      requestId,
      selectedSlots: [2, 5, 1, 4, 3],
      choiceOptions: { a: "현재를 유지한다", b: "새로운 기회를 준비한다" },
    });
    expect(request).not.toHaveProperty("drawSessionId");
    expect(request).not.toHaveProperty("cardIds");
    expect(request).not.toHaveProperty("candidateToken");
    expect(request).not.toHaveProperty("position");
    expect(request).not.toHaveProperty("candidateSets");
    expect(request).not.toHaveProperty("schemaVersion");
  });

  it.each(["mind_three_card", "relationship_three_card"] as const)(
    "preserves the selected slot order for %s",
    (spreadType) => {
      const request = createTarotReadingRequest({
        spreadType,
        question: "  지금 살펴볼 흐름이 궁금해요.  ",
        requestId,
        selectedSlots: [5, 1, 3],
      });

      expect(request.selectedSlots).toEqual([5, 1, 3]);
      expect(request.question).toBe("지금 살펴볼 흐름이 궁금해요.");
      expect(request).not.toHaveProperty("choiceOptions");
    },
  );

  it("rejects missing, wrong-length, non-integer, and out-of-range slots", () => {
    for (const selectedSlots of [[], [1], [1, 2.5, 3], [0, 1, 6]]) {
      expect(() => createTarotReadingRequest({
        spreadType: "mind_three_card",
        question: "질문",
        requestId,
        selectedSlots,
      })).toThrow("카드 선택 번호");
    }
  });

  it("rejects invalid questions and equal choices", () => {
    expect(() => createTarotReadingRequest({
      spreadType: "relationship_three_card",
      question: " ",
      requestId,
      selectedSlots: [1, 2, 3],
    })).toThrow("질문");

    expect(() => createTarotReadingRequest({
      spreadType: "choice_five_card",
      question: "고민",
      choiceOptions: { a: "같은 선택", b: " 같은 선택 " },
      requestId,
      selectedSlots: [1, 2, 3, 4, 5],
    })).toThrow("달라야");
  });
});
