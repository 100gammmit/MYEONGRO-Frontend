import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/infrastructure/backend/proxy-client", () => ({
  proxyBackendRequest,
}));

describe("/api/saju/birth-places route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("proxies the authenticated catalog request to Spring", async () => {
    proxyBackendRequest.mockResolvedValue(Response.json({
      version: "kr-admin-v1",
      provinces: [],
    }));
    const request = new Request("https://front.test/api/saju/birth-places", {
      headers: { cookie: "JSESSIONID=session" },
    });
    const { GET } = await import("./route");

    await GET(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/saju/birth-places",
    });
  });

  it("preserves backend validation error fields", async () => {
    proxyBackendRequest.mockResolvedValue(Response.json({
      code: "INVALID_BIRTH_PLACE",
      field: "birthProfile.cityCode",
      message: "출생 도시를 다시 선택해 주세요.",
    }, { status: 400 }));
    const request = new Request("https://front.test/api/saju/birth-places");
    const { GET } = await import("./route");

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "INVALID_BIRTH_PLACE",
      field: "birthProfile.cityCode",
      message: "출생 도시를 다시 선택해 주세요.",
    });
  });
});
