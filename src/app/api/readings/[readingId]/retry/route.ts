import { proxyBackendRequest } from "@/infrastructure/backend/proxy-client";

type RouteContext = {
  params: Promise<{ readingId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { readingId } = await context.params;
  return proxyBackendRequest({
    request,
    path: `/api/readings/${encodeURIComponent(readingId)}/retry`,
  });
}
