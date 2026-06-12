import { describe, expect, it } from "vitest";

import {
  PaymentWebhookService,
  type PaymentWebhookRepository,
} from "./payment-webhook-service";

class MemoryWebhookRepository implements PaymentWebhookRepository {
  events = new Set<string>();
  paidOrders: string[] = [];

  async recordPaidEvent(input: {
    eventId: string;
    eventType: string;
    orderId: string;
    paymentKey: string;
    payload: unknown;
  }) {
    if (this.events.has(input.eventId)) return false;
    this.events.add(input.eventId);
    this.paidOrders.push(input.orderId);
    return true;
  }
}

describe("PaymentWebhookService", () => {
  it("records a paid webhook only once when Toss retries the event", async () => {
    const repository = new MemoryWebhookRepository();
    const service = new PaymentWebhookService(repository);
    const event = {
      eventId: "event-1",
      eventType: "PAYMENT_STATUS_CHANGED",
      orderId: "order-1",
      paymentKey: "payment-1",
      status: "DONE",
      payload: { source: "test" },
    };

    expect(await service.handle(event)).toEqual({ duplicate: false });
    expect(await service.handle(event)).toEqual({ duplicate: true });
    expect(repository.paidOrders).toEqual(["order-1"]);
  });
});
