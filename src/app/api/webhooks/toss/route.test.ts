import { POST } from "./route";

describe("POST /api/webhooks/toss", () => {
  it("keeps Toss webhooks unavailable for the free MVP", async () => {
    const response = await POST();

    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({
      error: "결제 기능은 준비 중입니다.",
    });
  });
});
