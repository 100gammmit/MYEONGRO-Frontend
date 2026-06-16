import { POST } from "./route";

describe("POST /api/readings/generate", () => {
  it("rejects the legacy generation path", async () => {
    const response = await POST();

    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({
      error: "Use POST /api/readings.",
    });
  });
});
