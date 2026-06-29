import { normalizeNextPath } from "@/infrastructure/auth/next-path";
import { toBackendUrl } from "@/infrastructure/backend/url";

const SUPPORTED_PROVIDERS = new Set(["kakao", "google"]);

interface LoginRouteContext {
  params: Promise<{ provider: string }> | { provider: string };
}

export async function GET(request: Request, context: LoginRouteContext) {
  const { provider } = await context.params;
  if (!SUPPORTED_PROVIDERS.has(provider)) {
    return Response.json({ code: "UNSUPPORTED_OAUTH_PROVIDER" }, { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const next = normalizeNextPath(requestUrl.searchParams.get("next"));
  const loginUrl = new URL(toBackendUrl(`/oauth2/authorization/${provider}`));
  loginUrl.searchParams.set("next", next);

  return Response.redirect(loginUrl, 302);
}
