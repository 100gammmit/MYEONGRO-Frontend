// @vitest-environment node
import { dailyCardShareId } from "@/domain/daily-card-free/share-ids.server";

import { POST } from "./route";

function request(body: string) {
  return new Request("http://localhost/api/tarot/daily-card-shares", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("POST /api/tarot/daily-card-shares", () => {
  it("returns the fixed share path for a drawn card", async () => {
    const response = await POST(request(JSON.stringify({ cardId: "major-17-star", variantIndex: 2 })));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ path: `/tarot/daily/${dailyCardShareId("major-17-star", 2)}` });
  });

  it.each([
    ["an unknown card", JSON.stringify({ cardId: "major-99-none", variantIndex: 0 })],
    ["an out-of-range variant", JSON.stringify({ cardId: "major-17-star", variantIndex: 6 })],
    ["a missing field", JSON.stringify({ cardId: "major-17-star" })],
    ["an extra field", JSON.stringify({ cardId: "major-17-star", variantIndex: 0, dateKst: "2026-11-27" })],
    ["a body that is not JSON", "not json"],
  ])("rejects %s", async (_, body) => {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
    expect(await response.json()).not.toHaveProperty("path");
  });
});
