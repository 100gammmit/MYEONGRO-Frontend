import { describe, expect, it, vi } from "vitest";

import { createTossWebhookPostHandler } from "./handler";

const payload = {
  eventType: "PAYMENT_STATUS_CHANGED",
  createdAt: "2026-06-10T12:00:00.000000",
  data: {
    orderId: "order-1",
    paymentKey: "payment-1",
    status: "DONE",
  },
};

describe("POST /api/webhooks/toss", () => {
  it("requires the Toss transmission id header", async () => {
    const handle = vi.fn();
    const post = createTossWebhookPostHandler({
      handle,
    });

    const response = await post(new Request("http://localhost/api/webhooks/toss", {
      method: "POST",
      body: JSON.stringify(payload),
    }));

    expect(response.status).toBe(400);
    expect(handle).not.toHaveBeenCalled();
  });

  it("uses the transmission id and forwards a completed payment", async () => {
    const handle = vi.fn().mockResolvedValue({ duplicate: false });
    const post = createTossWebhookPostHandler({
      handle,
    });

    const response = await post(new Request("http://localhost/api/webhooks/toss", {
      method: "POST",
      headers: {
        "tosspayments-webhook-transmission-id": "transmission-1",
      },
      body: JSON.stringify(payload),
    }));

    expect(response.status).toBe(200);
    expect(handle).toHaveBeenCalledWith({
      eventId: "transmission-1",
      eventType: "PAYMENT_STATUS_CHANGED",
      orderId: "order-1",
      paymentKey: "payment-1",
      status: "DONE",
      payload,
    });
  });

  it("acknowledges non-DONE statuses without marking a purchase as paid", async () => {
    const handle = vi.fn();
    const post = createTossWebhookPostHandler({ handle });
    const expiredPayload = {
      ...payload,
      data: {
        ...payload.data,
        status: "EXPIRED",
      },
    };

    const response = await post(new Request("http://localhost/api/webhooks/toss", {
      method: "POST",
      headers: {
        "tosspayments-webhook-transmission-id": "transmission-2",
      },
      body: JSON.stringify(expiredPayload),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ignored: true });
    expect(handle).not.toHaveBeenCalled();
  });
});
