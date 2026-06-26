import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/infrastructure/backend/proxy-client", () => ({
  proxyBackendRequest,
}));

describe("/api/consents route proxy", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("proxies guest consent status to Spring so it can issue the guest cookie", async () => {
    proxyBackendRequest.mockResolvedValue(Response.json({
      status: { hasAcceptedRequired: false },
    }));
    const request = new Request("https://front.test/api/consents");
    const { GET } = await import("./route");

    const response = await GET(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/consents",
    });
    expect(await response.json()).toEqual({
      status: { hasAcceptedRequired: false },
    });
  });

  it("proxies consent submission with the Spring session cookies when present", async () => {
    proxyBackendRequest.mockResolvedValue(Response.json({ consents: [] }));
    const request = new Request("https://front.test/api/consents", {
      method: "POST",
      body: JSON.stringify({ acceptedDocumentTypes: ["terms", "privacy", "sensitive-data"] }),
    });
    const { POST } = await import("./route");

    await POST(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/consents",
    });
  });
});
