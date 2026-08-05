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

  it("returns Spring's unauthenticated response without a guest fallback", async () => {
    proxyBackendRequest.mockResolvedValue(Response.json(
      { code: "UNAUTHENTICATED", message: "로그인이 필요합니다." },
      { status: 401 },
    ));
    const request = new Request("https://front.test/api/readings", {
      method: "POST",
      body: JSON.stringify({ kind: "tarot" }),
    });
    const { POST } = await import("./route");

    const response = await POST(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/readings",
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      code: "UNAUTHENTICATED",
      message: "로그인이 필요합니다.",
    });
  });

  it("proxies authenticated reading creation with Spring session cookies", async () => {
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

  it("preserves Spring field validation details for the guided form", async () => {
    proxyBackendRequest.mockResolvedValue(Response.json({
      code: "INVALID_BIRTH_TIME",
      field: "birthProfile.birthTime",
      message: "출생 시각을 다시 확인해 주세요.",
    }, { status: 400 }));
    const request = new Request("https://front.test/api/readings", {
      method: "POST",
      body: JSON.stringify({ kind: "saju" }),
    });
    const { POST } = await import("./route");

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "INVALID_BIRTH_TIME",
      field: "birthProfile.birthTime",
      message: "출생 시각을 다시 확인해 주세요.",
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
