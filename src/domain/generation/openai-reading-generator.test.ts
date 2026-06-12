import type OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { describe, expect, it, vi } from "vitest";
import {
  readingGenerationOutputSchema,
  type ReadingGenerationInput,
  type ReadingGenerationOutput,
} from "./contracts";
import { OpenAIReadingGenerator } from "./openai-reading-generator";

const parsedOutput: ReadingGenerationOutput = {
  title: "구조화된 리딩",
  summary: "현재 상황을 균형 있게 살펴보세요.",
  sections: [{ heading: "흐름", body: "변화의 가능성이 보입니다." }],
  guidance: ["현실적인 정보를 함께 확인하세요."],
  disclaimer: "오락과 자기성찰을 위한 참고 자료입니다.",
};

function tarotInput(
  tier: ReadingGenerationInput["tier"],
): ReadingGenerationInput {
  const base = {
    kind: "tarot" as const,
    locale: "ko-KR",
    question: "앞으로의 흐름은 어떤가요?",
    cards: [{ name: "The Star", position: "guidance", reversed: false }],
  };

  return tier === "followup"
    ? {
        ...base,
        tier,
        previousReading: {
          title: "이전 리딩",
          summary: "새로운 가능성을 살펴보세요.",
        },
      }
    : { ...base, tier };
}

function createGenerator() {
  const parse = vi.fn().mockResolvedValue({ output_parsed: parsedOutput });
  const client = {
    responses: { parse },
  } as unknown as Pick<OpenAI, "responses">;

  return {
    parse,
    generator: new OpenAIReadingGenerator({
      client,
      models: {
        free: "free-model",
        paid: "paid-model",
      },
    }),
  };
}

describe("OpenAIReadingGenerator", () => {
  it("uses the configured free model for free readings", async () => {
    const { generator, parse } = createGenerator();

    const output = await generator.generate(tarotInput("free"));

    expect(output).toEqual(parsedOutput);
    expect(parse).toHaveBeenCalledWith(
      expect.objectContaining({ model: "free-model" }),
      expect.objectContaining({
        timeout: 30_000,
        maxRetries: 2,
      }),
    );
  });

  it.each(["paid", "followup"] as const)(
    "uses the configured paid model for %s readings",
    async (tier) => {
      const { generator, parse } = createGenerator();

      await generator.generate(tarotInput(tier));

      expect(parse).toHaveBeenCalledWith(
        expect.objectContaining({ model: "paid-model" }),
        expect.objectContaining({
          timeout: 30_000,
          maxRetries: 2,
        }),
      );
    },
  );

  it("sends the structured output format and request limits to OpenAI", async () => {
    const { generator, parse } = createGenerator();

    await generator.generate(tarotInput("free"));

    expect(parse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "free-model",
        max_output_tokens: 1200,
        text: {
          format: zodTextFormat(readingGenerationOutputSchema, "fortune_reading"),
        },
      }),
      expect.objectContaining({
        timeout: 30_000,
        maxRetries: 2,
      }),
    );
  });

  it("rejects a provider response without parsed structured output", async () => {
    const parse = vi.fn().mockResolvedValue({ output_parsed: null });
    const client = {
      responses: { parse },
    } as unknown as Pick<OpenAI, "responses">;
    const generator = new OpenAIReadingGenerator({
      client,
      models: { free: "free-model", paid: "paid-model" },
    });

    await expect(generator.generate(tarotInput("free"))).rejects.toMatchObject({
      code: "OPENAI_READING_GENERATION_FAILED",
      message: "OpenAI reading generation failed",
    });
  });

  it("hides raw provider errors behind a stable generator error", async () => {
    const parse = vi.fn().mockRejectedValue(
      new Error("429 rate limit from OpenAI: please retry later"),
    );
    const client = {
      responses: { parse },
    } as unknown as Pick<OpenAI, "responses">;
    const generator = new OpenAIReadingGenerator({
      client,
      models: { free: "free-model", paid: "paid-model" },
    });

    await expect(generator.generate(tarotInput("free"))).rejects.toMatchObject({
      code: "OPENAI_READING_GENERATION_FAILED",
      message: "OpenAI reading generation failed",
    });
  });

  it("preserves only the timeout category for SDK timeout errors", async () => {
    const parse = vi.fn().mockRejectedValue(
      Object.assign(new Error("Request timed out after internal provider details"), {
        name: "APIConnectionTimeoutError",
      }),
    );
    const client = {
      responses: { parse },
    } as unknown as Pick<OpenAI, "responses">;
    const generator = new OpenAIReadingGenerator({
      client,
      models: { free: "free-model", paid: "paid-model" },
    });

    await expect(generator.generate(tarotInput("free"))).rejects.toMatchObject({
      code: "OPENAI_READING_TIMEOUT",
      message: "OpenAI reading generation timed out",
    });
    await expect(generator.generate(tarotInput("free"))).rejects.not.toThrow(
      "internal provider details",
    );
  });
});
