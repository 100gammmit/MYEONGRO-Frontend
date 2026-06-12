import { describe, expect, it } from "vitest";

import { hashReadingInput, hashRequestIp } from "./reading-hash";

const secret = "a-secure-signing-secret-that-is-at-least-32-bytes";

describe("hashReadingInput", () => {
  it("produces the same digest regardless of object key order", () => {
    expect(hashReadingInput({ question: "질문", cards: ["a", "b", "c"] }))
      .toBe(hashReadingInput({ cards: ["a", "b", "c"], question: "질문" }));
  });

  it("changes when nested input changes", () => {
    expect(hashReadingInput({ profile: { birthDate: "2000-01-01" } }))
      .not.toBe(hashReadingInput({ profile: { birthDate: "2000-01-02" } }));
  });
});

describe("hashRequestIp", () => {
  it("stores a stable HMAC without exposing the raw forwarded IP", () => {
    const request = new Request("https://fortune.test/api/readings", {
      headers: { "x-forwarded-for": "203.0.113.8, 10.0.0.1" },
    });

    const result = hashRequestIp(request, secret);

    expect(result).toMatch(/^[a-f0-9]{64}$/);
    expect(result).not.toContain("203.0.113.8");
    expect(hashRequestIp(request, secret)).toBe(result);
  });

  it("uses a non-empty anonymous value when no IP header exists", () => {
    expect(hashRequestIp(
      new Request("https://fortune.test/api/readings"),
      secret,
    )).toMatch(/^[a-f0-9]{64}$/);
  });
});
