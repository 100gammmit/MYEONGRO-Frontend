import { describe, expect, it, vi } from "vitest";

import { fetchAnnualDetailLevel } from "./saju-detail-level-client";

const REQUEST = {
  birthProfile: {
    calendarType: "solar" as const,
    birthDate: "1992-08-17",
    birthTimePrecision: "unknown" as const,
    luckDirectionBasis: "unspecified" as const,
  },
};

describe("fetchAnnualDetailLevel", () => {
  it("posts the birth input and reads the format and its price", async () => {
    const fetcher = vi.fn(async () => Response.json({ detailLevel: "brief", creditCost: 4 }));
    await expect(fetchAnnualDetailLevel(REQUEST, undefined, fetcher)).resolves.toEqual({
      kind: "ok", detailLevel: "brief", creditCost: 4,
    });
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/saju/readings/detail-level");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(REQUEST);
  });

  it("separates a signed-out answer from every other failure", async () => {
    expect(await fetchAnnualDetailLevel(REQUEST, undefined, async () => new Response(null, { status: 401 })))
      .toEqual({ kind: "unauthenticated" });
    for (const answer of [
      async () => Response.json({ code: "SAJU_DETAIL_LEVEL_BUSY" }, { status: 503 }),
      async () => Response.json({ detailLevel: "full", creditCost: 0 }),
      async () => Response.json({ detailLevel: "full", creditCost: 6, extra: true }),
      async () => { throw new TypeError("network"); },
    ]) {
      expect(await fetchAnnualDetailLevel(REQUEST, undefined, answer)).toEqual({ kind: "failed" });
    }
  });
});
