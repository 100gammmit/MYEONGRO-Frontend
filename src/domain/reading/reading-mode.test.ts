import { describe, expect, it } from "vitest";

import {
  parseReadingMode,
  readingModeHeadline,
  readingModeNotice,
  sajuReadingModeNotice,
  tarotPositionLabel,
} from "./reading-mode";

describe("reading mode", () => {
  it("keeps old records compatible and rejects unknown modes", () => {
    expect(parseReadingMode(undefined)).toBe("standard");
    expect(parseReadingMode("money_fortune")).toBe("money_fortune");
    expect(parseReadingMode("unknown")).toBeNull();
  });

  it("provides server-owned redirect copy and neutral choice labels", () => {
    expect(readingModeNotice("health_fortune")).toContain("운의 흐름을 읽어요");
    expect(tarotPositionLabel("money_fortune", "option_a", "선택 A"))
      .toBe("운을 돕는 요소");
    expect(tarotPositionLabel("health_fortune", "emotion", "지금의 감정"))
      .toBe("현재의 운");
    expect(tarotPositionLabel("career_life_fortune", "relationship_flow", "관계에서 드러난 흐름"))
      .toBe("이어지는 흐름");
    expect(tarotPositionLabel("standard", "option_a", "선택 A")).toBe("선택 A");
  });

  it("names the fortune a redirected reading focused on, and nothing for a standard one", () => {
    expect(readingModeHeadline("money_fortune")).toBe("금전운을 중심으로 읽었어요");
    expect(readingModeHeadline("career_life_fortune")).toBe("직업·생활운을 중심으로 읽었어요");
    expect(readingModeHeadline("standard")).toBeNull();
  });

  it("tells every fortune reading that a reading cannot make the decision", () => {
    for (const mode of ["health_fortune", "money_fortune", "relationship_fortune", "career_life_fortune"] as const) {
      expect(readingModeNotice(mode)).toContain("명로는 중대한 결정을 대신할 수 없어요.");
      expect(readingModeHeadline(mode)).not.toContain("바꿔");
    }
    expect(readingModeNotice("standard")).toBeNull();
  });

  it("distinguishes a redirected decision from an explicit fortune request in saju", () => {
    expect(sajuReadingModeNotice("career", "career_life_fortune", true))
      .toContain("중대한 결정을 대신할 수 없어요");
    expect(sajuReadingModeNotice("life_money", "money_fortune", false)).toBeNull();
    expect(sajuReadingModeNotice("career", "health_fortune", false))
      .toBe("일·진로를 관심 분야로 선택했지만, 질문 내용에 맞춰 건강운으로 바꿔 읽었어요.");
    expect(sajuReadingModeNotice("career", "health_fortune", true))
      .toBe("일·진로를 관심 분야로 선택했지만, 질문의 구체적인 결정은 대신하지 않고 건강운으로 바꿔 읽었어요.");
    expect(sajuReadingModeNotice("career", "standard", false)).toBeNull();
  });
});
