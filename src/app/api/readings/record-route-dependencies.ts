import { BackendReadingRecordsClient } from "@/infrastructure/backend/reading-records-client";
import { getBackendCookieHeader } from "@/infrastructure/backend/request-cookies";
import { getSpringSessionUser } from "@/infrastructure/backend/session-auth";

export function createRecordRouteDependencies() {
  async function createClient(): Promise<BackendReadingRecordsClient> {
    return new BackendReadingRecordsClient(await getBackendCookieHeader());
  }

  return {
    getUserId: async () => (await getSpringSessionUser(await getBackendCookieHeader()))?.id ?? null,
    listReadings: async () => (await createClient()).list(),
    getReading: async (_userId: string, readingId: string) =>
      (await createClient()).get(readingId),
    deleteReading: async (_userId: string, readingId: string) =>
      (await createClient()).softDelete(readingId),
    retryReading: async (_userId: string, readingId: string) =>
      (await createClient()).retry(readingId),
  };
}
