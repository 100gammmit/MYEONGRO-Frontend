import type { ReadingGenerationOutput } from "@/domain/generation/contracts";
import type { PersistedFreeReadingStatus } from "@/domain/readings/reading-service";
import type { ReadingKind } from "@/domain/readings/types";

export interface PublicReadingRecord {
  id: string;
  kind: ReadingKind;
  status: PersistedFreeReadingStatus;
  title: string;
  input: Record<string, unknown>;
  result?: ReadingGenerationOutput;
  errorCode?: string;
  createdAt: string;
  updatedAt: string;
}

export function toPublicReadingRecord(
  reading: {
    id: string;
    kind: ReadingKind;
    status: PersistedFreeReadingStatus;
    title: string;
    input: Record<string, unknown>;
    result?: ReadingGenerationOutput;
    errorCode?: string;
    createdAt: string;
    updatedAt: string;
  },
): PublicReadingRecord {
  return {
    id: reading.id,
    kind: reading.kind,
    status: reading.status,
    title: reading.title,
    input: reading.input,
    result: reading.result,
    errorCode: reading.errorCode,
    createdAt: reading.createdAt,
    updatedAt: reading.updatedAt,
  };
}

interface ReadingRecordsDependencies {
  getUserId(): Promise<string | null>;
  listReadings(userId: string): Promise<PublicReadingRecord[]>;
  getReading(userId: string, readingId: string): Promise<PublicReadingRecord | null>;
  deleteReading(userId: string, readingId: string): Promise<boolean>;
  retryReading(userId: string, readingId: string): Promise<PublicReadingRecord>;
}

type ReadingRouteContext = {
  params: Promise<{ readingId: string }>;
};

function unauthorizedResponse(): Response {
  return Response.json(
    { code: "UNAUTHENTICATED", message: "로그인이 필요합니다." },
    { status: 401 },
  );
}

function notFoundResponse(): Response {
  return Response.json(
    { code: "READING_NOT_FOUND", message: "리딩을 찾을 수 없습니다." },
    { status: 404 },
  );
}

function isBackendStatusError(error: unknown): error is {
  status: number;
  body: unknown;
} {
  return typeof error === "object"
    && error !== null
    && "status" in error
    && typeof (error as { status: unknown }).status === "number";
}

function backendErrorResponse(error: { status: number; body: unknown }): Response {
  const body = typeof error.body === "object" && error.body !== null
    ? error.body
    : {
        code: "READING_RECORDS_REQUEST_FAILED",
        message: "리딩 기록 요청을 처리하지 못했습니다.",
      };
  return Response.json(body, { status: error.status });
}

export function createReadingListHandler(
  dependencies: ReadingRecordsDependencies,
) {
  return async function GET(request: Request): Promise<Response> {
    void request;
    const userId = await dependencies.getUserId();
    if (!userId) return unauthorizedResponse();

    const items = await dependencies.listReadings(userId);
    return Response.json({ items });
  };
}

export function createReadingDetailHandler(
  dependencies: ReadingRecordsDependencies,
) {
  return async function GET(
    _request: Request,
    context: ReadingRouteContext,
  ): Promise<Response> {
    const userId = await dependencies.getUserId();
    if (!userId) return unauthorizedResponse();

    const { readingId } = await context.params;
    const reading = await dependencies.getReading(userId, readingId);
    return reading ? Response.json({ reading }) : notFoundResponse();
  };
}

export function createReadingDeleteHandler(
  dependencies: ReadingRecordsDependencies,
) {
  return async function DELETE(
    _request: Request,
    context: ReadingRouteContext,
  ): Promise<Response> {
    const userId = await dependencies.getUserId();
    if (!userId) return unauthorizedResponse();

    const { readingId } = await context.params;
    const deleted = await dependencies.deleteReading(userId, readingId);
    return deleted
      ? new Response(null, { status: 204 })
      : notFoundResponse();
  };
}

export function createReadingRetryHandler(
  dependencies: ReadingRecordsDependencies,
) {
  return async function POST(
    _request: Request,
    context: ReadingRouteContext,
  ): Promise<Response> {
    const userId = await dependencies.getUserId();
    if (!userId) return unauthorizedResponse();

    const { readingId } = await context.params;
    try {
      const reading = await dependencies.retryReading(userId, readingId);
      return Response.json({ reading });
    } catch (error) {
      if (isBackendStatusError(error)) {
        return backendErrorResponse(error);
      }
      return Response.json(
        {
          code: "READING_RETRY_NOT_ALLOWED",
          message: "재시도할 수 없는 리딩입니다.",
        },
        { status: 409 },
      );
    }
  };
}
