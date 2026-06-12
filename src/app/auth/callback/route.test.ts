import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
const transfer = vi.fn();
const createAuthCallbackHandler = vi.fn((dependencies) => {
  createAuthCallbackHandler.dependencies = dependencies;
  return async () => new Response("ok");
}) as ReturnType<typeof vi.fn> & {
  dependencies?: {
    exchangeCodeForSession(code: string): Promise<{ userId: string }>;
    transferGuestOwnership(guestSessionId: string, userId: string): Promise<unknown>;
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

vi.mock("@/infrastructure/supabase/admin-client", () => ({
  createAdminSupabaseClient: vi.fn(() => ({ role: "service_role" })),
}));

vi.mock("@/infrastructure/supabase/guest-ownership-transfer-repository", () => ({
  SupabaseGuestOwnershipTransferRepository: vi.fn().mockImplementation(() => ({ kind: "repository" })),
}));

vi.mock("@/domain/consent/guest-ownership-transfer-service", () => ({
  GuestOwnershipTransferService: vi.fn().mockImplementation(() => ({
    transfer,
  })),
}));

describe("GET /auth/callback route wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAuthCallbackHandler.dependencies = undefined;
    vi.stubEnv("APP_SIGNING_SECRET", "0123456789abcdef0123456789abcdef");
    vi.stubEnv("NODE_ENV", "test");
  });

  it("returns the exchanged user id and delegates guest transfer through the service role repository", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
    transfer.mockResolvedValue({
      guestSessionId: "guest-1",
      userId: "user-1",
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

    await dependencies?.transferGuestOwnership("guest-1", "user-1");
    expect(transfer).toHaveBeenCalledWith("guest-1", "user-1");
  });
});
