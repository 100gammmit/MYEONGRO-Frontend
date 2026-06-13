import { describe, expect, it, vi } from "vitest";

import type {
  FreeReadingGenerationMeta,
  FreeReadingGenerator,
  FreeReadingRepository,
  PersistedFreeReading,
  SafeReadingFailureCode,
} from "./reading-service";
import {
  FreeReadingGenerationError,
  FreeReadingGenerationInProgressError,
  FreeReadingIdempotencyConflictError,
  FreeReadingService,
} from "./reading-service";

function createExistingReading(
  overrides: Partial<PersistedFreeReading> = {},
): PersistedFreeReading {
  return {
    id: "25596777-189c-4947-aa31-ff5f7c660fa9",
    owner: { userId: "52dd8653-b2dd-40db-b88f-e13887db53a8" },
    requestId: "75b64456-5f49-4e09-808d-161f73f546d9",
    inputHash: "hash-1",
    kind: "tarot",
    tier: "free",
    status: "completed",
    title: "Today",
    input: { kind: "tarot", question: "normalized question" },
    result: {
      title: "Today",
      summary: "Steady progress.",
      sections: [{ heading: "Focus", body: "Keep the rhythm." }],
      guidance: ["Stay consistent."],
      disclaimer: "For reflection only.",
    },
    errorCode: undefined,
    generation: {
      id: "83fb09ea-ddff-4831-9704-1dafc3266d70",
      provider: "demo",
      model: "deterministic-demo",
      promptVersion: "2026-06-12.v1",
      status: "completed",
      errorCode: undefined,
    },
    createdAt: "2026-06-12T00:00:00.000Z",
    updatedAt: "2026-06-12T00:00:01.000Z",
    ...overrides,
  };
}

class RepositoryDouble implements FreeReadingRepository {
  existing: PersistedFreeReading | null = null;
  createdResult:
    | { created: true; reading: PersistedFreeReading }
    | { created: false; reading: PersistedFreeReading }
    | null = null;
  completedResult: PersistedFreeReading | null = null;
  failedResult: PersistedFreeReading | null = null;

  findByOwnerAndRequestId = vi.fn(async () => this.existing);
  createPendingFreeReading = vi.fn(async () => {
    if (!this.createdResult) throw new Error("missing createdResult");
    return this.createdResult;
  });
  completeFreeReading = vi.fn(async () => {
    if (!this.completedResult) throw new Error("missing completedResult");
    return this.completedResult;
  });
  failFreeReading = vi.fn(async () => {
    if (!this.failedResult) throw new Error("missing failedResult");
    return this.failedResult;
  });
}

