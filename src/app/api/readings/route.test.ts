import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserId = vi.fn();
const getAccessToken = vi.fn();
const proxyBackendRequest = vi.fn();
const listReadings = vi.fn();

vi.mock("@/infrastructure/supabase/auth", () => ({
  getAuthenticatedUserId: getUserId,
  getAuthenticatedAccessToken: getAccessToken,
}));

vi.mock("@/infrastructure/backend/proxy-client", () => ({
  proxyBackendRequest,
}));

vi.mock("@/infrastructure/backend/reading-records-client", () => ({
  BackendReadingRecordsClient: class {
    list = listReadings;
  },
}));

describe("/api/readings route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getUserId.mockResolvedValue(null);
    getAccessToken.mockResolvedValue(null);
    listReadings.mockResolvedValue([]);
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

  it("returns 401 for records when a user exists without an access token", async () => {
    getUserId.mockResolvedValue("user-1");
    getAccessToken.mockResolvedValue(null);
    const { GET } = await import("./route");

    const response = await GET(new Request("https://front.test/api/readings"));

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: "UNAUTHENTICATED" });
    expect(listReadings).not.toHaveBeenCalled();
  });
});
