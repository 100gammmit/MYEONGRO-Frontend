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
    expect(tarotPositionLabel("standard", "option_a", "선택 A")).toBe("선택 A");
  });
});
