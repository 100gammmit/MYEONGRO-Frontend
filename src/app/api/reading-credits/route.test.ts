import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/infrastructure/backend/proxy-client", () => ({ proxyBackendRequest }));

describe("GET /api/reading-credits", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("proxies the authenticated credit lookup to Spring", async () => {
    proxyBackendRequest.mockResolvedValue(Response.json(
      { balance: { total: 10 } },
      { headers: { "cache-control": "no-store" } },
    ));
    const request = new Request("https://front.test/api/reading-credits", {
      headers: { cookie: "MYEONGRO_SESSION=session" },
    });
    const { GET } = await import("./route");

    const response = await GET(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/reading-credits",
    });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
