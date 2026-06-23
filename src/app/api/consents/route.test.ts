import { describe, expect, it, vi } from "vitest";

import {
  createSignedGuestSession,
  getGuestSessionCookieName,
} from "@/infrastructure/auth/guest-identity";
import {
  createConsentGetHandler,
  createConsentPostHandler,
} from "./handler";

const secret = "0123456789abcdef0123456789abcdef";

describe("GET /api/consents", () => {
  it("issues a signed guest cookie when a guest checks consent status without one", async () => {
    const getStatus = vi.fn().mockResolvedValue({
      acceptedDocumentTypes: [],
      requiredDocumentTypes: ["terms", "privacy", "sensitive-data"],
      hasAcceptedRequired: false,
    });

    const get = createConsentGetHandler({
      signingSecret: secret,
      getUserId: async () => null,
      getStatus,
      now: () => new Date("2026-06-11T00:00:00.000Z"),
    });

    const response = await get(new Request("http://localhost/api/consents"));

    expect(response.status).toBe(200);
    expect(getStatus).toHaveBeenCalledWith({
      subjectId: expect.any(String),
      subjectType: "guest",
    });
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("reuses a valid guest cookie instead of issuing a replacement", async () => {
    const signed = createSignedGuestSession({
      secret,
      sessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      expiresAt: "2026-06-12T00:00:00.000Z",
    });
    const getStatus = vi.fn().mockResolvedValue({
      acceptedDocumentTypes: ["terms", "privacy", "sensitive-data"],
      requiredDocumentTypes: ["terms", "privacy", "sensitive-data"],
      hasAcceptedRequired: true,
    });
    const get = createConsentGetHandler({
      signingSecret: secret,
      getUserId: async () => null,
      getStatus,
      now: () => new Date("2026-06-11T00:00:00.000Z"),
    });

    const response = await get(new Request("http://localhost/api/consents", {
      headers: {
        cookie: `${getGuestSessionCookieName()}=${signed.token}`,
      },
    }));

    expect(getStatus).toHaveBeenCalledWith({
      subjectId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      subjectType: "guest",
    });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("does not accept a legacy guest cookie name", async () => {
    const signed = createSignedGuestSession({
      secret,
      sessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      expiresAt: "2026-06-12T00:00:00.000Z",
    });
    const getStatus = vi.fn().mockResolvedValue({
      acceptedDocumentTypes: [],
      requiredDocumentTypes: ["terms", "privacy", "sensitive-data"],
      hasAcceptedRequired: false,
    });
    const get = createConsentGetHandler({
      signingSecret: secret,
      getUserId: async () => null,
      getStatus,
      now: () => new Date("2026-06-11T00:00:00.000Z"),
    });

    const response = await get(new Request("http://localhost/api/consents", {
      headers: {
        cookie: `legacy_guest=${signed.token}`,
      },
    }));
    const setCookie = response.headers.get("set-cookie");

    expect(response.status).toBe(200);
    expect(getStatus).toHaveBeenCalledWith({
      subjectId: expect.any(String),
      subjectType: "guest",
    });
    expect(setCookie).toContain("myeongro_guest=");
    expect(setCookie).not.toContain("legacy_guest=");
  });

  it("replaces an invalid guest cookie with a fresh signed cookie", async () => {
    const getStatus = vi.fn().mockResolvedValue({
      acceptedDocumentTypes: [],
      requiredDocumentTypes: ["terms", "privacy", "sensitive-data"],
      hasAcceptedRequired: false,
    });
    const get = createConsentGetHandler({
      signingSecret: secret,
      getUserId: async () => null,
      getStatus,
      now: () => new Date("2026-06-11T00:00:00.000Z"),
    });

    const response = await get(new Request("http://localhost/api/consents", {
      headers: {
        cookie: "myeongro_guest=invalid.token",
      },
    }));

    expect(response.status).toBe(200);
    expect(getStatus).toHaveBeenCalledWith({
      subjectId: expect.any(String),
      subjectType: "guest",
    });
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("does not mint a guest cookie for an authenticated user without a transfer cookie", async () => {
    const getStatus = vi.fn().mockResolvedValue({
      acceptedDocumentTypes: [],
      requiredDocumentTypes: ["terms", "privacy", "sensitive-data"],
      hasAcceptedRequired: false,
    });
    const get = createConsentGetHandler({
      signingSecret: secret,
      getUserId: async () => "user-1",
      getStatus,
      now: () => new Date("2026-06-11T00:00:00.000Z"),
    });

    const response = await get(new Request("http://localhost/api/consents"));

    expect(getStatus).toHaveBeenCalledWith({
      subjectId: "user-1",
      subjectType: "user",
    });
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});

describe("POST /api/consents", () => {
  it("records guest consent from the server-owned cookie subject", async () => {
    const signed = createSignedGuestSession({
      secret,
      sessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      expiresAt: "2026-06-12T00:00:00.000Z",
    });
    const acceptRequired = vi.fn().mockResolvedValue([{ documentType: "terms" }]);
    const post = createConsentPostHandler({
      signingSecret: secret,
      getUserId: async () => null,
      acceptRequired,
      now: () => new Date("2026-06-11T00:00:00.000Z"),
    });

    const response = await post(new Request("http://localhost/api/consents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `${getGuestSessionCookieName()}=${signed.token}`,
      },
      body: JSON.stringify({
        acceptedDocumentTypes: ["terms", "privacy", "sensitive-data"],
      }),
    }));

    expect(response.status).toBe(200);
    expect(acceptRequired).toHaveBeenCalledWith(expect.objectContaining({
      subjectId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
      subjectType: "guest",
    }));
  });

  it("rejects guestSessionId and acceptedAt in the request body", async () => {
    const acceptRequired = vi.fn();
    const post = createConsentPostHandler({
      signingSecret: secret,
      getUserId: async () => "user-1",
      acceptRequired,
      now: () => new Date("2026-06-11T00:00:00.000Z"),
    });

    const response = await post(new Request("http://localhost/api/consents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestSessionId: "9775ff70-5708-45d8-85f8-cb57878bc25d",
        acceptedAt: "2026-06-11T00:00:00.000Z",
        acceptedDocumentTypes: ["terms", "privacy", "sensitive-data"],
      }),
    }));

    expect(response.status).toBe(400);
    expect(acceptRequired).not.toHaveBeenCalled();
  });

  it("rejects a guest consent POST when there is no verified guest cookie", async () => {
    const acceptRequired = vi.fn();
    const post = createConsentPostHandler({
      signingSecret: secret,
      getUserId: async () => null,
      acceptRequired,
      now: () => new Date("2026-06-11T00:00:00.000Z"),
    });

    const response = await post(new Request("http://localhost/api/consents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acceptedDocumentTypes: ["terms", "privacy", "sensitive-data"],
      }),
    }));

    expect(response.status).toBe(400);
    expect(acceptRequired).not.toHaveBeenCalled();
  });
});
