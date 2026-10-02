import { proxyBackendRequest } from "@/infrastructure/backend/proxy-client";

// Public on the backend: guests read the price list here before logging in.
export async function GET(request: Request) {
  return proxyBackendRequest({
    request,
    path: "/api/reading-credits/pricing",
  });
}
