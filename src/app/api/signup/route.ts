import { proxyBackendRequest } from "@/infrastructure/backend/proxy-client";

export async function GET(request: Request) {
  return proxyBackendRequest({ request, path: "/api/signup" });
}

export async function POST(request: Request) {
  return proxyBackendRequest({
    request,
    path: "/api/signup/adult-eligibility",
  });
}

export async function DELETE(request: Request) {
  return proxyBackendRequest({ request, path: "/api/signup" });
}
