import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/infrastructure/backend/proxy-client", () => ({ proxyBackendRequest }));

describe("GET /api/reading-credits/pricing", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("proxies the public price list to Spring", async () => {
    proxyBackendRequest.mockResolvedValue(Response.json(
      { dailyFreeGrant: 10 },
      { headers: { "cache-control": "no-store" } },
    ));
    const request = new Request("https://front.test/api/reading-credits/pricing");
    const { GET } = await import("./route");

    const response = await GET(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/reading-credits/pricing",
    });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
