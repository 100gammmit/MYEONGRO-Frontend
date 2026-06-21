import { BackendReadingRecordsClient } from "@/infrastructure/backend/reading-records-client";
import {
  getAuthenticatedAccessToken,
  getAuthenticatedUserId,
} from "@/infrastructure/supabase/auth";

export function createRecordRouteDependencies() {
  const client = new BackendReadingRecordsClient();

  async function requireAccessToken(): Promise<string> {
    const accessToken = await getAuthenticatedAccessToken();
    if (!accessToken) throw new Error("Missing Supabase access token.");
    return accessToken;
  }

  return {
    getUserId: getAuthenticatedUserId,
    listReadings: async () => client.list(await requireAccessToken()),
    getReading: async (_userId: string, readingId: string) =>
      client.get(await requireAccessToken(), readingId),
    deleteReading: async (_userId: string, readingId: string) =>
      client.softDelete(await requireAccessToken(), readingId),
    retryReading: async (_userId: string, readingId: string) =>
      client.retry(await requireAccessToken(), readingId),
  };
}
