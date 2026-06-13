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
  return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
}

function notFoundResponse(): Response {
  return Response.json({ error: "리딩을 찾을 수 없습니다." }, { status: 404 });
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
    } catch {
      return Response.json(
        { error: "재시도할 수 없는 리딩입니다." },
        { status: 409 },
      );
    }
  };
}
