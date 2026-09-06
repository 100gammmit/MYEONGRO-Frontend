import { proxyBackendRequest } from "@/infrastructure/backend/proxy-client";

const DOCUMENT_TYPES = new Set([
  "terms",
  "ai-overseas-transfer",
  "saju-input",
]);

type RouteContext = {
  params: Promise<{ documentType: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  return proxyConsentDocument(request, context, DOCUMENT_TYPES);
}

export async function DELETE(request: Request, context: RouteContext) {
  return proxyConsentDocument(request, context, new Set(["ai-overseas-transfer"]));
}

async function proxyConsentDocument(
  request: Request,
  context: RouteContext,
  allowedDocumentTypes: ReadonlySet<string>,
) {
  const { documentType } = await context.params;
  if (!allowedDocumentTypes.has(documentType)) {
    return Response.json({ error: "Unknown consent document type" }, { status: 400 });
  }
  return proxyBackendRequest({
    request,
    path: `/api/consents/${documentType}`,
  });
}
