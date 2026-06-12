import type { SupabaseClient } from "@supabase/supabase-js";

import type { ReadingGenerationOutput } from "@/domain/generation/contracts";
import {
  FreeReadingIdempotencyConflictError,
  FreeReadingQuotaExceededError,
  type FreeReadingRepository,
  type FreeReadingRepositoryCreateInput,
  type PersistedFreeReading,
  type PersistedFreeReadingGeneration,
  type ReadingOwner,
  type SafeReadingFailureCode,
} from "@/domain/readings/reading-service";
import type { ReadingKind } from "@/domain/readings/types";

interface GenerationRecordRow {
  id: string;
  provider: string;
  model: string;
  prompt_version: string;
  status: PersistedFreeReadingGeneration["status"];
  error_code: SafeReadingFailureCode | null;
}

interface ReadingRow {
  id: string;
  user_id: string | null;
  guest_session_id: string | null;
  request_id: string;
  input_hash: string;
  kind: ReadingKind;
  tier: "free";
  status: PersistedFreeReading["status"];
  input: Record<string, unknown>;
  result: ReadingGenerationOutput | null;
  created_at: string;
  updated_at: string;
  generation_records?: GenerationRecordRow[];
}

const readingSelect =
  "id,user_id,guest_session_id,request_id,input_hash,kind,tier,status,input,result,created_at,updated_at,generation_records(id,provider,model,prompt_version,status,error_code,created_at,updated_at)";

export class SupabaseReadingRepository implements FreeReadingRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByOwnerAndRequestId(
    owner: ReadingOwner,
    requestId: string,
  ): Promise<PersistedFreeReading | null> {
    const { subjectColumn, subjectValue } = toSubject(owner);
    const { data, error } = await this.client
      .from("readings")
      .select(readingSelect)
      .eq(subjectColumn, subjectValue)
      .eq("request_id", requestId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw new Error(`Failed to read existing reading: ${error.message}`);
    return data ? toPersistedReading(data as ReadingRow) : null;
  }

  async createPendingFreeReading(
    input: FreeReadingRepositoryCreateInput,
  ): Promise<
    | { created: true; reading: PersistedFreeReading }
    | { created: false; reading: PersistedFreeReading }
  > {
    const { userId, guestSessionId } = toNullableSubject(input.owner);
    const { data, error } = await this.client.rpc("create_pending_free_reading", {
      requested_user_id: userId,
      requested_guest_session_id: guestSessionId,
      requested_ip_hash: input.ipHash,
      requested_request_id: input.requestId,
      requested_input_hash: input.inputHash,
      requested_kind: input.kind,
      requested_input: input.input,
      requested_provider: input.generation.provider,
      requested_model: input.generation.model,
      requested_prompt_version: input.generation.promptVersion,
    });
    if (error) {
      if (["RL101", "RL102", "RL103"].includes(error.code ?? "")) {
        throw new FreeReadingQuotaExceededError();
      }
      if (error.code === "RL104") {
        throw new FreeReadingIdempotencyConflictError();
      }
      throw new Error(`Failed to create pending reading: ${error.message}`);
    }

    const rpcResult = (data as Array<{ created: boolean }> | null)?.[0];
    const reading = await this.findByOwnerAndRequestId(input.owner, input.requestId);
    if (!rpcResult || !reading || !reading.generation.id) {
      throw new Error("Atomic reading creation returned incomplete state.");
    }

    return rpcResult.created
      ? { created: true, reading }
      : { created: false, reading };
  }

  async completeFreeReading(input: {
    readingId: string;
    generationId: string;
    result: ReadingGenerationOutput;
  }): Promise<PersistedFreeReading> {
    const { error } = await this.client.rpc("complete_free_reading_generation", {
      requested_reading_id: input.readingId,
      requested_generation_id: input.generationId,
      requested_title: input.result.title,
      requested_result: input.result,
    });
    if (error) {
      throw new Error(`Failed to complete reading generation: ${error.message}`);
    }
    return this.findById(input.readingId);
  }

  async failFreeReading(input: {
    readingId: string;
    generationId: string;
    errorCode: SafeReadingFailureCode;
  }): Promise<PersistedFreeReading> {
    const { error } = await this.client.rpc("fail_free_reading_generation", {
      requested_reading_id: input.readingId,
      requested_generation_id: input.generationId,
      requested_error_code: input.errorCode,
    });
    if (error) {
      throw new Error(`Failed to fail reading generation: ${error.message}`);
    }
    return this.findById(input.readingId);
  }

  private async findById(readingId: string): Promise<PersistedFreeReading> {
    const { data, error } = await this.client
      .from("readings")
      .select(readingSelect)
      .eq("id", readingId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw new Error(`Failed to read reading: ${error.message}`);
    if (!data) throw new Error("Reading state was not found after transition.");
    return toPersistedReading(data as ReadingRow);
  }
}

function toPersistedReading(row: ReadingRow): PersistedFreeReading {
  const generationRow = row.generation_records?.[0];
  if (!generationRow) {
    throw new Error("Reading is missing its generation record.");
  }

  const generation = toGeneration(generationRow);
  return {
    id: row.id,
    owner: row.user_id
      ? { userId: row.user_id }
      : { guestSessionId: row.guest_session_id! },
    requestId: row.request_id,
    inputHash: row.input_hash,
    kind: row.kind,
    tier: row.tier,
    status: row.status,
    input: row.input,
    result: row.result ?? undefined,
    errorCode: generation.errorCode,
    generation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toGeneration(row: GenerationRecordRow): PersistedFreeReadingGeneration {
  return {
    id: row.id,
    provider: row.provider,
    model: row.model,
    promptVersion: row.prompt_version,
    status: row.status,
    errorCode: row.error_code ?? undefined,
  };
}

function toSubject(owner: ReadingOwner): {
  subjectColumn: "user_id" | "guest_session_id";
  subjectValue: string;
} {
  if (owner.userId) {
    return { subjectColumn: "user_id", subjectValue: owner.userId };
  }
  if (!owner.guestSessionId) {
    throw new Error("Guest owner is missing a guest session id.");
  }
  return {
    subjectColumn: "guest_session_id",
    subjectValue: owner.guestSessionId,
  };
}

function toNullableSubject(owner: ReadingOwner): {
  userId: string | null;
  guestSessionId: string | null;
} {
  return {
    userId: owner.userId ?? null,
    guestSessionId: owner.guestSessionId ?? null,
  };
}
