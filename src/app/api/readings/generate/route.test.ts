import { POST } from "./route";

describe("POST /api/readings/generate", () => {
  it("rejects the legacy generation path", async () => {
    const response = await POST();

    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({
      code: "READING_GENERATE_ROUTE_GONE",
      message: "POST /api/readings를 사용해 주세요.",
    });
  });
});
