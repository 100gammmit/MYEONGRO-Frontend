import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("POST /auth/logout route", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards logout to the Spring auth endpoint with the session cookie", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, {
      headers: { "set-cookie": "JSESSIONID=; Max-Age=0; Path=/" },
    }));
    vi.stubGlobal("fetch", fetch);
    const request = new Request("https://front.test/auth/logout", {
      method: "POST",
      headers: { cookie: "JSESSIONID=session" },
    });

    await POST(request);

    expect(fetch).toHaveBeenCalledWith("http://localhost:8080/auth/logout", {
      method: "POST",
      headers: { cookie: "JSESSIONID=session" },
      cache: "no-store",
    });
  });
});
