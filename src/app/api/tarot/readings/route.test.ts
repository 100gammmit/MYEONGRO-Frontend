import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/infrastructure/backend/proxy-client", () => ({
  proxyBackendRequest,
}));

describe("/api/tarot/readings route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("proxies tarot creation to its Spring endpoint", async () => {
    proxyBackendRequest.mockResolvedValue(Response.json({ reading: { id: "tarot-reading" } }));
    const request = new Request("https://front.test/api/tarot/readings", {
      method: "POST",
      body: JSON.stringify({ spreadType: "daily_one_card" }),
    });
    const { POST } = await import("./route");

    const response = await POST(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/tarot/readings",
    });
    expect(response.status).toBe(200);
  });
});
