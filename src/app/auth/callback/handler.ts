import { normalizeNextPath } from "@/infrastructure/auth/next-path";
import {
  resolveSignedGuestSessionCookie,
  serializeExpiredGuestSessionCookie,
  serializeExpiredLegacyGuestSessionCookie,
} from "@/infrastructure/auth/guest-identity";

interface AuthCallbackDependencies {
  signingSecret: string;
  exchangeCodeForSession(code: string): Promise<{ userId: string }>;
  transferGuestOwnership(guestSessionId: string, userId: string): Promise<unknown>;
  now?(): Date;
  secureCookies?: boolean;
}

function createRedirectResponse(url: URL): Response {
  return new Response(null, {
    status: 307,
    headers: {
      location: url.toString(),
    },
  });
}

function appendGuestTransferFailure(next: string, origin: string): URL {
  const redirectUrl = new URL(next, origin);
  redirectUrl.searchParams.set("guestTransfer", "failed");
  return redirectUrl;
}

export function createAuthCallbackHandler(
  dependencies: AuthCallbackDependencies,
) {
  return async function GET(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const next = normalizeNextPath(url.searchParams.get("next"));

    if (!code) {
      return createRedirectResponse(
        new URL("/login?error=missing_code", url.origin),
      );
    }

    try {
      const { userId } = await dependencies.exchangeCodeForSession(code);
      const redirectUrl = new URL(next, url.origin);
      const resolvedGuest = resolveSignedGuestSessionCookie({
        cookieHeader: request.headers.get("cookie"),
        secret: dependencies.signingSecret,
        now: dependencies.now?.(),
        secure: dependencies.secureCookies ?? false,
      });
      if (!resolvedGuest) {
        return createRedirectResponse(redirectUrl);
      }

      try {
        await dependencies.transferGuestOwnership(
          resolvedGuest.session.sessionId,
          userId,
        );
        const response = createRedirectResponse(redirectUrl);
        response.headers.append(
          "set-cookie",
          serializeExpiredGuestSessionCookie({
            secure: dependencies.secureCookies ?? false,
          }),
        );
        response.headers.append(
          "set-cookie",
          serializeExpiredLegacyGuestSessionCookie({
            secure: dependencies.secureCookies ?? false,
          }),
        );
        return response;
      } catch {
        return createRedirectResponse(appendGuestTransferFailure(next, url.origin));
      }
    } catch {
      return createRedirectResponse(
        new URL("/login?error=oauth_failed", url.origin),
      );
    }
  };
}
