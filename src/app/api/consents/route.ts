import { proxyBackendRequest } from "@/infrastructure/backend/proxy-client";

export async function GET(request: Request) {
  const search = new URL(request.url).search;
  return proxyBackendRequest({
    request,
    path: `/api/consents${search}`,
  });
}

export async function POST(request: Request) {
  return proxyBackendRequest({
    request,
    path: "/api/consents",
  });
}
