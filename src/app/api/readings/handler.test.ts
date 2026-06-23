import { describe, expect, it, vi } from "vitest";

import {
  createSignedGuestSession,
  getGuestSessionCookieName,
} from "@/infrastructure/auth/guest-identity";
import {
  FreeReadingGenerationError,
  FreeReadingGenerationInProgressError,
  FreeReadingIdempotencyConflictError,
} from "@/domain/readings/reading-service";
import { createReadingPostHandler } from "./handler";

const signingSecret = "a-secure-signing-secret-that-is-at-least-32-bytes";
const requestId = "11111111-1111-4111-8111-111111111111";
const tarotBody = {
  kind: "tarot",
  question: "새로운 일을 시작해도 좋을까요?",
  requestId,
  cardIds: [
    "major-00-fool",
    "major-17-star",
    "major-21-world",
  ],
};

function request(body: unknown, cookie?: string) {
  return new Request("https://fortune.test/api/readings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      "x-forwarded-for": "203.0.113.8",
    },
    body: JSON.stringify(body),
  });
}

function guestCookie() {
  const session = createSignedGuestSession({
    secret: signingSecret,
    sessionId: "22222222-2222-4222-8222-222222222222",
    expiresAt: "2030-01-01T00:00:00.000Z",
  });
  return `${getGuestSessionCookieName()}=${session.token}`;
}

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    signingSecret,
    getUserId: vi.fn().mockResolvedValue("user-1"),
    hasRequiredConsent: vi.fn().mockResolvedValue(true),
    createReading: vi.fn().mockResolvedValue({
      id: "reading-1",
      status: "completed",
      result: { title: "무료 리딩" },
    }),
    ...overrides,
  };
}

describe("createReadingPostHandler", () => {
  it("creates a user-owned free reading from server-derived inputs", async () => {
    const deps = dependencies();
    const response = await createReadingPostHandler(deps)(request(tarotBody));

    expect(response.status).toBe(200);
    expect(deps.createReading).toHaveBeenCalledWith(expect.objectContaining({
      owner: { userId: "user-1" },
      requestId,
      kind: "tarot",
      inputHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      ipHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      generationInput: expect.objectContaining({ tier: "free" }),
    }));
  });

  it("returns only the public reading fields", async () => {
    const deps = dependencies({
      createReading: vi.fn().mockResolvedValue({
        id: "reading-1",
        owner: { userId: "user-1" },
        requestId,
        inputHash: "private-input-hash",
        kind: "tarot",
        tier: "free",
        status: "completed",
        input: { kind: "tarot" },
        result: { title: "Public result" },
        generation: {
          id: "generation-1",
          provider: "openai",
          model: "internal-model",
          promptVersion: "internal-prompt",
          status: "completed",
        },
        createdAt: "2026-06-12T00:00:00.000Z",
        updatedAt: "2026-06-12T00:00:01.000Z",
      }),
    });

    const response = await createReadingPostHandler(deps)(request(tarotBody));
    const body = await response.json();

    expect(body.reading).toEqual({
      id: "reading-1",
      kind: "tarot",
      status: "completed",
      input: { kind: "tarot" },
      result: { title: "Public result" },
      createdAt: "2026-06-12T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:01.000Z",
    });
    expect(body.reading).not.toHaveProperty("owner");
    expect(body.reading).not.toHaveProperty("requestId");
    expect(body.reading).not.toHaveProperty("inputHash");
    expect(body.reading).not.toHaveProperty("generation");
  });

  it("uses only a verified signed guest cookie for guest ownership", async () => {
    const deps = dependencies({
      getUserId: vi.fn().mockResolvedValue(null),
    });
    const response = await createReadingPostHandler(deps)(
      request(tarotBody, guestCookie()),
    );

    expect(response.status).toBe(200);
    expect(deps.createReading).toHaveBeenCalledWith(expect.objectContaining({
      owner: { guestSessionId: "22222222-2222-4222-8222-222222222222" },
    }));
  });

  it("rejects a guest request with only a legacy cookie name", async () => {
    const session = createSignedGuestSession({
      secret: signingSecret,
      sessionId: "22222222-2222-4222-8222-222222222222",
      expiresAt: "2030-01-01T00:00:00.000Z",
    });
    const deps = dependencies({
      getUserId: vi.fn().mockResolvedValue(null),
    });

    const response = await createReadingPostHandler(deps)(
      request(tarotBody, `legacy_guest=${session.token}`),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(deps.createReading).not.toHaveBeenCalled();
  });

  it("rejects a guest without a valid signed cookie", async () => {
    const deps = dependencies({
      getUserId: vi.fn().mockResolvedValue(null),
    });
    const response = await createReadingPostHandler(deps)(
      request(tarotBody, `${getGuestSessionCookieName()}=tampered`),
    );

    expect(response.status).toBe(401);
    expect(deps.createReading).not.toHaveBeenCalled();
  });

  it("blocks generation until required consent exists", async () => {
    const deps = dependencies({
      hasRequiredConsent: vi.fn().mockResolvedValue(false),
    });
    const response = await createReadingPostHandler(deps)(request(tarotBody));

    expect(response.status).toBe(403);
    expect(deps.createReading).not.toHaveBeenCalled();
  });

  it.each([
    ["IDEMPOTENCY_CONFLICT", 409],
    ["FREE_READING_QUOTA_EXCEEDED", 429],
    ["GENERATION_FAILED", 502],
  ])("maps %s without exposing internal errors", async (code, status) => {
    const deps = dependencies({
      createReading: vi.fn().mockRejectedValue(
        Object.assign(new Error("provider secret details"), { code }),
      ),
    });
    const response = await createReadingPostHandler(deps)(request(tarotBody));
    const body = await response.json();

    expect(response.status).toBe(status);
    expect(body).toHaveProperty("code");
    expect(body.message).not.toContain("provider secret details");
  });

  it.each([
    [new FreeReadingIdempotencyConflictError(), 409],
    [new FreeReadingGenerationInProgressError(), 409],
    [new FreeReadingGenerationError("generation_timeout"), 502],
    [Object.assign(new Error("provider detail"), { code: "OPENAI_READING_TIMEOUT" }), 502],
  ])("maps domain errors to their public status", async (error, status) => {
    const deps = dependencies({
      createReading: vi.fn().mockRejectedValue(error),
    });

    const response = await createReadingPostHandler(deps)(request(tarotBody));

    expect(response.status).toBe(status);
  });

  it("rejects client-controlled paid generation fields", async () => {
    const deps = dependencies();
    const response = await createReadingPostHandler(deps)(
      request({ ...tarotBody, tier: "paid" }),
    );

    expect(response.status).toBe(400);
    expect(deps.createReading).not.toHaveBeenCalled();
  });
});
