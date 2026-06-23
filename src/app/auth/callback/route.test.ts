import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
const createAuthCallbackHandler = vi.fn((dependencies) => {
  createAuthCallbackHandler.dependencies = dependencies;
  return async () => new Response("ok");
}) as ReturnType<typeof vi.fn> & {
  dependencies?: {
    exchangeCodeForSession(code: string): Promise<{ userId: string }>;
    signingSecret: string;
    secureCookies: boolean;
  };
};

const serverSupabaseClient = {
  auth: {
    exchangeCodeForSession,
  },
};

vi.mock("./handler", () => ({
  createAuthCallbackHandler,
}));

vi.mock("@/infrastructure/supabase/server-client", () => ({
  createServerSupabaseClient: vi.fn(async () => serverSupabaseClient),
}));

describe("GET /auth/callback route wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAuthCallbackHandler.dependencies = undefined;
    vi.stubEnv("APP_SIGNING_SECRET", "0123456789abcdef0123456789abcdef");
    vi.stubEnv("NODE_ENV", "test");
  });

  it("returns the exchanged user id without wiring guest ownership transfer", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });

    const { GET } = await import("./route");

    await GET(new Request("https://fortune.test/auth/callback?code=oauth-code"));

    const dependencies = createAuthCallbackHandler.dependencies;
    expect(dependencies?.signingSecret).toBe(process.env.APP_SIGNING_SECRET);
    expect(dependencies?.secureCookies).toBe(false);
    await expect(dependencies?.exchangeCodeForSession("oauth-code")).resolves.toEqual({
      userId: "user-1",
    });
    expect(exchangeCodeForSession).toHaveBeenCalledWith("oauth-code");
    expect(dependencies).not.toHaveProperty("transferGuestOwnership");
  });
});
