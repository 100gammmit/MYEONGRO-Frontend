import { ConsentService } from "@/domain/consent/consent-service";
import { FreeReadingService } from "@/domain/readings/reading-service";
import { requireAppSigningSecret } from "@/infrastructure/auth/guest-identity";
import { getAuthenticatedUserId } from "@/infrastructure/supabase/auth";
import { createAdminSupabaseClient } from "@/infrastructure/supabase/admin-client";
import { SupabaseConsentRepository } from "@/infrastructure/supabase/consent-repository";
import { SupabaseReadingRepository } from "@/infrastructure/supabase/reading-repository";
import { createReadingPostHandler } from "./handler";
import { createReadingListHandler, toPublicReadingRecord } from "./records-handler";
import { createReadingRuntime } from "./runtime";

const consentVersions = {
  terms: "2026-06-10",
  privacy: "2026-06-10",
  "sensitive-data": "2026-06-10",
} as const;

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
      const runtime = createReadingRuntime();
      const service = new FreeReadingService(
        new SupabaseReadingRepository(admin),
        {
          generate: async (generationInput) =>
            (await runtime.generator.generate(generationInput)).output,
        },
        runtime.generation,
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

export async function GET(request: Request) {
  const repository = new SupabaseReadingRepository(createAdminSupabaseClient());
  return createReadingListHandler({
    getUserId: getAuthenticatedUserId,
    listReadings: async (userId) =>
      (await repository.listByUser(userId)).map(toPublicReadingRecord),
    getReading: async () => null,
    deleteReading: async () => false,
    retryReading: async () => {
      throw new Error("Unsupported");
    },
  })(request);
}
