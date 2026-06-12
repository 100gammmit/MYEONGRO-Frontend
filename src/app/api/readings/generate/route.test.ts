import { POST } from "./route";

describe("POST /api/readings/generate", () => {
  it.each(["free", "paid", "followup"])(
    "rejects the legacy %s generation path",
    async (tier) => {
      void tier;
      const response = await POST();

      expect(response.status).toBe(410);
      expect(await response.json()).toEqual({
        error: "Use POST /api/readings.",
      });
    },
  );
});
