import { describe, expect, it } from "vitest";

import { parseReadingMode, readingModeNotice, tarotPositionLabel } from "./reading-mode";

describe("reading mode", () => {
  it("keeps old records compatible and rejects unknown modes", () => {
    expect(parseReadingMode(undefined)).toBe("standard");
    expect(parseReadingMode("money_fortune")).toBe("money_fortune");
    expect(parseReadingMode("unknown")).toBeNull();
  });

  it("provides server-owned redirect copy and neutral choice labels", () => {
    expect(readingModeNotice("health_fortune")).toContain("건강운");
    expect(tarotPositionLabel("money_fortune", "option_a", "선택 A"))
      .toBe("운을 돕는 요소");
    expect(tarotPositionLabel("health_fortune", "emotion", "지금의 감정"))
      .toBe("현재의 운");
    expect(tarotPositionLabel("career_life_fortune", "relationship_flow", "관계에서 드러난 흐름"))
      .toBe("이어지는 흐름");
    expect(tarotPositionLabel("standard", "option_a", "선택 A")).toBe("선택 A");
  });
});
