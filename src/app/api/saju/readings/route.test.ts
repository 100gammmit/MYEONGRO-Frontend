import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/infrastructure/backend/proxy-client", () => ({
  proxyBackendRequest,
}));

describe("/api/saju/readings route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("preserves Spring validation details from the saju endpoint", async () => {
    proxyBackendRequest.mockResolvedValue(Response.json({
      code: "INVALID_BIRTH_TIME",
      field: "birthProfile.birthTime",
      message: "출생 시각을 다시 확인해 주세요.",
    }, { status: 400 }));
    const request = new Request("https://front.test/api/saju/readings", {
      method: "POST",
      body: JSON.stringify({ focusArea: "career" }),
    });
    const { POST } = await import("./route");

    const response = await POST(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/saju/readings",
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "INVALID_BIRTH_TIME",
      field: "birthProfile.birthTime",
      message: "출생 시각을 다시 확인해 주세요.",
    });
  });
});
