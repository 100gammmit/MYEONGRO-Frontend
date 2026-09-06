import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/infrastructure/backend/proxy-client", () => ({
  proxyBackendRequest,
}));

describe("/api/consents/[documentType] route proxy", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("proxies one consent acceptance to Spring", async () => {
    proxyBackendRequest.mockResolvedValue(Response.json({ consent: {} }));
    const request = new Request(
      "https://front.test/api/consents/ai-overseas-transfer",
      { method: "POST", body: JSON.stringify({ documentVersion: "draft-2026-09-07" }) },
    );
    const { POST } = await import("./route");

    await POST(request, {
      params: Promise.resolve({ documentType: "ai-overseas-transfer" }),
    });

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/consents/ai-overseas-transfer",
    });
  });

  it("proxies a consent withdrawal to Spring", async () => {
    proxyBackendRequest.mockResolvedValue(new Response(null, { status: 204 }));
    const request = new Request(
      "https://front.test/api/consents/ai-overseas-transfer",
      { method: "DELETE" },
    );
    const { DELETE } = await import("./route");

    const response = await DELETE(request, {
      params: Promise.resolve({ documentType: "ai-overseas-transfer" }),
    });

    expect(response.status).toBe(204);
    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/consents/ai-overseas-transfer",
    });
  });

  it("rejects unsupported document paths before proxying", async () => {
    const request = new Request("https://front.test/api/consents/privacy", {
      method: "POST",
    });
    const { POST } = await import("./route");

    const response = await POST(request, {
      params: Promise.resolve({ documentType: "privacy" }),
    });

    expect(response.status).toBe(400);
    expect(proxyBackendRequest).not.toHaveBeenCalled();
  });
});
