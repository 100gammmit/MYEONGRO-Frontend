import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserId = vi.fn();
const getAccessToken = vi.fn();
const proxyBackendRequest = vi.fn();

vi.mock("@/infrastructure/supabase/auth", () => ({
  getAuthenticatedUserId: getUserId,
  getAuthenticatedAccessToken: getAccessToken,
}));

vi.mock("@/infrastructure/backend/proxy-client", () => ({
  proxyBackendRequest,
}));

describe("/api/readings route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getUserId.mockResolvedValue(null);
    getAccessToken.mockResolvedValue(null);
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
      accessToken: null,
    });
    expect(await response.json()).toEqual({ reading: { id: "guest-reading" } });
  });

  it("proxies authenticated free reading creation with the server-side access token", async () => {
    getAccessToken.mockResolvedValue("access-token");
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
      accessToken: "access-token",
    });
  });
});
