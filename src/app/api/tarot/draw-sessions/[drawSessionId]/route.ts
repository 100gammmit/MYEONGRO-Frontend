import { proxyBackendRequest } from "@/infrastructure/backend/proxy-client";

type RouteContext = {
  params: Promise<{ drawSessionId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const { drawSessionId } = await context.params;
  return proxyBackendRequest({
    request,
    path: `/api/tarot/draw-sessions/${encodeURIComponent(drawSessionId)}`,
  });
}
