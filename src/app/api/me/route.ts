import { proxyBackendRequest } from "@/infrastructure/backend/proxy-client";
import { getAuthenticatedAccessToken } from "@/infrastructure/supabase/auth";

export async function GET(request: Request) {
  const accessToken = await getAuthenticatedAccessToken();
  if (!accessToken) {
    return Response.json({ authenticated: false });
  }

  return proxyBackendRequest({
    request,
    path: "/api/me",
    accessToken,
  });
}
