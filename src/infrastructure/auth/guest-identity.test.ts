import { describe, expect, it } from "vitest";

import {
  createSignedGuestSession,
  getGuestSessionCookieName,
  resolveSignedGuestSessionCookie,
  serializeExpiredGuestSessionCookie,
  serializeGuestSessionCookie,
  verifySignedGuestSession,
} from "./guest-identity";

const secret = "0123456789abcdef0123456789abcdef";

describe("guest identity signing", () => {
  it("uses the Myeongro cookie name for new sessions", () => {
    expect(getGuestSessionCookieName()).toBe("myeongro_guest");
  });

  it("signs and verifies a guest session", () => {
    const signed = createSignedGuestSession({
      secret,
      sessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      expiresAt: "2026-06-12T00:00:00.000Z",
    });

    expect(verifySignedGuestSession({
      secret,
      token: signed.token,
      now: new Date("2026-06-11T00:00:00.000Z"),
    })).toEqual({
      sessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      expiresAt: "2026-06-12T00:00:00.000Z",
    });
  });

  it("rejects a tampered token", () => {
    const signed = createSignedGuestSession({
      secret,
      sessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      expiresAt: "2026-06-12T00:00:00.000Z",
    });

    expect(verifySignedGuestSession({
      secret,
      token: `${signed.token.slice(0, -1)}x`,
      now: new Date("2026-06-11T00:00:00.000Z"),
    })).toBeNull();
  });

  it("rejects an expired token", () => {
    const signed = createSignedGuestSession({
      secret,
      sessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      expiresAt: "2026-06-10T00:00:00.000Z",
    });

    expect(verifySignedGuestSession({
      secret,
      token: signed.token,
      now: new Date("2026-06-11T00:00:00.000Z"),
    })).toBeNull();
  });

  it("requires a signing secret that is at least 32 bytes", () => {
    expect(() => createSignedGuestSession({
      secret: "too-short",
      sessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      expiresAt: "2026-06-12T00:00:00.000Z",
    })).toThrow("APP_SIGNING_SECRET must be at least 32 bytes");

    expect(() => verifySignedGuestSession({
      secret: "too-short",
      token: "ignored",
      now: new Date("2026-06-11T00:00:00.000Z"),
    })).toThrow("APP_SIGNING_SECRET must be at least 32 bytes");
  });

  it("serializes a secure HttpOnly cookie contract", () => {
    const signed = createSignedGuestSession({
      secret,
      sessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      expiresAt: "2026-06-12T00:00:00.000Z",
    });

    expect(serializeGuestSessionCookie(signed)).toContain("HttpOnly");
    expect(serializeGuestSessionCookie(signed)).toContain("SameSite=Lax");
    expect(serializeGuestSessionCookie(signed)).toContain("Path=/");
    expect(serializeGuestSessionCookie(signed, { secure: true })).toContain("Secure");
  });

  it("serializes cookie expiration for deletion", () => {
    expect(serializeExpiredGuestSessionCookie()).toContain("Max-Age=0");
    expect(serializeExpiredGuestSessionCookie()).toContain("HttpOnly");
    expect(serializeExpiredGuestSessionCookie()).toContain("SameSite=Lax");
  });

  it("does not resolve a legacy cookie name", () => {
    const signed = createSignedGuestSession({
      secret,
      sessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      expiresAt: "2026-06-12T00:00:00.000Z",
    });

    const resolved = resolveSignedGuestSessionCookie({
      cookieHeader: `legacy_guest=${signed.token}`,
      secret,
      now: new Date("2026-06-11T00:00:00.000Z"),
    });

    expect(resolved).toBeNull();
  });
});
