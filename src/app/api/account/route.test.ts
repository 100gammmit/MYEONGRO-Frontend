import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/infrastructure/backend/proxy-client", () => ({
  proxyBackendRequest,
}));

describe("DELETE /api/account", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("proxies account withdrawal to Spring with the request cookies", async () => {
    proxyBackendRequest.mockResolvedValue(new Response(null, { status: 204 }));
    const request = new Request("https://front.test/api/account", {
      method: "DELETE",
    });
    const { DELETE } = await import("./route");

    const response = await DELETE(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/account",
    });
    expect(response.status).toBe(204);
  });

  it("propagates backend withdrawal failures", async () => {
    proxyBackendRequest.mockResolvedValue(
      Response.json({ code: "BACKEND_UNAVAILABLE" }, { status: 502 }),
    );
    const request = new Request("https://front.test/api/account", {
      method: "DELETE",
    });
    const { DELETE } = await import("./route");

    const response = await DELETE(request);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ code: "BACKEND_UNAVAILABLE" });
  });
});
