import { resolveSignedGuestSessionCookie } from "@/infrastructure/auth/guest-identity";
import {
  hashReadingInput,
  hashRequestIp,
} from "@/infrastructure/security/reading-hash";
import type { PersistedFreeReading } from "@/domain/readings/reading-service";
import { parseFreeReadingRequest } from "./input";

export type ReadingOwner =
  | { userId: string; guestSessionId?: never }
  | { guestSessionId: string; userId?: never };

export interface CreateFreeReadingInput {
  owner: ReadingOwner;
  requestId: string;
  inputHash: string;
  ipHash: string;
  kind: "tarot" | "saju";
  storageInput: Record<string, unknown>;
  generationInput: ReturnType<typeof parseFreeReadingRequest>["generationInput"];
}

interface ReadingPostDependencies {
  signingSecret: string;
  getUserId(): Promise<string | null>;
  hasRequiredConsent(owner: ReadingOwner): Promise<boolean>;
  createReading(input: CreateFreeReadingInput): Promise<PersistedFreeReading>;
  now?(): Date;
  secureCookies?: boolean;
}

async function resolveOwner(
  request: Request,
  dependencies: ReadingPostDependencies,
): Promise<{ owner: ReadingOwner; migrationCookies: string[] } | null> {
  const userId = await dependencies.getUserId();
  if (userId) return { owner: { userId }, migrationCookies: [] };

  const resolved = resolveSignedGuestSessionCookie({
    cookieHeader: request.headers.get("cookie"),
    secret: dependencies.signingSecret,
    now: dependencies.now?.(),
    secure: dependencies.secureCookies ?? false,
  });
  return resolved
    ? {
        owner: { guestSessionId: resolved.session.sessionId },
        migrationCookies: resolved.migrationCookies,
      }
    : null;
}

function appendSetCookies(response: Response, cookies: string[]): Response {
  cookies.forEach((cookie) => response.headers.append("set-cookie", cookie));
  return response;
}

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("name" in error && error.name === "FreeReadingIdempotencyConflictError") {
    return "IDEMPOTENCY_CONFLICT";
  }
  if ("code" in error && typeof error.code === "string") {
    if (error.code === "GENERATION_IN_PROGRESS") {
      return "GENERATION_IN_PROGRESS";
    }
    if (["generation_failed", "generation_timeout"].includes(error.code)) {
      return "GENERATION_FAILED";
    }
    if (
      ["OPENAI_READING_GENERATION_FAILED", "OPENAI_READING_TIMEOUT"].includes(
        error.code,
      )
    ) {
      return "GENERATION_FAILED";
    }
    return error.code;
  }
  return undefined;
}

function errorResponse(code: string | undefined): Response {
  if (code === "IDEMPOTENCY_CONFLICT") {
    return Response.json(
      {
        code: "IDEMPOTENCY_CONFLICT",
        message: "같은 요청 ID에 다른 입력을 사용할 수 없습니다.",
      },
      { status: 409 },
    );
  }
  if (code === "FREE_READING_QUOTA_EXCEEDED") {
    return Response.json(
      {
        code: "FREE_READING_QUOTA_EXCEEDED",
        message: "무료 리딩 이용 한도를 초과했습니다.",
      },
      { status: 429 },
    );
  }
  if (code === "GENERATION_IN_PROGRESS") {
    return Response.json(
      {
        code: "GENERATION_IN_PROGRESS",
        message: "리딩을 생성하고 있습니다. 잠시 후 다시 확인해 주세요.",
      },
      { status: 409 },
    );
  }
  if (code === "GENERATION_FAILED") {
    return Response.json(
      {
        code: "GENERATION_FAILED",
        message: "리딩 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 502 },
    );
  }
  return Response.json(
    {
      code: "READING_REQUEST_FAILED",
      message: "리딩 요청을 처리하지 못했습니다.",
    },
    { status: 500 },
  );
}

export function createReadingPostHandler(dependencies: ReadingPostDependencies) {
  return async function POST(request: Request): Promise<Response> {
    let parsed: ReturnType<typeof parseFreeReadingRequest>;
    let migrationCookies: string[] = [];
    try {
      parsed = parseFreeReadingRequest(await request.json());
    } catch {
      return Response.json(
        { code: "INVALID_READING_REQUEST", message: "잘못된 리딩 요청입니다." },
        { status: 400 },
      );
    }

    try {
      const resolvedOwner = await resolveOwner(request, dependencies);
      if (!resolvedOwner) {
        return Response.json(
          {
            code: "UNAUTHENTICATED",
            message: "로그인 또는 게스트 세션이 필요합니다.",
          },
          { status: 401 },
        );
      }
      const { owner } = resolvedOwner;
      migrationCookies = resolvedOwner.migrationCookies;
      if (!await dependencies.hasRequiredConsent(owner)) {
        return Response.json(
          { code: "REQUIRED_CONSENT_MISSING", message: "필수 동의가 필요합니다." },
          { status: 403 },
        );
      }

      const reading = await dependencies.createReading({
        owner,
        requestId: parsed.requestId,
        inputHash: hashReadingInput(parsed.storageInput),
        ipHash: hashRequestIp(request, dependencies.signingSecret),
        kind: parsed.kind,
        storageInput: parsed.storageInput,
        generationInput: parsed.generationInput,
      });

      return appendSetCookies(
        Response.json({ reading: toPublicReading(reading) }),
        migrationCookies,
      );
    } catch (error) {
      return appendSetCookies(
        errorResponse(getErrorCode(error)),
        migrationCookies,
      );
    }
  };
}

function toPublicReading(reading: PersistedFreeReading) {
  return {
    id: reading.id,
    kind: reading.kind,
    status: reading.status,
    input: reading.input,
    result: reading.result,
    errorCode: reading.errorCode,
    createdAt: reading.createdAt,
    updatedAt: reading.updatedAt,
  };
}
