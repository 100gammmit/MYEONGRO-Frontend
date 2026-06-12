import { describe, expect, it, vi } from "vitest";

import {
  FreeReadingIdempotencyConflictError,
  type FreeReadingRepositoryCreateInput,
} from "@/domain/readings/reading-service";
import { SupabaseReadingRepository } from "./reading-repository";

const readingId = "25596777-189c-4947-aa31-ff5f7c660fa9";
const generationId = "83fb09ea-ddff-4831-9704-1dafc3266d70";
const requestId = "75b64456-5f49-4e09-808d-161f73f546d9";
const userId = "52dd8653-b2dd-40db-b88f-e13887db53a8";

function row(status: "generating" | "completed" | "failed" = "generating") {
  return {
    id: readingId,
    user_id: userId,
    guest_session_id: null,
    request_id: requestId,
    input_hash: "hash-1",
    kind: "tarot",
    tier: "free",
    status,
    input: { question: "normalized question" },
    result: status === "completed" ? {
      title: "Today",
      summary: "Steady progress.",
      sections: [{ heading: "Focus", body: "Keep the rhythm." }],
      guidance: ["Stay consistent."],
      disclaimer: "For reflection only.",
    } : null,
    created_at: "2026-06-12T00:00:00.000Z",
    updated_at: "2026-06-12T00:00:01.000Z",
    generation_records: [{
      id: generationId,
      provider: "demo",
      model: "deterministic-demo",
      prompt_version: "2026-06-12.v1",
      status: status === "generating" ? "pending" : status,
      error_code: status === "failed" ? "generation_failed" : null,
    }],
  };
}

class QueryStub {
  result: { data: unknown; error: null | { message: string; code?: string } } = {
    data: row(),
    error: null,
  };

  select = vi.fn(() => this);
  eq = vi.fn(() => this);
  is = vi.fn(() => this);
  maybeSingle = vi.fn(async () => this.result);
}

function input(): FreeReadingRepositoryCreateInput {
  return {
    owner: { userId },
    requestId,
    inputHash: "hash-1",
    ipHash: "ip-hash",
    kind: "tarot",
    input: { question: "normalized question" },
    generation: {
      provider: "demo",
      model: "deterministic-demo",
      promptVersion: "2026-06-12.v1",
    },
  };
}

function clientWith(
  rpcResult: { data: unknown; error: null | { message: string; code?: string } },
  query = new QueryStub(),
) {
  return {
    query,
    client: {
      rpc: vi.fn(async () => rpcResult),
      from: vi.fn((table: string) => {
        expect(table).toBe("readings");
        return query;
      }),
    },
  };
}

describe("SupabaseReadingRepository", () => {
  it("creates pending state through one atomic RPC and re-reads it", async () => {
    const { client } = clientWith({
      data: [{ reading_id: readingId, generation_id: generationId, created: true }],
      error: null,
    });
    const repository = new SupabaseReadingRepository(client as never);

    const result = await repository.createPendingFreeReading(input());

    expect(client.rpc).toHaveBeenCalledWith("create_pending_free_reading", {
      requested_user_id: userId,
      requested_guest_session_id: null,
      requested_ip_hash: "ip-hash",
      requested_request_id: requestId,
      requested_input_hash: "hash-1",
      requested_kind: "tarot",
      requested_input: { question: "normalized question" },
      requested_provider: "demo",
      requested_model: "deterministic-demo",
      requested_prompt_version: "2026-06-12.v1",
    });
    expect(result).toEqual({
      created: true,
      reading: expect.objectContaining({
        id: readingId,
        status: "generating",
        generation: expect.objectContaining({ id: generationId, status: "pending" }),
      }),
    });
  });

  it.each([
    ["RL101", "FREE_READING_QUOTA_EXCEEDED"],
    ["RL104", "IDEMPOTENCY_CONFLICT"],
  ])("maps database error %s to %s", async (databaseCode, applicationCode) => {
    const { client } = clientWith({
      data: null,
      error: { message: "internal database detail", code: databaseCode },
    });
    const repository = new SupabaseReadingRepository(client as never);

    const promise = repository.createPendingFreeReading(input());

    if (applicationCode === "IDEMPOTENCY_CONFLICT") {
      await expect(promise).rejects.toBeInstanceOf(
        FreeReadingIdempotencyConflictError,
      );
    } else {
      await expect(promise).rejects.toMatchObject({ code: applicationCode });
    }
  });

  it("completes reading and generation in one transition RPC", async () => {
    const query = new QueryStub();
    query.result = { data: row("completed"), error: null };
    const { client } = clientWith({ data: null, error: null }, query);
    const repository = new SupabaseReadingRepository(client as never);
    const result = row("completed").result!;

    const reading = await repository.completeFreeReading({
      readingId,
      generationId,
      result,
    });

    expect(client.rpc).toHaveBeenCalledWith(
      "complete_free_reading_generation",
      {
        requested_reading_id: readingId,
        requested_generation_id: generationId,
        requested_title: "Today",
        requested_result: result,
      },
    );
    expect(reading.status).toBe("completed");
    expect(reading.generation.status).toBe("completed");
  });

  it("fails reading and generation in one transition RPC", async () => {
    const query = new QueryStub();
    query.result = { data: row("failed"), error: null };
    const { client } = clientWith({ data: null, error: null }, query);
    const repository = new SupabaseReadingRepository(client as never);

    const reading = await repository.failFreeReading({
      readingId,
      generationId,
      errorCode: "generation_failed",
    });

    expect(client.rpc).toHaveBeenCalledWith("fail_free_reading_generation", {
      requested_reading_id: readingId,
      requested_generation_id: generationId,
      requested_error_code: "generation_failed",
    });
    expect(reading.status).toBe("failed");
    expect(reading.generation.status).toBe("failed");
  });

  it("excludes soft-deleted rows from owner/request lookups", async () => {
    const { client, query } = clientWith({ data: null, error: null });
    const repository = new SupabaseReadingRepository(client as never);

    await repository.findByOwnerAndRequestId({ userId }, requestId);

    expect(query.is).toHaveBeenCalledWith("deleted_at", null);
  });
});