describe("FreeReadingService", () => {
  const generationMeta: FreeReadingGenerationMeta = {
    provider: "demo",
    model: "deterministic-demo",
    promptVersion: "2026-06-12.v1",
  };

  it("returns an existing reading when the same owner and request id reuse the same input hash", async () => {
    const repository = new RepositoryDouble();
    repository.existing = createExistingReading();
    const generator = {
      generate: vi.fn(),
    } satisfies FreeReadingGenerator;
    const service = new FreeReadingService(repository, generator, generationMeta);

    const result = await service.create({
      owner: { userId: "52dd8653-b2dd-40db-b88f-e13887db53a8" },
      requestId: "75b64456-5f49-4e09-808d-161f73f546d9",
      inputHash: "hash-1",
      ipHash: "ip-hash",
      kind: "tarot",
      input: { kind: "tarot", question: "normalized question" },
      generationInput: {
        kind: "tarot",
        tier: "free",
        locale: "ko-KR",
        question: "Will this work?",
        cards: [{ name: "The Star", position: "present", reversed: false }],
      },
    });

    expect(result).toEqual(repository.existing);
    expect(repository.createPendingFreeReading).not.toHaveBeenCalled();
    expect(generator.generate).not.toHaveBeenCalled();
  });

  it("does not return an incomplete reading while the same request is still generating", async () => {
    const repository = new RepositoryDouble();
    repository.existing = createExistingReading({
      status: "generating",
      result: undefined,
    });
    const service = new FreeReadingService(
      repository,
      { generate: vi.fn() },
      generationMeta,
    );

    await expect(service.create({
      owner: { userId: "52dd8653-b2dd-40db-b88f-e13887db53a8" },
      requestId: "75b64456-5f49-4e09-808d-161f73f546d9",
      inputHash: "hash-1",
      ipHash: "ip-hash",
      kind: "tarot",
      input: { kind: "tarot", question: "normalized question" },
      generationInput: {
        kind: "tarot",
        tier: "free",
        locale: "ko-KR",
        question: "Will this work?",
        cards: [{ name: "The Star", position: "present", reversed: false }],
      },
    })).rejects.toBeInstanceOf(FreeReadingGenerationInProgressError);
  });

  it("returns a sanitized generation error for an existing failed request", async () => {
    const repository = new RepositoryDouble();
    repository.existing = createExistingReading({
      status: "failed",
      result: undefined,
      errorCode: "generation_timeout",
    });
    const service = new FreeReadingService(
      repository,
      { generate: vi.fn() },
      generationMeta,
    );

    await expect(service.create({
      owner: { userId: "52dd8653-b2dd-40db-b88f-e13887db53a8" },
      requestId: "75b64456-5f49-4e09-808d-161f73f546d9",
      inputHash: "hash-1",
      ipHash: "ip-hash",
      kind: "tarot",
      input: { kind: "tarot", question: "normalized question" },
      generationInput: {
        kind: "tarot",
        tier: "free",
        locale: "ko-KR",
        question: "Will this work?",
        cards: [{ name: "The Star", position: "present", reversed: false }],
      },
    })).rejects.toEqual(expect.objectContaining({
      code: "generation_timeout",
    }));
  });

  it("throws an explicit idempotency conflict when the request id is reused with a different hash", async () => {
    const repository = new RepositoryDouble();
    repository.existing = createExistingReading({ inputHash: "other-hash" });
    const service = new FreeReadingService(
      repository,
      { generate: vi.fn() },
      generationMeta,
    );

    await expect(service.create({
      owner: { userId: "52dd8653-b2dd-40db-b88f-e13887db53a8" },
      requestId: "75b64456-5f49-4e09-808d-161f73f546d9",
      inputHash: "hash-1",
      ipHash: "ip-hash",
      kind: "tarot",
      input: { kind: "tarot", question: "normalized question" },
      generationInput: {
        kind: "tarot",
        tier: "free",
        locale: "ko-KR",
        question: "Will this work?",
        cards: [{ name: "The Star", position: "present", reversed: false }],
      },
    })).rejects.toBeInstanceOf(FreeReadingIdempotencyConflictError);

    expect(repository.createPendingFreeReading).not.toHaveBeenCalled();
  });

  it("creates a new generating reading, runs the generator, and marks it completed", async () => {
    const repository = new RepositoryDouble();
    repository.createdResult = {
      created: true,
      reading: createExistingReading({
        status: "generating",
        generation: {
          id: "83fb09ea-ddff-4831-9704-1dafc3266d70",
          provider: "demo",
          model: "deterministic-demo",
          promptVersion: "2026-06-12.v1",
          status: "pending",
          errorCode: undefined,
        },
        result: undefined,
      }),
    };
    repository.completedResult = createExistingReading();
    const generatorOutput = repository.completedResult.result!;
    const generator = {
      generate: vi.fn().mockResolvedValue(generatorOutput),
    } satisfies FreeReadingGenerator;
    const service = new FreeReadingService(repository, generator, generationMeta);

    const result = await service.create({
      owner: { guestSessionId: "2398493f-3c2b-43bc-bf93-cbef755ecfb7" },
      requestId: "75b64456-5f49-4e09-808d-161f73f546d9",
      inputHash: "hash-1",
      ipHash: "ip-hash",
      kind: "tarot",
      input: { kind: "tarot", question: "normalized question" },
      generationInput: {
        kind: "tarot",
        tier: "free",
        locale: "ko-KR",
        question: "Will this work?",
        cards: [{ name: "The Star", position: "present", reversed: false }],
      },
    });

    expect(repository.createPendingFreeReading).toHaveBeenCalledWith({
      owner: { guestSessionId: "2398493f-3c2b-43bc-bf93-cbef755ecfb7" },
      requestId: "75b64456-5f49-4e09-808d-161f73f546d9",
      inputHash: "hash-1",
      ipHash: "ip-hash",
      kind: "tarot",
      input: { kind: "tarot", question: "normalized question" },
      generation: generationMeta,
    });
    expect(generator.generate).toHaveBeenCalledWith({
      kind: "tarot",
      tier: "free",
      locale: "ko-KR",
      question: "Will this work?",
      cards: [{ name: "The Star", position: "present", reversed: false }],
    });
    expect(repository.completeFreeReading).toHaveBeenCalledWith({
      readingId: "25596777-189c-4947-aa31-ff5f7c660fa9",
      generationId: "83fb09ea-ddff-4831-9704-1dafc3266d70",
      result: generatorOutput,
    });
    expect(result).toEqual(repository.completedResult);
  });

  it("marks the reading failed and throws a sanitized error when generation fails", async () => {
    const repository = new RepositoryDouble();
    repository.createdResult = {
      created: true,
      reading: createExistingReading({
        status: "generating",
        generation: {
          id: "83fb09ea-ddff-4831-9704-1dafc3266d70",
          provider: "demo",
          model: "deterministic-demo",
          promptVersion: "2026-06-12.v1",
          status: "pending",
          errorCode: undefined,
        },
        result: undefined,
      }),
    };
    repository.failedResult = createExistingReading({
      status: "failed",
      result: undefined,
      errorCode: "generation_failed",
      generation: {
        id: "83fb09ea-ddff-4831-9704-1dafc3266d70",
        provider: "demo",
        model: "deterministic-demo",
        promptVersion: "2026-06-12.v1",
        status: "failed",
        errorCode: "generation_failed",
      },
    });
    const generator = {
      generate: vi.fn().mockRejectedValue(new Error("provider leaked secret detail")),
    } satisfies FreeReadingGenerator;
    const service = new FreeReadingService(repository, generator, generationMeta);

    const promise = service.create({
      owner: { userId: "52dd8653-b2dd-40db-b88f-e13887db53a8" },
      requestId: "75b64456-5f49-4e09-808d-161f73f546d9",
      inputHash: "hash-1",
      ipHash: "ip-hash",
      kind: "tarot",
      input: { kind: "tarot", question: "normalized question" },
      generationInput: {
        kind: "tarot",
        tier: "free",
        locale: "ko-KR",
        question: "Will this work?",
        cards: [{ name: "The Star", position: "present", reversed: false }],
      },
    });

    await expect(promise).rejects.toEqual(
      expect.objectContaining<Partial<FreeReadingGenerationError>>({
        code: "generation_failed",
        message: "Reading generation failed.",
      }),
    );
    await expect(promise).rejects.not.toThrow("provider leaked secret detail");
    expect(repository.failFreeReading).toHaveBeenCalledWith({
      readingId: "25596777-189c-4947-aa31-ff5f7c660fa9",
      generationId: "83fb09ea-ddff-4831-9704-1dafc3266d70",
      errorCode: "generation_failed" satisfies SafeReadingFailureCode,
    });
  });

  it("does not mark generation failed when only the completion transition fails", async () => {
    const repository = new RepositoryDouble();
    repository.createdResult = {
      created: true,
      reading: createExistingReading({
        status: "generating",
        result: undefined,
        generation: {
          ...createExistingReading().generation,
          status: "pending",
        },
      }),
    };
    repository.completeFreeReading.mockRejectedValueOnce(
      new Error("completion response was lost"),
    );
    const service = new FreeReadingService(
      repository,
      { generate: vi.fn().mockResolvedValue(createExistingReading().result) },
      generationMeta,
    );

    await expect(service.create({
      owner: { userId: "52dd8653-b2dd-40db-b88f-e13887db53a8" },
      requestId: "75b64456-5f49-4e09-808d-161f73f546d9",
      inputHash: "hash-1",
      ipHash: "ip-hash",
      kind: "tarot",
      input: { kind: "tarot", question: "normalized question" },
      generationInput: {
        kind: "tarot",
        tier: "free",
        locale: "ko-KR",
        question: "Will this work?",
        cards: [{ name: "The Star", position: "present", reversed: false }],
      },
    })).rejects.toThrow("completion response was lost");

    expect(repository.failFreeReading).not.toHaveBeenCalled();
  });

  it("returns the existing reading when the repository reports a same-hash duplicate insert race", async () => {
    const repository = new RepositoryDouble();
    repository.createdResult = {
      created: false,
      reading: createExistingReading(),
    };
    const generator = {
      generate: vi.fn(),
    } satisfies FreeReadingGenerator;
    const service = new FreeReadingService(repository, generator, generationMeta);

    const result = await service.create({
      owner: { userId: "52dd8653-b2dd-40db-b88f-e13887db53a8" },
      requestId: "75b64456-5f49-4e09-808d-161f73f546d9",
      inputHash: "hash-1",
      ipHash: "ip-hash",
      kind: "tarot",
      input: { kind: "tarot", question: "normalized question" },
      generationInput: {
        kind: "tarot",
        tier: "free",
        locale: "ko-KR",
        question: "Will this work?",
        cards: [{ name: "The Star", position: "present", reversed: false }],
      },
    });

    expect(result).toEqual(repository.createdResult.reading);
    expect(generator.generate).not.toHaveBeenCalled();
    expect(repository.completeFreeReading).not.toHaveBeenCalled();
  });
});
