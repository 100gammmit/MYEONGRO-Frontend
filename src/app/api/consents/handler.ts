import type { ConsentDocumentType, ConsentStatus } from "@/domain/consent/consent-service";
import {
  createGuestSessionForNow,
  resolveSignedGuestSessionCookie,
  serializeGuestSessionCookie,
} from "@/infrastructure/auth/guest-identity";
import { z } from "zod";

const inputSchema = z.object({
  acceptedDocumentTypes: z.array(
    z.enum(["terms", "privacy", "sensitive-data"]),
  ),
}).strict();

type ConsentSubject = {
  subjectId: string;
  subjectType: "guest" | "user";
};

type GuestSubject = ConsentSubject & {
  setCookies?: string[];
};

interface ConsentRouteSharedDependencies {
  signingSecret: string;
  getUserId(): Promise<string | null>;
  now?(): Date;
  secureCookies?: boolean;
}

export interface ConsentGetRouteDependencies extends ConsentRouteSharedDependencies {
  getStatus(input: ConsentSubject): Promise<ConsentStatus>;
}

export interface ConsentPostRouteDependencies extends ConsentRouteSharedDependencies {
  acceptRequired(input: ConsentSubject & {
    acceptedDocumentTypes: ConsentDocumentType[];
  }): Promise<unknown>;
}

function resolveGuestSubject(
  request: Request,
  dependencies: ConsentRouteSharedDependencies,
  options: { allowCreate: boolean },
): GuestSubject | null {
  const resolved = resolveSignedGuestSessionCookie({
    cookieHeader: request.headers.get("cookie"),
    secret: dependencies.signingSecret,
    now: dependencies.now?.(),
    secure: dependencies.secureCookies ?? false,
  });
  if (resolved) {
    return {
      subjectId: resolved.session.sessionId,
      subjectType: "guest",
      setCookies: resolved.migrationCookies,
    };
  }

  if (!options.allowCreate) {
    return null;
  }

  const session = createGuestSessionForNow({
    secret: dependencies.signingSecret,
    now: dependencies.now?.(),
  });
  return {
    subjectId: session.sessionId,
    subjectType: "guest",
    setCookies: [
      serializeGuestSessionCookie(session, {
        secure: dependencies.secureCookies ?? false,
      }),
    ],
  };
}

function appendSetCookies(response: Response, cookies?: string[]): void {
  cookies?.forEach((cookie) => response.headers.append("set-cookie", cookie));
}

export function createConsentGetHandler(dependencies: ConsentGetRouteDependencies) {
  return async function GET(request: Request): Promise<Response> {
    const userId = await dependencies.getUserId();
    const subject = userId
      ? { subjectId: userId, subjectType: "user" as const }
      : resolveGuestSubject(request, dependencies, { allowCreate: true });

    if (!subject) {
      return Response.json({ error: "Guest session is required" }, { status: 400 });
    }

    const status = await dependencies.getStatus({
      subjectId: subject.subjectId,
      subjectType: subject.subjectType,
    });
    const response = Response.json({ status });
    appendSetCookies(response, subject.setCookies);
    return response;
  };
}

export function createConsentPostHandler(dependencies: ConsentPostRouteDependencies) {
  return async function POST(request: Request): Promise<Response> {
    try {
      const input = inputSchema.parse(await request.json());
      const userId = await dependencies.getUserId();
      const subject = userId
        ? { subjectId: userId, subjectType: "user" as const }
        : resolveGuestSubject(request, dependencies, { allowCreate: false });

      if (!subject) {
        return Response.json({ error: "Verified guest session is required" }, { status: 400 });
      }
      const consents = await dependencies.acceptRequired({
        subjectId: subject.subjectId,
        subjectType: subject.subjectType,
        acceptedDocumentTypes: input.acceptedDocumentTypes,
      });
      const response = Response.json({ consents });
      appendSetCookies(response, subject.setCookies);
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid consent request";
      return Response.json({ error: message }, { status: 400 });
    }
  };
}
