import type { ReadingGenerator } from "@/domain/generation/contracts";
import { DemoReadingGenerator } from "@/domain/generation/demo-reading-generator";
import { OpenAIReadingGenerator } from "@/domain/generation/openai-reading-generator";
import { SafeReadingGenerationService } from "@/domain/generation/safe-reading-generation-service";
import type { FreeReadingGenerationMeta } from "@/domain/readings/reading-service";

const promptVersion = "2026-06-12.v1";

export function createReadingRuntime(): {
  generator: SafeReadingGenerationService;
  generation: FreeReadingGenerationMeta;
} {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_FREE_MODEL || "gpt-5.4-mini";

  let generator: ReadingGenerator;
  let provider: string;
  let runtimeModel: string;

  if (apiKey) {
    generator = new OpenAIReadingGenerator({
      apiKey,
      model,
    });
    provider = "openai";
    runtimeModel = model;
  } else if (process.env.NODE_ENV !== "production") {
    generator = new DemoReadingGenerator();
    provider = "demo";
    runtimeModel = "deterministic-demo";
  } else {
    generator = {
      async generate() {
        throw new Error("Reading provider is unavailable");
      },
    };
    provider = "unavailable";
    runtimeModel = "unavailable";
  }

  return {
    generator: new SafeReadingGenerationService(generator),
    generation: {
      provider,
      model: runtimeModel,
      promptVersion,
    },
  };
}
