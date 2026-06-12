import { describe, expect, it, vi } from "vitest";
import type {
  ReadingGenerationInput,
  ReadingGenerationOutput,
  ReadingGenerator,
} from "./contracts";
import { SafeReadingGenerationService } from "./safe-reading-generation-service";

const input: ReadingGenerationInput = {
  kind: "tarot",
  tier: "free",
  locale: "ko-KR",
  question: "정확히 언제 죽을지 타로로 알려줘",
  cards: [{ name: "Death", position: "present", reversed: false }],
};

const providerOutput: ReadingGenerationOutput = {
  title: "일반 리딩",
  summary: "일반적인 결과입니다.",
  sections: [{ heading: "흐름", body: "상징을 살펴봅니다." }],
  guidance: ["차분히 생각해 보세요."],
  disclaimer: "참고용입니다.",
};

describe("SafeReadingGenerationService", () => {
  it("returns a safe response without calling the generator for high-risk input", async () => {
    const generate = vi.fn().mockResolvedValue(providerOutput);
    const service = new SafeReadingGenerationService({
      generate,
    } satisfies ReadingGenerator);

    const result = await service.generate(input);

    expect(generate).not.toHaveBeenCalled();
    expect(result.route).toBe("safety");
    expect(result.risk.category).toBe("death");
    expect(result.output.summary).toContain("확정");
  });

  it.each([
    ["암에 걸린 건가요?", "medical"],
    ["약 먹어도 되나요?", "medical"],
    ["임신했을까요?", "pregnancy"],
    ["이혼 소송을 할까요?", "legal"],
  ] as const)(
    "routes '%s' to %s safety without calling the generator",
    async (question, category) => {
      const generate = vi.fn().mockResolvedValue(providerOutput);
      const service = new SafeReadingGenerationService({
        generate,
      } satisfies ReadingGenerator);

      const result = await service.generate({ ...input, question });

      expect(generate).not.toHaveBeenCalled();
      expect(result.route).toBe("safety");
      expect(result.risk.category).toBe(category);
    },
  );

  it("calls the generator for an ordinary fortune question", async () => {
    const generate = vi.fn().mockResolvedValue(providerOutput);
    const service = new SafeReadingGenerationService({
      generate,
    } satisfies ReadingGenerator);

    const result = await service.generate({
      ...input,
      question: "올해 건강운의 전반적인 흐름이 궁금해요.",
    });

    expect(generate).toHaveBeenCalledOnce();
    expect(result).toEqual({
      route: "generated",
      risk: { highRisk: false, category: null },
      output: providerOutput,
    });
  });

  it("calls the generator for a benign stalking-prevention campaign question", async () => {
    const generate = vi.fn().mockResolvedValue(providerOutput);
    const service = new SafeReadingGenerationService({
      generate,
    } satisfies ReadingGenerator);

    const result = await service.generate({
      ...input,
      question: "스토킹 예방 캠페인의 운세가 궁금해요",
    });

    expect(generate).toHaveBeenCalledOnce();
    expect(result.route).toBe("generated");
  });
});
