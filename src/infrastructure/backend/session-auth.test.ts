import { afterEach, describe, expect, it, vi } from "vitest";
import { getSpringSessionState, getSpringSessionUser } from "./session-auth";

describe("getSpringSessionUser", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the Spring auth session endpoint with forwarded cookies", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({
      authenticated: true,
      user: { id: "user-1", displayName: "Myeongro" },
    }));
    vi.stubGlobal("fetch", fetch);

    const user = await getSpringSessionUser("JSESSIONID=session");

    expect(fetch).toHaveBeenCalledWith("http://localhost:8080/api/auth/me", {
      headers: { cookie: "JSESSIONID=session" },
      cache: "no-store",
    });
    expect(user).toEqual({ id: "user-1", displayName: "Myeongro" });
  });

  it("treats an unavailable backend as unauthenticated on public frontend routes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    await expect(getSpringSessionUser()).resolves.toBeNull();
  });

  it.each([
    Response.json({ code: "BACKEND_UNAVAILABLE" }, { status: 502 }),
    Response.json({ code: "INTERNAL_ERROR" }, { status: 500 }),
  ])("preserves an abnormal response as unavailable", async (response) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    await expect(getSpringSessionState()).resolves.toEqual({
      status: "unavailable",
      user: null,
    });
  });

  it("preserves a network failure as unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    await expect(getSpringSessionState()).resolves.toEqual({
      status: "unavailable",
      user: null,
    });
  });

  it.each([
    Response.json({ authenticated: false }),
    Response.json({ code: "UNAUTHENTICATED" }, { status: 401 }),
  ])("preserves an explicit guest response as unauthenticated", async (response) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    await expect(getSpringSessionState()).resolves.toEqual({
      status: "unauthenticated",
      user: null,
    });
  });
});
