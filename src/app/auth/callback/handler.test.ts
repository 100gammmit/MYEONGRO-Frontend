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
    const handler = createAuthCallbackHandler({
      signingSecret: secret,
      exchangeCodeForSession,
    });

    const response = await handler(
      new Request(
        "https://fortune.test/auth/callback?code=oauth-code&next=%2Frecords%2Freading-1%3Ftab%3Ddetail",
      ),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("oauth-code");
    expect(response.headers.get("location")).toBe(
      "https://fortune.test/records/reading-1?tab=detail",
    );
  });

  it("falls back to records for an unsafe destination", async () => {
    const handler = createAuthCallbackHandler({
      signingSecret: secret,
      exchangeCodeForSession: vi.fn().mockResolvedValue({ userId: "user-1" }),
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
    });
    const url = new URL("https://fortune.test/auth/callback");
    url.searchParams.set("code", "oauth-code");
    url.searchParams.set("next", next);

    const response = await handler(new Request(url));

    expect(response.headers.get("location")).toBe("https://fortune.test/records");
  });

  it("does not transfer guest ownership or clear the guest cookie after OAuth", async () => {
    const signed = createSignedGuestSession({
      secret,
      sessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      expiresAt: "2026-06-12T00:00:00.000Z",
    });
    const handler = createAuthCallbackHandler({
      signingSecret: secret,
      exchangeCodeForSession: vi.fn().mockResolvedValue({ userId: "user-1" }),
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

    expect(response.headers.get("location")).toBe("https://fortune.test/records");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("ignores a legacy guest cookie name during OAuth callback", async () => {
    const signed = createSignedGuestSession({
      secret,
      sessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      expiresAt: "2026-06-12T00:00:00.000Z",
    });
    const handler = createAuthCallbackHandler({
      signingSecret: secret,
      exchangeCodeForSession: vi.fn().mockResolvedValue({ userId: "user-1" }),
      now: () => new Date("2026-06-11T00:00:00.000Z"),
    });

    const response = await handler(new Request(
      "https://fortune.test/auth/callback?code=oauth-code&next=%2Frecords",
      {
        headers: {
          cookie: `legacy_guest=${signed.token}`,
        },
      },
    ));

    expect(response.headers.get("location")).toBe("https://fortune.test/records");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("continues login without a transfer when there is no guest cookie", async () => {
    const handler = createAuthCallbackHandler({
      signingSecret: secret,
      exchangeCodeForSession: vi.fn().mockResolvedValue({ userId: "user-1" }),
    });

    const response = await handler(new Request(
      "https://fortune.test/auth/callback?code=oauth-code&next=%2Frecords",
    ));

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
    const handler = createAuthCallbackHandler({
      signingSecret: secret,
      exchangeCodeForSession: vi.fn().mockResolvedValue({ userId: "user-1" }),
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

    expect(response.headers.get("location")).toBe("https://fortune.test/records");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("ignores guest transfer failure markers because guest claim is out of scope", async () => {
    const signed = createSignedGuestSession({
      secret,
      sessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      expiresAt: "2026-06-12T00:00:00.000Z",
    });
    const handler = createAuthCallbackHandler({
      signingSecret: secret,
      exchangeCodeForSession: vi.fn().mockResolvedValue({ userId: "user-1" }),
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

    expect(response.headers.get("location")).toBe("https://fortune.test/records");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
