import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/infrastructure/backend/proxy-client", () => ({
  proxyBackendRequest,
}));

describe("/api/readings route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("proxies reading list lookup to Spring", async () => {
    proxyBackendRequest.mockResolvedValue(Response.json({ items: [] }));
    const { GET } = await import("./route");
    const request = new Request("https://front.test/api/readings", {
      headers: { cookie: "JSESSIONID=session" },
    });

    const response = await GET(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/readings",
    });
    expect(await response.json()).toEqual({ items: [] });
  });
});
