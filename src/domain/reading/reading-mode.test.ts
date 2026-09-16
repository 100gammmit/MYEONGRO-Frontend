import { describe, expect, it } from "vitest";

import {
  parseReadingMode,
  redirectedReadingNotice,
  sajuReadingModeNotice,
  tarotPositionLabel,
} from "./reading-mode";

const REDIRECT_BODY = "중대한 결정이 걸린 질문은 명로가 대신 답할 수 없어요. 결정은 직접 내려 주시고, 리딩은 흐름만 참고해 주세요.";

describe("reading mode", () => {
  it("keeps old records compatible and rejects unknown modes", () => {
    expect(parseReadingMode(undefined)).toBe("standard");
    expect(parseReadingMode("money_fortune")).toBe("money_fortune");
    expect(parseReadingMode("unknown")).toBeNull();
  });

  it("provides neutral choice labels for fortune readings", () => {
    expect(tarotPositionLabel("money_fortune", "option_a", "선택 A"))
      .toBe("운을 돕는 요소");
    expect(tarotPositionLabel("health_fortune", "emotion", "지금의 감정"))
      .toBe("현재의 운");
    expect(tarotPositionLabel("career_life_fortune", "relationship_flow", "관계에서 드러난 흐름"))
      .toBe("이어지는 흐름");
    expect(tarotPositionLabel("standard", "option_a", "선택 A")).toBe("선택 A");
  });

  it("explains a redirected decision question for every fortune, and nothing for an explicit request", () => {
    expect(redirectedReadingNotice("money_fortune", true)).toEqual({
      headline: "질문 대신 금전운을 읽었어요",
      body: REDIRECT_BODY,
    });
    for (const mode of ["health_fortune", "money_fortune", "relationship_fortune", "career_life_fortune"] as const) {
      expect(redirectedReadingNotice(mode, true)?.body).toBe(REDIRECT_BODY);
      expect(redirectedReadingNotice(mode, false)).toBeNull();
    }
    expect(redirectedReadingNotice("standard", false)).toBeNull();
  });

  it("puts the redirect notice first in saju and otherwise explains only a focus mismatch", () => {
    expect(sajuReadingModeNotice("career", "career_life_fortune", true)?.headline)
      .toBe("질문 대신 직업·생활운을 읽었어요");
    expect(sajuReadingModeNotice("career", "health_fortune", true)).toEqual({
      headline: "질문 대신 건강운을 읽었어요",
      body: REDIRECT_BODY,
    });
    expect(sajuReadingModeNotice("career", "health_fortune", false)).toEqual({
      headline: "건강운을 중심으로 읽었어요",
      body: "일·진로를 관심 분야로 선택했지만, 질문 내용에 맞춰 건강운으로 읽었어요.",
    });
    expect(sajuReadingModeNotice("life_money", "money_fortune", false)).toBeNull();
    expect(sajuReadingModeNotice("career", "standard", false)).toBeNull();
  });

  it.each([
    ["self", "나의 성향을"],
    ["career", "일·진로를"],
    ["relationship", "관계를"],
    ["life_money", "재정·생활을"],
  ] as const)("uses the right object particle after the %s focus label", (focusArea, phrase) => {
    expect(sajuReadingModeNotice(focusArea, "health_fortune", false)?.body)
      .toContain(`${phrase} 관심 분야로 선택했지만`);
  });
});
