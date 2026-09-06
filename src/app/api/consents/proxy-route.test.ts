import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/infrastructure/backend/proxy-client", () => ({
  proxyBackendRequest,
}));

describe("/api/consents route proxy", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns Spring's unauthenticated consent response without a guest fallback", async () => {
    proxyBackendRequest.mockResolvedValue(Response.json(
      { code: "UNAUTHENTICATED", message: "로그인이 필요합니다." },
      { status: 401 },
    ));
    const request = new Request("https://front.test/api/consents?scope=saju");
    const { GET } = await import("./route");

    const response = await GET(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/consents?scope=saju",
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      code: "UNAUTHENTICATED",
      message: "로그인이 필요합니다.",
    });
  });

});
