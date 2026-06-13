import { restoreGenerationInput } from "@/app/api/readings/input";
import { toPublicReadingRecord } from "@/app/api/readings/records-handler";
import { createReadingRuntime } from "@/app/api/readings/runtime";
import { getAuthenticatedUserId } from "@/infrastructure/supabase/auth";
import { createAdminSupabaseClient } from "@/infrastructure/supabase/admin-client";
import { SupabaseReadingRepository } from "@/infrastructure/supabase/reading-repository";

export function createRecordRouteDependencies() {
  const repository = new SupabaseReadingRepository(createAdminSupabaseClient());

  return {
    getUserId: getAuthenticatedUserId,
    listReadings: async () => [],
    getReading: async (userId: string, readingId: string) => {
      const reading = await repository.findByUserAndId(userId, readingId);
      return reading ? toPublicReadingRecord(reading) : null;
    },
    deleteReading: (userId: string, readingId: string) =>
      repository.softDeleteByUserAndId(userId, readingId),
    retryReading: async (userId: string, readingId: string) => {
      const existing = await repository.findByUserAndId(userId, readingId);
      if (!existing || existing.status !== "failed") {
        throw new Error("Reading is not retryable.");
      }

      const runtime = createReadingRuntime();
      const started = await repository.startFailedRetry(
        userId,
        readingId,
        runtime.generation,
      );
      const generationInput = restoreGenerationInput(started.kind, started.input);

      try {
        const result = (await runtime.generator.generate(generationInput)).output;
        return toPublicReadingRecord(await repository.completeFreeReading({
          readingId: started.id,
          generationId: started.generation.id,
          result,
        }));
      } catch (error) {
        const detail = error instanceof Error
          ? `${error.name} ${error.message}`.toLowerCase()
          : "";
        await repository.failFreeReading({
          readingId: started.id,
          generationId: started.generation.id,
          errorCode: detail.includes("timeout")
            ? "generation_timeout"
            : "generation_failed",
        });
        throw error;
      }
    },
  };
}
