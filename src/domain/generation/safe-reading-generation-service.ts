import {
  classifyKoreanHighRisk,
  type RiskAssessment,
} from "../safety/korean-risk-classifier";
import { buildSafeResponse } from "../safety/safe-response-builder";
import type {
  ReadingGenerationInput,
  ReadingGenerationOutput,
  ReadingGenerator,
} from "./contracts";

export interface SafeReadingGenerationResult {
  route: "generated" | "safety";
  risk: RiskAssessment;
  output: ReadingGenerationOutput;
}

export class SafeReadingGenerationService {
  constructor(private readonly generator: ReadingGenerator) {}

  async generate(
    input: ReadingGenerationInput,
  ): Promise<SafeReadingGenerationResult> {
    const risk = classifyKoreanHighRisk(input.question);

    if (risk.highRisk) {
      return {
        route: "safety",
        risk,
        output: buildSafeResponse(risk.category),
      };
    }

    return {
      route: "generated",
      risk,
      output: await this.generator.generate(input),
    };
  }
}
