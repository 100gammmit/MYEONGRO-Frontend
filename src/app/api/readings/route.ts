import { ConsentService } from "@/domain/consent/consent-service";
import { FreeReadingService } from "@/domain/readings/reading-service";
import { requireAppSigningSecret } from "@/infrastructure/auth/guest-identity";
import { BackendReadingRecordsClient } from "@/infrastructure/backend/reading-records-client";
import {
  getAuthenticatedAccessToken,
  getAuthenticatedUserId,
} from "@/infrastructure/supabase/auth";
import { createAdminSupabaseClient } from "@/infrastructure/supabase/admin-client";
import { SupabaseConsentRepository } from "@/infrastructure/supabase/consent-repository";
import { SupabaseReadingRepository } from "@/infrastructure/supabase/reading-repository";
import { createReadingPostHandler } from "./handler";
import { createReadingListHandler } from "./records-handler";
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
  const client = new BackendReadingRecordsClient();
  return createReadingListHandler({
    getUserId: getAuthenticatedUserId,
    listReadings: async () => {
      const accessToken = await getAuthenticatedAccessToken();
      if (!accessToken) throw new Error("Missing Supabase access token.");
      return client.list(accessToken);
    },
    getReading: async () => null,
    deleteReading: async () => false,
    retryReading: async () => {
      throw new Error("Unsupported");
    },
  })(request);
}
