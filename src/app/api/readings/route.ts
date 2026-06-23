import { BackendReadingRecordsClient } from "@/infrastructure/backend/reading-records-client";
import { proxyBackendRequest } from "@/infrastructure/backend/proxy-client";
import {
  getAuthenticatedAccessToken,
  getAuthenticatedUserId,
} from "@/infrastructure/supabase/auth";
import { createReadingListHandler } from "./records-handler";

export async function POST(request: Request) {
  return proxyBackendRequest({
    request,
    path: "/api/readings",
    accessToken: await getAuthenticatedAccessToken(),
  });
}

export async function GET(request: Request) {
  const client = new BackendReadingRecordsClient();
  return createReadingListHandler({
    getUserId: getAuthenticatedUserId,
    listReadings: async () => {
      const accessToken = await getAuthenticatedAccessToken();
      if (!accessToken) throw new Error("Missing Supabase access token.");
      return client.list(accessToken);
    },
    getReading: async () => null,
    deleteReading: async () => false,
    retryReading: async () => {
      throw new Error("Unsupported");
    },
  })(request);
}
