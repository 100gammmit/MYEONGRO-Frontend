import { vi } from "vitest";

import {
  createSignedGuestSession,
  getGuestSessionCookieName,
} from "@/infrastructure/auth/guest-identity";
import { createAuthCallbackHandler } from "./handler";

const secret = "0123456789abcdef0123456789abcdef";

describe("GET /auth/callback", () => {
  it("exchanges the code and redirects to a normalized destination", async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ userId: "user-1" });
    const transferGuestOwnership = vi.fn().mockResolvedValue(undefined);
    const handler = createAuthCallbackHandler({
      signingSecret: secret,
      exchangeCodeForSession,
      transferGuestOwnership,
    });

    const response = await handler(
      new Request(
        "https://fortune.test/auth/callback?code=oauth-code&next=%2Frecords%2Freading-1%3Ftab%3Ddetail",
      ),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("oauth-code");
    expect(transferGuestOwnership).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "https://fortune.test/records/reading-1?tab=detail",
    );
  });

  it("falls back to records for an unsafe destination", async () => {
    const handler = createAuthCallbackHandler({
      signingSecret: secret,
      exchangeCodeForSession: vi.fn().mockResolvedValue({ userId: "user-1" }),
      transferGuestOwnership: vi.fn().mockResolvedValue(undefined),
    });

    const response = await handler(
      new Request(
        "https://fortune.test/auth/callback?code=oauth-code&next=%2F%2Fevil.example",
      ),
    );

    expect(response.headers.get("location")).toBe("https://fortune.test/records");
  });

  it.each([
    "/%252F%252Fevil.example",
    "/%255Cevil.example",
    "/https%253A%252F%252Fevil.example",
    "/%2500records",
    "/%09//evil.example",
    "/%0A//evil.example",
    "/%0D//evil.example",
    "/%2509//evil.example",
    "/%250A//evil.example",
    "/%250D//evil.example",
  ])("rejects recursively encoded callback destinations: %s", async (next) => {
    const handler = createAuthCallbackHandler({
      signingSecret: secret,
      exchangeCodeForSession: vi.fn().mockResolvedValue({ userId: "user-1" }),
      transferGuestOwnership: vi.fn().mockResolvedValue(undefined),
    });
    const url = new URL("https://fortune.test/auth/callback");
    url.searchParams.set("code", "oauth-code");
    url.searchParams.set("next", next);

    const response = await handler(new Request(url));

    expect(response.headers.get("location")).toBe("https://fortune.test/records");
  });

  it("transfers guest ownership after the OAuth exchange and clears the cookie on success", async () => {
    const signed = createSignedGuestSession({
      secret,
      sessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      expiresAt: "2026-06-12T00:00:00.000Z",
    });
    const transferGuestOwnership = vi.fn().mockResolvedValue(undefined);
    const handler = createAuthCallbackHandler({
      signingSecret: secret,
      exchangeCodeForSession: vi.fn().mockResolvedValue({ userId: "user-1" }),
      transferGuestOwnership,
      now: () => new Date("2026-06-11T00:00:00.000Z"),
    });

    const response = await handler(new Request(
      "https://fortune.test/auth/callback?code=oauth-code&next=%2Frecords",
      {
        headers: {
          cookie: `${getGuestSessionCookieName()}=${signed.token}`,
        },
      },
    ));

    expect(transferGuestOwnership).toHaveBeenCalledWith(
      "9775ff70-5708-45d8-85f8-cb57878bc25d",
      "user-1",
    );
    expect(transferGuestOwnership).toHaveBeenCalledTimes(1);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("transfers a legacy guest cookie and clears both brand cookie names", async () => {
    const signed = createSignedGuestSession({
      secret,
      sessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      expiresAt: "2026-06-12T00:00:00.000Z",
    });
    const transferGuestOwnership = vi.fn().mockResolvedValue(undefined);
    const handler = createAuthCallbackHandler({
      signingSecret: secret,
      exchangeCodeForSession: vi.fn().mockResolvedValue({ userId: "user-1" }),
      transferGuestOwnership,
      now: () => new Date("2026-06-11T00:00:00.000Z"),
    });

    const response = await handler(new Request(
      "https://fortune.test/auth/callback?code=oauth-code&next=%2Frecords",
      {
        headers: {
          cookie: `woondam_guest=${signed.token}`,
        },
      },
    ));
    const setCookie = response.headers.get("set-cookie");

    expect(transferGuestOwnership).toHaveBeenCalledWith(
      "9775ff70-5708-45d8-85f8-cb57878bc25d",
      "user-1",
    );
    expect(setCookie).toContain("myeongro_guest=;");
    expect(setCookie).toContain("woondam_guest=;");
  });

  it("continues login without a transfer when there is no guest cookie", async () => {
    const transferGuestOwnership = vi.fn().mockResolvedValue(undefined);
    const handler = createAuthCallbackHandler({
      signingSecret: secret,
      exchangeCodeForSession: vi.fn().mockResolvedValue({ userId: "user-1" }),
      transferGuestOwnership,
    });

    const response = await handler(new Request(
      "https://fortune.test/auth/callback?code=oauth-code&next=%2Frecords",
    ));

    expect(transferGuestOwnership).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("https://fortune.test/records");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it.each([
    "invalid.token",
    createSignedGuestSession({
      secret,
      sessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      expiresAt: "2026-06-10T00:00:00.000Z",
    }).token,
  ])("continues login without a transfer when the guest cookie is unusable: %s", async (token) => {
    const transferGuestOwnership = vi.fn().mockResolvedValue(undefined);
    const handler = createAuthCallbackHandler({
      signingSecret: secret,
      exchangeCodeForSession: vi.fn().mockResolvedValue({ userId: "user-1" }),
      transferGuestOwnership,
      now: () => new Date("2026-06-11T00:00:00.000Z"),
    });

    const response = await handler(new Request(
      "https://fortune.test/auth/callback?code=oauth-code&next=%2Frecords",
      {
        headers: {
          cookie: `${getGuestSessionCookieName()}=${token}`,
        },
      },
    ));

    expect(transferGuestOwnership).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("https://fortune.test/records");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("keeps the guest cookie and appends a non-sensitive marker when transfer fails", async () => {
    const signed = createSignedGuestSession({
      secret,
      sessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      expiresAt: "2026-06-12T00:00:00.000Z",
    });
    const handler = createAuthCallbackHandler({
      signingSecret: secret,
      exchangeCodeForSession: vi.fn().mockResolvedValue({ userId: "user-1" }),
      transferGuestOwnership: vi.fn().mockRejectedValue(new Error("transfer failed")),
      now: () => new Date("2026-06-11T00:00:00.000Z"),
    });

    const response = await handler(new Request(
      "https://fortune.test/auth/callback?code=oauth-code&next=%2Frecords",
      {
        headers: {
          cookie: `${getGuestSessionCookieName()}=${signed.token}`,
        },
      },
    ));

    expect(response.headers.get("location")).toBe(
      "https://fortune.test/records?guestTransfer=failed",
    );
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
