import { afterEach, describe, expect, it, vi } from "vitest";
import { getSpringSessionUser } from "./session-auth";

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
});
