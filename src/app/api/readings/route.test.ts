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

  it("proxies free reading creation to Spring without requiring authentication", async () => {
    proxyBackendRequest.mockResolvedValue(Response.json({ reading: { id: "guest-reading" } }));
    const request = new Request("https://front.test/api/readings", {
      method: "POST",
      headers: { cookie: "myeongro_guest=signed" },
      body: JSON.stringify({ kind: "tarot" }),
    });
    const { POST } = await import("./route");

    const response = await POST(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/readings",
    });
    expect(await response.json()).toEqual({ reading: { id: "guest-reading" } });
  });

  it("proxies authenticated free reading creation with Spring session cookies", async () => {
    proxyBackendRequest.mockResolvedValue(Response.json({ reading: { id: "user-reading" } }));
    const request = new Request("https://front.test/api/readings", {
      method: "POST",
      body: JSON.stringify({ kind: "saju" }),
    });
    const { POST } = await import("./route");

    await POST(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/readings",
    });
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
