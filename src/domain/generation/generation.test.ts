import { describe, expect, it } from "vitest";
import { DemoReadingGenerator } from "./demo-reading-generator";
import {
  readingGenerationOutputSchema,
  type ReadingGenerationInput,
} from "./contracts";

const tarotInput: ReadingGenerationInput = {
  kind: "tarot",
  tier: "free",
  locale: "ko-KR",
  question: "올해 새로운 일을 시작해도 좋을까요?",
  cards: [
    { name: "The Fool", position: "present", reversed: false },
    { name: "The Star", position: "guidance", reversed: false },
  ],
};

describe("readingGenerationOutputSchema", () => {
  it("parses a complete provider-independent reading", () => {
    const result = readingGenerationOutputSchema.parse({
      title: "새로운 흐름을 위한 리딩",
      summary: "가능성을 살피되 현실적인 준비를 함께 해보세요.",
      sections: [
        {
          heading: "현재의 흐름",
          body: "새로운 출발에 대한 기대가 커지는 시기입니다.",
        },
      ],
      guidance: ["작은 실험부터 시작해 보세요."],
      disclaimer: "이 리딩은 오락과 자기성찰을 위한 참고 자료입니다.",
    });

    expect(result.sections[0]?.heading).toBe("현재의 흐름");
  });

  it("rejects incomplete or unexpected provider output", () => {
    expect(() =>
      readingGenerationOutputSchema.parse({
        title: "불완전한 응답",
        summary: "필수 항목이 없습니다.",
        sections: [],
        guidance: [],
        disclaimer: "참고용입니다.",
        predictionDate: "2026-12-31",
      }),
    ).toThrow();
  });
});

describe("DemoReadingGenerator", () => {
  it("returns the structured reading shape without a provider", async () => {
    const output = await new DemoReadingGenerator().generate(tarotInput);

    expect(readingGenerationOutputSchema.parse(output)).toEqual(output);
    expect(output.title).toContain("데모");
    expect(output.sections.length).toBeGreaterThan(0);
    expect(output.guidance.length).toBeGreaterThan(0);
  });

  it("returns readable Korean copy for the local demo", async () => {
    const output = await new DemoReadingGenerator().generate({
      kind: "tarot",
      tier: "free",
      locale: "ko-KR",
      question: "이 관계의 흐름이 궁금해요",
      cards: [{ name: "별", position: "guidance", reversed: false }],
    });

    expect(output.title).toContain("타로");
    expect(output.title).toContain("간단");
    expect(output.summary).toContain("선택");
    expect(output.disclaimer).toMatch(/자기\s?성찰/);
  });
});
