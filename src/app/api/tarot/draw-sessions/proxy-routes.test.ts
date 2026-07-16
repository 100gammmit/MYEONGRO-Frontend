import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyBackendRequest = vi.fn();

vi.mock("@/infrastructure/backend/proxy-client", () => ({
  proxyBackendRequest,
}));

describe("tarot draw session proxy routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    proxyBackendRequest.mockResolvedValue(Response.json({ status: "ok" }));
  });

  it("proxies active lookup", async () => {
    const request = new Request("https://front.test/api/tarot/draw-sessions/active", {
      headers: { cookie: "JSESSIONID=session" },
    });
    const { GET } = await import("./active/route");

    await GET(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/tarot/draw-sessions/active",
    });
  });

  it("proxies session creation", async () => {
    const request = new Request("https://front.test/api/tarot/draw-sessions", {
      method: "POST",
      body: JSON.stringify({ spreadType: "daily_one_card" }),
    });
    const { POST } = await import("./route");

    await POST(request);

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/tarot/draw-sessions",
    });
  });

  it("proxies an opaque token selection with an encoded session ID", async () => {
    const request = new Request("https://front.test/api/tarot/draw-sessions/draw%2Fid/selections", {
      method: "POST",
      body: JSON.stringify({ candidateToken: "opaque-token" }),
    });
    const { POST } = await import("./[drawSessionId]/selections/route");

    await POST(request, { params: Promise.resolve({ drawSessionId: "draw/id" }) });

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/tarot/draw-sessions/draw%2Fid/selections",
    });
  });

  it("proxies explicit abandon with an encoded session ID", async () => {
    proxyBackendRequest.mockResolvedValue(new Response(null, { status: 204 }));
    const request = new Request("https://front.test/api/tarot/draw-sessions/draw%2Fid", {
      method: "DELETE",
    });
    const { DELETE } = await import("./[drawSessionId]/route");

    const response = await DELETE(request, {
      params: Promise.resolve({ drawSessionId: "draw/id" }),
    });

    expect(proxyBackendRequest).toHaveBeenCalledWith({
      request,
      path: "/api/tarot/draw-sessions/draw%2Fid",
    });
    expect(response.status).toBe(204);
  });
});
