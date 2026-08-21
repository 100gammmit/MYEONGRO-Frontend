import { beforeEach, describe, expect, it, vi } from "vitest";

import { proxyBackendRequest } from "./proxy-client";

describe("proxyBackendRequest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("BACKEND_API_URL", "https://spring.test/");
  });

  it("forwards JSON requests with only the Spring session cookie and no bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(
        { reading: { id: "reading-1" } },
        {
          status: 201,
          headers: {
            "set-cookie": "MYEONGRO_SESSION=renewed; HttpOnly; SameSite=Lax; Path=/",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await proxyBackendRequest({
      request: new Request("https://front.test/api/readings", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: "MYEONGRO_SESSION=session; theme=dark",
          "x-forwarded-for": "203.0.113.8",
        },
        body: JSON.stringify({ kind: "tarot" }),
      }),
      path: "/api/readings",
    });

    expect(fetchMock).toHaveBeenCalledWith("https://spring.test/api/readings", {
      method: "POST",
      headers: expect.objectContaining({
        "content-type": "application/json",
        cookie: "MYEONGRO_SESSION=session",
        "x-forwarded-for": "203.0.113.8",
      }),
      body: JSON.stringify({ kind: "tarot" }),
      cache: "no-store",
    });
    expect(response.status).toBe(201);
    expect(response.headers.get("set-cookie")).toContain("MYEONGRO_SESSION=renewed");
    expect(await response.json()).toEqual({ reading: { id: "reading-1" } });
  });

  it("normalizes backend network failures to the shared error contract", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    const response = await proxyBackendRequest({
      request: new Request("https://front.test/api/consents"),
      path: "/api/consents",
    });

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      code: "BACKEND_UNAVAILABLE",
      message: "요청을 처리할 서버에 연결하지 못했습니다.",
    });
  });

  it("supports Spring Session's SESSION cookie name", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ authenticated: true }));
    vi.stubGlobal("fetch", fetchMock);

    await proxyBackendRequest({
      request: new Request("https://front.test/api/me", {
        headers: { cookie: "SESSION=spring-session; theme=dark" },
      }),
      path: "/api/auth/me",
    });

    expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual({ cookie: "SESSION=spring-session" });
  });

  it("forwards no-content responses without converting them to backend unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, {
      status: 204,
    })));

    const response = await proxyBackendRequest({
      request: new Request("https://front.test/api/readings/reading-1", {
        method: "DELETE",
      }),
      path: "/api/readings/reading-1",
    });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });

  it("preserves credit cache and retry headers from Spring", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(
      { code: "INSUFFICIENT_READING_CREDITS" },
      {
        status: 429,
        headers: {
          "cache-control": "no-store",
          "retry-after": "3600",
        },
      },
    )));

    const response = await proxyBackendRequest({
      request: new Request("https://front.test/api/reading-credits"),
      path: "/api/reading-credits",
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("retry-after")).toBe("3600");
  });
});
