import { requireAppSigningSecret } from "@/infrastructure/auth/guest-identity";
import { createServerSupabaseClient } from "@/infrastructure/supabase/server-client";
import { createAuthCallbackHandler } from "./handler";

function getSigningSecret(): string {
  return requireAppSigningSecret();
}

function shouldUseSecureCookies(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function GET(request: Request) {
  return createAuthCallbackHandler({
    signingSecret: getSigningSecret(),
    exchangeCodeForSession: async (code) => {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) {
        throw new Error("OAuth exchange did not return a user");
      }
      return { userId };
    },
    secureCookies: shouldUseSecureCookies(),
  })(request);
}
