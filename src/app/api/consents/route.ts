import { ConsentService } from "@/domain/consent/consent-service";
import { requireAppSigningSecret } from "@/infrastructure/auth/guest-identity";
import { createAdminSupabaseClient } from "@/infrastructure/supabase/admin-client";
import { getAuthenticatedUserId } from "@/infrastructure/supabase/auth";
import { SupabaseConsentRepository } from "@/infrastructure/supabase/consent-repository";
import {
  createConsentGetHandler,
  createConsentPostHandler,
} from "./handler";

const consentVersions = {
  terms: "2026-06-10",
  privacy: "2026-06-10",
  "sensitive-data": "2026-06-10",
} as const;

function createConsentService(): ConsentService {
  return new ConsentService(
    new SupabaseConsentRepository(createAdminSupabaseClient()),
    consentVersions,
  );
}

function getSigningSecret(): string {
  return requireAppSigningSecret();
}

function shouldUseSecureCookies(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function GET(request: Request) {
  const service = createConsentService();
  return createConsentGetHandler({
    signingSecret: getSigningSecret(),
    getUserId: getAuthenticatedUserId,
    getStatus: (input) => service.getStatus(input),
    secureCookies: shouldUseSecureCookies(),
  })(request);
}

export async function POST(request: Request) {
  const service = createConsentService();
  return createConsentPostHandler({
    signingSecret: getSigningSecret(),
    getUserId: getAuthenticatedUserId,
    acceptRequired: (input) => service.acceptRequired(input),
    secureCookies: shouldUseSecureCookies(),
  })(request);
}
