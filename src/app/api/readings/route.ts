import { proxyBackendRequest } from "@/infrastructure/backend/proxy-client";

export async function POST(request: Request) {
  return proxyBackendRequest({
    request,
    path: "/api/readings",
  });
}

export async function GET(request: Request) {
  return proxyBackendRequest({
    request,
    path: "/api/readings",
  });
}
