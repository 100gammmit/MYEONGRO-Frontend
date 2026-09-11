import { proxyBackendRequest } from "@/infrastructure/backend/proxy-client";

type RouteContext = {
  params: Promise<{ documentType: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  return proxyConsentWithdrawal(request, context);
}

async function proxyConsentWithdrawal(
  request: Request,
  context: RouteContext,
) {
  const { documentType } = await context.params;
  if (documentType !== "ai-overseas-transfer") {
    return Response.json({ error: "Unknown consent document type" }, { status: 400 });
  }
  return proxyBackendRequest({
    request,
    path: `/api/consents/${documentType}`,
  });
}
