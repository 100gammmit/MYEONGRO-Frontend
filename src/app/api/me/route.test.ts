import { beforeEach, describe, expect, it, vi } from "vitest";

const getAccessToken = vi.fn();
const proxyBackendRequest = vi.fn();

vi.mock("@/infrastructure/supabase/auth", () => ({
  getAuthenticatedAccessToken: getAccessToken,
}));

vi.mock("@/infrastructure/backend/proxy-client", () => ({
  proxyBackendRequest,
}));

describe("GET /api/me", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns an unauthenticated public response for guests", async () => {
    getAccessToken.mockResolvedValue(null);
    const { GET } = await import("./route");

    const response = await GET(new Request("https://front.test/api/me"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ authenticated: false });
    expect(proxyBackendRequest).not.toHaveBeenCalled();
  });

  it("proxies authenticated users to Spring with the Supabase access token", async () => {
    getAccessToken.mockResolvedValue("access-token");
    proxyBackendRequest.mockResolvedValue(Response.json({
      authenticated: true,
      user: { id: "user-1" },
    }));
    const request = new Request("https://front.test/api/me");
    const { GET } = await import("./route");

    const response = await GET(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/me",
      accessToken: "access-token",
    });
    expect(await response.json()).toEqual({
      authenticated: true,
      user: { id: "user-1" },
    });
  });
});
