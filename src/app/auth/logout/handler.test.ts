import { vi } from "vitest";
import { createLogoutHandler } from "./handler";

describe("POST /auth/logout", () => {
  it("logs out from Spring and redirects home", async () => {
    const logout = vi.fn().mockResolvedValue(new Response(null, {
      headers: { "set-cookie": "JSESSIONID=; Max-Age=0; Path=/" },
    }));
    const request = new Request("https://fortune.test/auth/logout", {
      method: "POST",
      headers: { cookie: "JSESSIONID=session" },
    });

    const response = await createLogoutHandler({ logout })(request);

    expect(logout).toHaveBeenCalledWith(request);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://fortune.test/");
    expect(response.headers.get("set-cookie")).toContain("JSESSIONID=");
  });
});
