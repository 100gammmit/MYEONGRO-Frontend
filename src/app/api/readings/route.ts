import { ConsentService } from "@/domain/consent/consent-service";
import type { ReadingGenerator } from "@/domain/generation/contracts";
import { DemoReadingGenerator } from "@/domain/generation/demo-reading-generator";
import { OpenAIReadingGenerator } from "@/domain/generation/openai-reading-generator";
import { SafeReadingGenerationService } from "@/domain/generation/safe-reading-generation-service";
import { FreeReadingService } from "@/domain/readings/reading-service";
import { requireAppSigningSecret } from "@/infrastructure/auth/guest-identity";
import { getAuthenticatedUserId } from "@/infrastructure/supabase/auth";
import { createAdminSupabaseClient } from "@/infrastructure/supabase/admin-client";
import { SupabaseConsentRepository } from "@/infrastructure/supabase/consent-repository";
import { SupabaseReadingRepository } from "@/infrastructure/supabase/reading-repository";
import { createReadingPostHandler } from "./handler";

const consentVersions = {
  terms: "2026-06-10",
  privacy: "2026-06-10",
  "sensitive-data": "2026-06-10",
} as const;

const promptVersion = "2026-06-12.v1";

function createBaseGenerator(): {
  generator: ReadingGenerator;
  provider: string;
  model: string;
} {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_FREE_MODEL || "gpt-5.4-mini";

  if (apiKey) {
    return {
      generator: new OpenAIReadingGenerator({
        apiKey,
        models: {
          free: model,
          paid: process.env.OPENAI_PAID_MODEL || "gpt-5.4",
        },
      }),
      provider: "openai",
      model,
    };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      generator: new DemoReadingGenerator(),
      provider: "demo",
      model: "deterministic-demo",
    };
  }

  return {
    generator: {
      async generate() {
        throw new Error("Reading provider is unavailable");
      },
    },
    provider: "unavailable",
    model: "unavailable",
  };
}

export async function POST(request: Request) {
  const admin = createAdminSupabaseClient();
  const consentService = new ConsentService(
    new SupabaseConsentRepository(admin),
    consentVersions,
  );

  return createReadingPostHandler({
    signingSecret: requireAppSigningSecret(),
    secureCookies: process.env.NODE_ENV === "production",
    getUserId: getAuthenticatedUserId,
    hasRequiredConsent: async (owner) => {
      const subject = owner.userId
        ? { subjectId: owner.userId, subjectType: "user" as const }
        : { subjectId: owner.guestSessionId!, subjectType: "guest" as const };
      const status = await consentService.getStatus(subject);
      return status.hasAcceptedRequired;
    },
    createReading: async (input) => {
      const base = createBaseGenerator();
      const safeGenerator = new SafeReadingGenerationService(base.generator);
      const service = new FreeReadingService(
        new SupabaseReadingRepository(admin),
        {
          generate: async (generationInput) =>
            (await safeGenerator.generate(generationInput)).output,
        },
        {
          provider: base.provider,
          model: base.model,
          promptVersion,
        },
      );

      return service.create({
        owner: input.owner,
        requestId: input.requestId,
        inputHash: input.inputHash,
        ipHash: input.ipHash,
        kind: input.kind,
        input: input.storageInput,
        generationInput: input.generationInput,
      });
    },
  })(request);
}
