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
    title: "Today",
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
  order = vi.fn(() => this);
  update = vi.fn(() => this);
  maybeSingle = vi.fn(async () => this.result);
  then = (
    resolve: (value: typeof this.result) => unknown,
  ) => Promise.resolve(this.result).then(resolve);
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

  it("lists only active readings owned by the authenticated user", async () => {
    const query = new QueryStub();
    query.result = { data: [row("completed")], error: null };
    const { client } = clientWith({ data: null, error: null }, query);
    const repository = new SupabaseReadingRepository(client as never);

    const readings = await repository.listByUser(userId);

    expect(query.eq).toHaveBeenCalledWith("user_id", userId);
    expect(query.is).toHaveBeenCalledWith("deleted_at", null);
    expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(readings).toHaveLength(1);
    expect(readings[0]).toMatchObject({ id: readingId, status: "completed" });
  });

  it("returns null for a missing or foreign reading", async () => {
    const query = new QueryStub();
    query.result = { data: null, error: null };
    const { client } = clientWith({ data: null, error: null }, query);
    const repository = new SupabaseReadingRepository(client as never);

    const reading = await repository.findByUserAndId(userId, "foreign");

    expect(query.eq).toHaveBeenCalledWith("user_id", userId);
    expect(query.eq).toHaveBeenCalledWith("id", "foreign");
    expect(query.is).toHaveBeenCalledWith("deleted_at", null);
    expect(reading).toBeNull();
  });

  it("soft deletes only an active reading owned by the user", async () => {
    const query = new QueryStub();
    query.result = { data: { id: readingId }, error: null };
    const { client } = clientWith({ data: null, error: null }, query);
    const repository = new SupabaseReadingRepository(client as never);

    const deleted = await repository.softDeleteByUserAndId(userId, readingId);

    expect(query.update).toHaveBeenCalledWith({
      deleted_at: expect.any(String),
    });
    expect(query.eq).toHaveBeenCalledWith("user_id", userId);
    expect(query.eq).toHaveBeenCalledWith("id", readingId);
    expect(query.is).toHaveBeenCalledWith("deleted_at", null);
    expect(deleted).toBe(true);
  });

  it("starts a failed reading retry through an owner-scoped atomic RPC", async () => {
    const query = new QueryStub();
    query.result = { data: row("generating"), error: null };
    const { client } = clientWith({
      data: [{ generation_id: generationId }],
      error: null,
    }, query);
    const repository = new SupabaseReadingRepository(client as never);

    const reading = await repository.startFailedRetry(userId, readingId, {
      provider: "openai",
      model: "gpt-test",
      promptVersion: "2026-06-13.v1",
    });

    expect(client.rpc).toHaveBeenCalledWith("start_failed_reading_retry", {
      requested_user_id: userId,
      requested_reading_id: readingId,
      requested_provider: "openai",
      requested_model: "gpt-test",
      requested_prompt_version: "2026-06-13.v1",
    });
    expect(reading.status).toBe("generating");
  });
});
