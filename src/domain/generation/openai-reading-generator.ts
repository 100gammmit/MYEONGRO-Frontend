import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  readingGenerationOutputSchema,
  type ReadingGenerationInput,
  type ReadingGenerationOutput,
  type ReadingGenerator,
} from "./contracts";

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_TOKENS = 1_200;
const MAX_RETRIES = 2;
const STABLE_ERROR_CODE = "OPENAI_READING_GENERATION_FAILED";
const STABLE_ERROR_MESSAGE = "OpenAI reading generation failed";
const TIMEOUT_ERROR_CODE = "OPENAI_READING_TIMEOUT";
const TIMEOUT_ERROR_MESSAGE = "OpenAI reading generation timed out";

interface OpenAIModelConfig {
  free: string;
  paid: string;
}

interface OpenAIReadingGeneratorConfig {
  models: OpenAIModelConfig;
  client?: Pick<OpenAI, "responses">;
  apiKey?: string;
}

class OpenAIReadingGeneratorError extends Error {
  readonly code: typeof STABLE_ERROR_CODE | typeof TIMEOUT_ERROR_CODE;

  constructor(timeout = false) {
    super(timeout ? TIMEOUT_ERROR_MESSAGE : STABLE_ERROR_MESSAGE);
    this.name = "OpenAIReadingGeneratorError";
    this.code = timeout ? TIMEOUT_ERROR_CODE : STABLE_ERROR_CODE;
  }
}

export class OpenAIReadingGenerator implements ReadingGenerator {
  private readonly client: Pick<OpenAI, "responses">;
  private readonly models: OpenAIModelConfig;

  constructor(config: OpenAIReadingGeneratorConfig) {
    if (!config.client && !config.apiKey) {
      throw new Error("OpenAIReadingGenerator requires a client or apiKey");
    }

    this.client =
      config.client ??
      new OpenAI({
        apiKey: config.apiKey,
        timeout: REQUEST_TIMEOUT_MS,
        maxRetries: MAX_RETRIES,
      });
    this.models = config.models;
  }

  async generate(input: ReadingGenerationInput): Promise<ReadingGenerationOutput> {
    try {
      const response = await this.client.responses.parse(
        {
          model: input.tier === "free" ? this.models.free : this.models.paid,
          max_output_tokens: MAX_OUTPUT_TOKENS,
          instructions: [
            "You create Korean tarot and saju readings for entertainment and self-reflection.",
            "Never present predictions as certain facts.",
            "Do not provide medical, legal, investment, or crisis instructions.",
            "Return only the requested structured output.",
          ].join(" "),
          input: JSON.stringify(input),
          text: {
            format: zodTextFormat(
              readingGenerationOutputSchema,
              "fortune_reading",
            ),
          },
        },
        {
          timeout: REQUEST_TIMEOUT_MS,
          maxRetries: MAX_RETRIES,
        },
      );

      if (!response.output_parsed) {
        throw new OpenAIReadingGeneratorError();
      }

      return readingGenerationOutputSchema.parse(response.output_parsed);
    } catch (error) {
      if (error instanceof OpenAIReadingGeneratorError) {
        throw error;
      }

      const detail = error instanceof Error
        ? `${error.name} ${error.message}`.toLowerCase()
        : "";
      const timeout = detail.includes("timeout")
        || detail.includes("timed out")
        || detail.includes("abort");
      throw new OpenAIReadingGeneratorError(timeout);
    }
  }
}
