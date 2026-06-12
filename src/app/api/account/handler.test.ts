import { vi } from "vitest";
import { createAccountDeleteHandler } from "./handler";

describe("DELETE /api/account", () => {
  it("requires authentication", async () => {
    const deleteUser = vi.fn();
    const signOut = vi.fn();
    const clearLocalAuthCookies = vi.fn();
    const response = await createAccountDeleteHandler({
      getUserId: async () => null,
      deleteUser,
      signOut,
      clearLocalAuthCookies,
    })();

    expect(response.status).toBe(401);
    expect(deleteUser).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
    expect(clearLocalAuthCookies).not.toHaveBeenCalled();
  });

  it("deletes the authenticated user and clears their session", async () => {
    const deleteUser = vi.fn().mockResolvedValue(undefined);
    const signOut = vi.fn().mockResolvedValue(undefined);
    const clearLocalAuthCookies = vi.fn().mockResolvedValue(undefined);
    const response = await createAccountDeleteHandler({
      getUserId: async () => "user-1",
      deleteUser,
      signOut,
      clearLocalAuthCookies,
    })();

    expect(response.status).toBe(204);
    expect(deleteUser).toHaveBeenCalledWith("user-1");
    expect(signOut).toHaveBeenCalledOnce();
    expect(clearLocalAuthCookies).toHaveBeenCalledOnce();
  });

  it("clears local cookies and succeeds when remote sign out fails after deletion", async () => {
    const clearLocalAuthCookies = vi.fn().mockResolvedValue(undefined);
    const response = await createAccountDeleteHandler({
      getUserId: async () => "user-1",
      deleteUser: vi.fn().mockResolvedValue(undefined),
      signOut: vi.fn().mockRejectedValue(new Error("remote sign out failed")),
      clearLocalAuthCookies,
    })();

    expect(response.status).toBe(204);
    expect(clearLocalAuthCookies).toHaveBeenCalledOnce();
  });

  it("returns success after deletion even if local cookie cleanup reports a failure", async () => {
    const clearLocalAuthCookies = vi
      .fn()
      .mockRejectedValue(new Error("cookie adapter failed"));
    const response = await createAccountDeleteHandler({
      getUserId: async () => "user-1",
      deleteUser: vi.fn().mockResolvedValue(undefined),
      signOut: vi.fn().mockResolvedValue(undefined),
      clearLocalAuthCookies,
    })();

    expect(response.status).toBe(204);
    expect(clearLocalAuthCookies).toHaveBeenCalledOnce();
  });

  it("returns a generic error and does not clear cookies when deletion fails", async () => {
    const clearLocalAuthCookies = vi.fn();
    const response = await createAccountDeleteHandler({
      getUserId: async () => "user-1",
      deleteUser: vi.fn().mockRejectedValue(new Error("secret provider detail")),
      signOut: vi.fn(),
      clearLocalAuthCookies,
    })();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "계정 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    });
    expect(clearLocalAuthCookies).not.toHaveBeenCalled();
  });
});
