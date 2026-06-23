import { proxyBackendRequest } from "@/infrastructure/backend/proxy-client";
import { getAuthenticatedAccessToken } from "@/infrastructure/supabase/auth";

export async function GET(request: Request) {
  return proxyBackendRequest({
    request,
    path: "/api/consents",
    accessToken: await getAuthenticatedAccessToken(),
  });
}

export async function POST(request: Request) {
  return proxyBackendRequest({
    request,
    path: "/api/consents",
    accessToken: await getAuthenticatedAccessToken(),
  });
}
