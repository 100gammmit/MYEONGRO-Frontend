import { normalizeNextPath } from "@/infrastructure/auth/next-path";
import { toBackendUrl } from "@/infrastructure/backend/url";

export function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = normalizeNextPath(requestUrl.searchParams.get("next"));
  const loginUrl = new URL(toBackendUrl("/oauth2/authorization/kakao"));
  loginUrl.searchParams.set("next", next);

  return Response.redirect(loginUrl, 302);
}
