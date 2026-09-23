import { describe, expect, it } from "vitest";

import { deriveDailyCardUserScope } from "./account-scope.server";

describe("deriveDailyCardUserScope", () => {
  it("returns a deterministic lowercase SHA-256 scope without the raw user id", () => {
    const userId = "11111111-1111-4111-8111-111111111111";

    const first = deriveDailyCardUserScope(userId);
    const second = deriveDailyCardUserScope(userId);

    expect(first).toBe(second);
    expect(first).toMatch(/^user:[0-9a-f]{64}$/);
    expect(first).not.toContain(userId);
    expect(deriveDailyCardUserScope("22222222-2222-4222-8222-222222222222"))
      .not.toBe(first);
  });
});
