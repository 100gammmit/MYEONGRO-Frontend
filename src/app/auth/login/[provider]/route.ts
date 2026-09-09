import { normalizeNextPath } from "@/infrastructure/auth/next-path";
import { toBackendUrl } from "@/infrastructure/backend/url";

const SUPPORTED_PROVIDERS = new Set(["kakao", "google"]);

interface LoginRouteContext {
  params: Promise<{ provider: string }>;
}

export async function GET(request: Request, context: LoginRouteContext) {
  const { provider } = await context.params;
  if (!SUPPORTED_PROVIDERS.has(provider)) {
    return Response.json({ code: "UNSUPPORTED_OAUTH_PROVIDER" }, { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const next = normalizeNextPath(requestUrl.searchParams.get("next"));
  if (requestUrl.searchParams.get("adultEligibility") !== "confirmed") {
    const loginPageUrl = new URL("/login", requestUrl.origin);
    loginPageUrl.searchParams.set("next", next);
    loginPageUrl.searchParams.set("reason", "adult-eligibility-required");
    return Response.redirect(loginPageUrl, 303);
  }
  const loginUrl = new URL(toBackendUrl(`/oauth2/authorization/${provider}`));
  loginUrl.searchParams.set("next", next);
  loginUrl.searchParams.set("adultEligibility", "confirmed");

  return Response.redirect(loginUrl, 302);
}
