import { beforeEach, describe, expect, it, vi } from "vitest";

import { proxyBackendRequest } from "./proxy-client";

describe("proxyBackendRequest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("BACKEND_API_URL", "https://spring.test/");
  });

  it("forwards JSON requests with cookies and no bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(
        { reading: { id: "reading-1" } },
        {
          status: 201,
          headers: {
            "set-cookie": "myeongro_guest=signed; HttpOnly; SameSite=Lax; Path=/",
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
          cookie: "myeongro_guest=old",
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
        cookie: "myeongro_guest=old",
        "x-forwarded-for": "203.0.113.8",
      }),
      body: JSON.stringify({ kind: "tarot" }),
      cache: "no-store",
    });
    expect(response.status).toBe(201);
    expect(response.headers.get("set-cookie")).toContain("myeongro_guest=signed");
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
});
