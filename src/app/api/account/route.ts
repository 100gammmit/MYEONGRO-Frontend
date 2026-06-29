import { proxyBackendRequest } from "@/infrastructure/backend/proxy-client";

export async function DELETE(request: Request) {
  return proxyBackendRequest({
    request,
    path: "/api/account",
  });
}
