import { proxyBackendRequest } from "@/infrastructure/backend/proxy-client";

export async function GET(request: Request) {
  return proxyBackendRequest({
    request,
    path: "/api/consents",
  });
}

export async function POST(request: Request) {
  return proxyBackendRequest({
    request,
    path: "/api/consents",
  });
}
