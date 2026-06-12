import { describe, expect, it } from "vitest";

import {
  PAID_READING_AMOUNT_KRW,
  PaymentService,
  type ConfirmedPayment,
  type PaymentGateway,
  type PaymentRepository,
  type Purchase,
} from "./payment-service";

class MemoryPaymentRepository implements PaymentRepository {
  purchases = new Map<string, Purchase>();
  readingOwners = new Map([["reading-1", "user-1"]]);

  async getReadingOwner(readingId: string) {
    return this.readingOwners.get(readingId) ?? null;
  }

  async getPurchaseByOrderId(orderId: string) {
    return this.purchases.get(orderId) ?? null;
  }

  async createPendingPurchase(purchase: Purchase) {
    this.purchases.set(purchase.orderId, purchase);
    return purchase;
  }

  async claimPaymentConfirmation(input: {
    orderId: string;
    paymentKey: string;
    readingId: string;
    userId: string;
    amount: number;
  }) {
    const purchase = this.purchases.get(input.orderId);
    if (!purchase) throw new Error("Payment order not found");
    if (purchase.status === "paid") return { state: "paid" as const, purchase };
    if (purchase.status === "confirming") return { state: "processing" as const, purchase };
    const claimed = {
      ...purchase,
      status: "confirming" as const,
      paymentKey: input.paymentKey,
    };
    this.purchases.set(input.orderId, claimed);
    return { state: "claimed" as const, purchase: claimed };
  }

  async completePaymentConfirmation(orderId: string, payment: ConfirmedPayment) {
    const purchase = this.purchases.get(orderId);
    if (!purchase) throw new Error("Purchase not found");
    const paid = { ...purchase, status: "paid" as const, paymentKey: payment.paymentKey };
    this.purchases.set(orderId, paid);
    return paid;
  }

  async releasePaymentConfirmation(orderId: string, paymentKey: string) {
    const purchase = this.purchases.get(orderId);
    if (purchase?.status === "confirming" && purchase.paymentKey === paymentKey) {
      this.purchases.set(orderId, {
        ...purchase,
        status: "pending",
        paymentKey: undefined,
      });
    }
  }
}

class FakeGateway implements PaymentGateway {
  calls = 0;

  idempotencyKeys: string[] = [];

  async confirm(input: {
    paymentKey: string;
    orderId: string;
    amount: number;
    idempotencyKey: string;
  }) {
    this.calls += 1;
    this.idempotencyKeys.push(input.idempotencyKey);
    return { ...input, approvedAt: "2026-06-10T12:00:00.000Z" };
  }
}

describe("PaymentService", () => {
  it("creates a 3900 KRW order for a reading owned by the user", async () => {
    const repository = new MemoryPaymentRepository();
    const service = new PaymentService(repository, new FakeGateway());

    const purchase = await service.createOrder({
      orderId: "order-1",
      readingId: "reading-1",
      userId: "user-1",
      amount: PAID_READING_AMOUNT_KRW,
    });

    expect(purchase).toMatchObject({ amount: 3900, status: "pending" });
  });

  it("rejects the wrong amount and reading owner", async () => {
    const service = new PaymentService(new MemoryPaymentRepository(), new FakeGateway());

    await expect(service.createOrder({
      orderId: "order-1",
      readingId: "reading-1",
      userId: "user-1",
      amount: 4000,
    })).rejects.toThrow("Payment amount must be 3900 KRW");

    await expect(service.createOrder({
      orderId: "order-2",
      readingId: "reading-1",
      userId: "user-2",
      amount: 3900,
    })).rejects.toThrow("Reading is not owned by this user");
  });

  it("validates confirmation against the stored order", async () => {
    const repository = new MemoryPaymentRepository();
    const service = new PaymentService(repository, new FakeGateway());
    await service.createOrder({
      orderId: "order-1",
      readingId: "reading-1",
      userId: "user-1",
      amount: 3900,
    });

    await expect(service.confirm({
      paymentKey: "payment-1",
      orderId: "order-1",
      readingId: "reading-other",
      userId: "user-1",
      amount: 3900,
    })).rejects.toThrow("Payment confirmation does not match the order");
  });

  it("confirms through Toss only once for duplicate confirmations", async () => {
    const repository = new MemoryPaymentRepository();
    const gateway = new FakeGateway();
    const service = new PaymentService(repository, gateway);
    await service.createOrder({
      orderId: "order-1",
      readingId: "reading-1",
      userId: "user-1",
      amount: 3900,
    });

    const first = await service.confirm({
      paymentKey: "payment-1",
      orderId: "order-1",
      readingId: "reading-1",
      userId: "user-1",
      amount: 3900,
    });
    const duplicate = await service.confirm({
      paymentKey: "payment-1",
      orderId: "order-1",
      readingId: "reading-1",
      userId: "user-1",
      amount: 3900,
    });

    expect(first.status).toBe("paid");
    expect(duplicate).toEqual(first);
    expect(gateway.calls).toBe(1);
    expect(gateway.idempotencyKeys).toEqual(["confirm:order-1:payment-1"]);
  });

  it("atomically claims a confirmation so concurrent requests call Toss once", async () => {
    const repository = new MemoryPaymentRepository();
    let releaseGateway!: () => void;
    const gatewayStarted = new Promise<void>((resolve) => {
      releaseGateway = resolve;
    });
    const gateway: PaymentGateway = {
      calls: 0,
      async confirm(input) {
        this.calls += 1;
        await gatewayStarted;
        return { ...input, approvedAt: "2026-06-10T12:00:00.000Z" };
      },
    } as PaymentGateway & { calls: number };
    const service = new PaymentService(repository, gateway);
    await service.createOrder({
      orderId: "order-1",
      readingId: "reading-1",
      userId: "user-1",
      amount: 3900,
    });

    const first = service.confirm({
      paymentKey: "payment-1",
      orderId: "order-1",
      readingId: "reading-1",
      userId: "user-1",
      amount: 3900,
    });
    await Promise.resolve();
    const duplicate = await service.confirm({
      paymentKey: "payment-1",
      orderId: "order-1",
      readingId: "reading-1",
      userId: "user-1",
      amount: 3900,
    });
    releaseGateway();
    await first;

    expect(duplicate.status).toBe("confirming");
    expect((gateway as PaymentGateway & { calls: number }).calls).toBe(1);
  });
});
