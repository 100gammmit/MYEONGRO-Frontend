import { describe, expect, it } from "vitest";

import { createTarotReadingRequest } from "./request";

const requestId = "11111111-1111-4111-8111-111111111111";

describe("createTarotReadingRequest", () => {
  it("uses the daily fixed question and submits only the completed draw session", () => {
    expect(createTarotReadingRequest({
      spreadType: "daily_one_card",
      question: "ignored",
      requestId,
      drawSessionId: "draw-session-1",
    })).toEqual({
      kind: "tarot",
      spreadType: "daily_one_card",
      question: "오늘 내가 살펴볼 마음과 작은 행동은 무엇인가요?",
      requestId,
      drawSessionId: "draw-session-1",
    });
  });

  it("includes choiceOptions only for choice_five_card", () => {
    const request = createTarotReadingRequest({
      spreadType: "choice_five_card",
      question: "  어느 방향을 준비할지 고민돼요.  ",
      choiceOptions: { a: " 현재를 유지한다 ", b: " 새로운 기회를 준비한다 " },
      requestId,
      drawSessionId: "draw-session-choice",
    });

    expect(request).toEqual({
      kind: "tarot",
      spreadType: "choice_five_card",
      question: "어느 방향을 준비할지 고민돼요.",
      requestId,
      drawSessionId: "draw-session-choice",
      choiceOptions: { a: "현재를 유지한다", b: "새로운 기회를 준비한다" },
    });
    expect(request).not.toHaveProperty("cardIds");
    expect(request).not.toHaveProperty("candidateToken");
    expect(request).not.toHaveProperty("position");
    expect(request).not.toHaveProperty("positions");
    expect(request).not.toHaveProperty("candidateSets");
    expect(request).not.toHaveProperty("schemaVersion");
  });

  it.each(["mind_three_card", "relationship_three_card"] as const)(
    "builds a %s request without choice-only fields",
    (spreadType) => {
      const request = createTarotReadingRequest({
        spreadType,
        question: "  지금 살펴볼 흐름이 궁금해요.  ",
        requestId,
        drawSessionId: `draw-${spreadType}`,
      });

      expect(request.spreadType).toBe(spreadType);
      expect(request.question).toBe("지금 살펴볼 흐름이 궁금해요.");
      expect(request.drawSessionId).toBe(`draw-${spreadType}`);
      expect(request).not.toHaveProperty("cardIds");
      expect(request).not.toHaveProperty("choiceOptions");
    },
  );

  it("rejects an empty draw session, invalid questions, and equal choices", () => {
    expect(() => createTarotReadingRequest({
      spreadType: "mind_three_card",
      question: "질문",
      requestId,
      drawSessionId: " ",
    })).toThrow("추첨 세션");

    expect(() => createTarotReadingRequest({
      spreadType: "relationship_three_card",
      question: " ",
      requestId,
      drawSessionId: "draw-session-1",
    })).toThrow("질문");

    expect(() => createTarotReadingRequest({
      spreadType: "choice_five_card",
      question: "고민",
      choiceOptions: { a: "같은 선택", b: " 같은 선택 " },
      requestId,
      drawSessionId: "draw-session-1",
    })).toThrow("달라야");
  });
});
