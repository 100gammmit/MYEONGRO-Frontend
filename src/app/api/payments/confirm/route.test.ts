import { describe, expect, it, vi } from "vitest";

import { createPaymentConfirmPostHandler } from "./handler";

describe("POST /api/payments/confirm", () => {
  it("uses the authenticated user and returns processing for a duplicate in flight", async () => {
    const confirm = vi.fn().mockResolvedValue({ status: "confirming" });
    const post = createPaymentConfirmPostHandler({
      getUserId: async () => "user-1",
      confirm,
    });

    const response = await post(new Request("http://localhost/api/payments/confirm", {
      method: "POST",
      body: JSON.stringify({
        paymentKey: "payment-1",
        orderId: "order-1",
        readingId: "f0378d37-f591-491d-8e56-20cc6d7d114f",
        amount: 3900,
      }),
    }));

    expect(response.status).toBe(202);
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1" }));
  });
});
