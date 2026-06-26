import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/infrastructure/backend/proxy-client", () => ({
  proxyBackendRequest,
}));

describe("GET /api/me", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("always proxies session lookup to Spring with the request cookies", async () => {
    proxyBackendRequest.mockResolvedValue(Response.json({
      authenticated: true,
      user: { id: "user-1" },
    }));
    const request = new Request("https://front.test/api/me");
    const { GET } = await import("./route");

    const response = await GET(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/me",
    });
    expect(await response.json()).toEqual({
      authenticated: true,
      user: { id: "user-1" },
    });
  });
});
