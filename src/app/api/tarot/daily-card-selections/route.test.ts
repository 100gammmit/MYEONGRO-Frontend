import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/infrastructure/backend/proxy-client", () => ({
  proxyBackendRequest,
}));

describe("/api/tarot/daily-card-selections route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("proxies the guest-safe selection request to Spring", async () => {
    proxyBackendRequest.mockResolvedValue(Response.json({ selection: {} }));
    const request = new Request("https://front.test/api/tarot/daily-card-selections", {
      method: "POST",
      body: "{}",
    });
    const { POST } = await import("./route");

    const response = await POST(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/tarot/daily-card-selections",
    });
    expect(response.status).toBe(200);
  });
});
