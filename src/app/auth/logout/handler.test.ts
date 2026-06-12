import { vi } from "vitest";
import { createLogoutHandler } from "./handler";

describe("POST /auth/logout", () => {
  it("signs out and redirects home", async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);

    const response = await createLogoutHandler({ signOut })(
      new Request("https://fortune.test/auth/logout", { method: "POST" }),
    );

    expect(signOut).toHaveBeenCalledOnce();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://fortune.test/");
  });
});
