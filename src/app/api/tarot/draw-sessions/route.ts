import { proxyBackendRequest } from "@/infrastructure/backend/proxy-client";

export async function POST(request: Request) {
  return proxyBackendRequest({
    request,
    path: "/api/tarot/draw-sessions",
  });
}
