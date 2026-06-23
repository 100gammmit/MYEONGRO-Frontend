import { normalizeNextPath } from "@/infrastructure/auth/next-path";

interface AuthCallbackDependencies {
  signingSecret: string;
  exchangeCodeForSession(code: string): Promise<{ userId: string }>;
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
      await dependencies.exchangeCodeForSession(code);
      const redirectUrl = new URL(next, url.origin);
      return createRedirectResponse(redirectUrl);
    } catch {
      return createRedirectResponse(
        new URL("/login?error=oauth_failed", url.origin),
      );
    }
  };
}
