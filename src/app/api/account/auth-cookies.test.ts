import { vi } from "vitest";
import { clearSupabaseAuthCookies } from "./auth-cookies";

describe("clearSupabaseAuthCookies", () => {
  it("expires Supabase auth cookies and leaves unrelated cookies alone", () => {
    const set = vi.fn();

    clearSupabaseAuthCookies({
      getAll: () => [
        { name: "sb-project-auth-token", value: "token" },
        { name: "sb-project-auth-token.0", value: "chunk" },
        { name: "theme", value: "dark" },
      ],
      set,
    });

    expect(set).toHaveBeenCalledTimes(2);
    expect(set).toHaveBeenCalledWith("sb-project-auth-token", "", {
      expires: new Date(0),
      maxAge: 0,
      path: "/",
    });
    expect(set).toHaveBeenCalledWith("sb-project-auth-token.0", "", {
      expires: new Date(0),
      maxAge: 0,
      path: "/",
    });
  });
});
