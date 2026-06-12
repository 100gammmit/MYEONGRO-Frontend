import type { ReadingGenerationInput, ReadingGenerationOutput } from "../generation/contracts";
import type { ReadingKind } from "./types";

export type ReadingOwner =
  | { userId: string; guestSessionId?: never }
  | { guestSessionId: string; userId?: never };

export type PersistedFreeReadingStatus = "generating" | "completed" | "failed";
export type PersistedGenerationStatus = "pending" | "completed" | "failed";
export type SafeReadingFailureCode = "generation_failed" | "generation_timeout";

export interface FreeReadingGenerationMeta {
  provider: string;
  model: string;
  promptVersion: string;
}

export interface PersistedFreeReadingGeneration extends FreeReadingGenerationMeta {
  id: string;
  status: PersistedGenerationStatus;
  errorCode?: SafeReadingFailureCode;
}

export interface PersistedFreeReading {
  id: string;
  owner: ReadingOwner;
  requestId: string;
  inputHash: string;
  kind: ReadingKind;
  tier: "free";
  status: PersistedFreeReadingStatus;
  input: Record<string, unknown>;
  result?: ReadingGenerationOutput;
  errorCode?: SafeReadingFailureCode;
  generation: PersistedFreeReadingGeneration;
  createdAt: string;
  updatedAt: string;
}

export interface FreeReadingCreateInput {
  owner: ReadingOwner;
  requestId: string;
  inputHash: string;
  ipHash: string;
  kind: ReadingKind;
  input: Record<string, unknown>;
  generationInput: ReadingGenerationInput;
}

export interface FreeReadingRepositoryCreateInput {
  owner: ReadingOwner;
  requestId: string;
  inputHash: string;
  ipHash: string;
  kind: ReadingKind;
  input: Record<string, unknown>;
  generation: FreeReadingGenerationMeta;
}

export interface FreeReadingRepository {
  findByOwnerAndRequestId(
    owner: ReadingOwner,
    requestId: string,
  ): Promise<PersistedFreeReading | null>;
  createPendingFreeReading(
    input: FreeReadingRepositoryCreateInput,
  ): Promise<
    | { created: true; reading: PersistedFreeReading }
    | { created: false; reading: PersistedFreeReading }
  >;
  completeFreeReading(input: {
    readingId: string;
    generationId: string;
    result: ReadingGenerationOutput;
  }): Promise<PersistedFreeReading>;
  failFreeReading(input: {
    readingId: string;
    generationId: string;
    errorCode: SafeReadingFailureCode;
  }): Promise<PersistedFreeReading>;
}

export interface FreeReadingGenerator {
  generate(input: ReadingGenerationInput): Promise<ReadingGenerationOutput>;
}

export class FreeReadingIdempotencyConflictError extends Error {
  constructor() {
    super("Request ID was already used for a different reading input.");
    this.name = "FreeReadingIdempotencyConflictError";
  }
}

export class FreeReadingGenerationError extends Error {
  constructor(readonly code: SafeReadingFailureCode) {
    super(
      code === "generation_timeout"
        ? "Reading generation timed out."
        : "Reading generation failed.",
    );
    this.name = "FreeReadingGenerationError";
  }
}

export class FreeReadingGenerationInProgressError extends Error {
  readonly code = "GENERATION_IN_PROGRESS";

  constructor() {
    super("Reading generation is already in progress.");
    this.name = "FreeReadingGenerationInProgressError";
  }
}

export class FreeReadingQuotaExceededError extends Error {
  readonly code = "FREE_READING_QUOTA_EXCEEDED";

  constructor() {
    super("Free reading quota exceeded.");
    this.name = "FreeReadingQuotaExceededError";
  }
}

export class FreeReadingService {
  constructor(
    private readonly repository: FreeReadingRepository,
    private readonly generator: FreeReadingGenerator,
    private readonly generation: FreeReadingGenerationMeta,
  ) {}

  async create(input: FreeReadingCreateInput): Promise<PersistedFreeReading> {
    assertExactlyOneOwner(input.owner);

    const existing = await this.repository.findByOwnerAndRequestId(input.owner, input.requestId);
    if (existing) {
      this.assertMatchingHash(existing.inputHash, input.inputHash);
      return this.resolveExisting(existing);
    }

    const created = await this.repository.createPendingFreeReading({
      owner: input.owner,
      requestId: input.requestId,
      inputHash: input.inputHash,
      ipHash: input.ipHash,
      kind: input.kind,
      input: input.input,
      generation: this.generation,
    });
    if (!created.created) {
      this.assertMatchingHash(created.reading.inputHash, input.inputHash);
      return this.resolveExisting(created.reading);
    }

    let result: ReadingGenerationOutput;
    try {
      result = await this.generator.generate(input.generationInput);
    } catch (error) {
      const errorCode = toSafeFailureCode(error);
      await this.repository.failFreeReading({
        readingId: created.reading.id,
        generationId: created.reading.generation.id,
        errorCode,
      });
      throw new FreeReadingGenerationError(errorCode);
    }

    return this.repository.completeFreeReading({
      readingId: created.reading.id,
      generationId: created.reading.generation.id,
      result,
    });
  }

  private assertMatchingHash(existingHash: string, nextHash: string): void {
    if (existingHash !== nextHash) throw new FreeReadingIdempotencyConflictError();
  }

  private resolveExisting(reading: PersistedFreeReading): PersistedFreeReading {
    if (reading.status === "completed" && reading.result) return reading;
    if (reading.status === "generating") {
      throw new FreeReadingGenerationInProgressError();
    }
    throw new FreeReadingGenerationError(
      reading.errorCode ?? "generation_failed",
    );
  }
}

function assertExactlyOneOwner(owner: ReadingOwner): void {
  const subjectCount = Number(Boolean(owner.userId)) + Number(Boolean(owner.guestSessionId));
  if (subjectCount !== 1) {
    throw new Error("Exactly one reading owner is required.");
  }
}

function toSafeFailureCode(error: unknown): SafeReadingFailureCode {
  if (!(error instanceof Error)) return "generation_failed";
  const detail = `${error.name} ${error.message}`.toLowerCase();
  if (
    detail.includes("timeout")
    || detail.includes("timed out")
    || detail.includes("abort")
  ) {
    return "generation_timeout";
  }
  return "generation_failed";
}
