export const PAID_READING_AMOUNT_KRW = 3900 as const;

export type PurchaseStatus = "pending" | "confirming" | "paid" | "cancelled" | "failed";

export interface Purchase {
  id: string;
  readingId: string;
  userId: string;
  orderId: string;
  paymentKey?: string;
  amount: typeof PAID_READING_AMOUNT_KRW;
  status: PurchaseStatus;
}

export interface ConfirmedPayment {
  paymentKey: string;
  orderId: string;
  amount: number;
  approvedAt: string;
}

export interface PaymentGateway {
  confirm(input: {
    paymentKey: string;
    orderId: string;
    amount: number;
    idempotencyKey: string;
  }): Promise<ConfirmedPayment>;
}

export interface PaymentConfirmationClaim {
  state: "claimed" | "processing" | "paid";
  purchase: Purchase;
}

export interface PaymentRepository {
  getReadingOwner(readingId: string): Promise<string | null>;
  getPurchaseByOrderId(orderId: string): Promise<Purchase | null>;
  createPendingPurchase(purchase: Purchase): Promise<Purchase>;
  claimPaymentConfirmation(input: {
    paymentKey: string;
    orderId: string;
    readingId: string;
    userId: string;
    amount: number;
  }): Promise<PaymentConfirmationClaim>;
  completePaymentConfirmation(orderId: string, payment: ConfirmedPayment): Promise<Purchase>;
  releasePaymentConfirmation(orderId: string, paymentKey: string): Promise<void>;
}

export class PaymentService {
  constructor(
    private readonly repository: PaymentRepository,
    private readonly gateway: PaymentGateway,
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  async createOrder(input: {
    orderId: string;
    readingId: string;
    userId: string;
    amount: number;
  }): Promise<Purchase> {
    this.validateAmount(input.amount);
    const ownerId = await this.repository.getReadingOwner(input.readingId);
    if (ownerId !== input.userId) {
      throw new Error("Reading is not owned by this user");
    }

    const existing = await this.repository.getPurchaseByOrderId(input.orderId);
    if (existing) {
      this.assertOrderMatches(existing, input);
      return existing;
    }

    return this.repository.createPendingPurchase({
      id: this.createId(),
      readingId: input.readingId,
      userId: input.userId,
      orderId: input.orderId,
      amount: PAID_READING_AMOUNT_KRW,
      status: "pending",
    });
  }

  async confirm(input: {
    paymentKey: string;
    orderId: string;
    readingId: string;
    userId: string;
    amount: number;
  }): Promise<Purchase> {
    this.validateAmount(input.amount);
    const purchase = await this.repository.getPurchaseByOrderId(input.orderId);
    if (!purchase) throw new Error("Payment order not found");
    this.assertOrderMatches(purchase, input);
    const claim = await this.repository.claimPaymentConfirmation(input);
    if (claim.state !== "claimed") return claim.purchase;

    try {
      const payment = await this.gateway.confirm({
        paymentKey: input.paymentKey,
        orderId: input.orderId,
        amount: input.amount,
        idempotencyKey: `confirm:${input.orderId}:${input.paymentKey}`,
      });
      if (
        payment.paymentKey !== input.paymentKey
        || payment.orderId !== input.orderId
        || payment.amount !== input.amount
      ) {
        throw new Error("Payment gateway confirmation mismatch");
      }
      return await this.repository.completePaymentConfirmation(input.orderId, payment);
    } catch (error) {
      await this.repository.releasePaymentConfirmation(input.orderId, input.paymentKey);
      throw error;
    }
  }

  private validateAmount(amount: number): void {
    if (amount !== PAID_READING_AMOUNT_KRW) {
      throw new Error("Payment amount must be 3900 KRW");
    }
  }

  private assertOrderMatches(
    purchase: Purchase,
    input: { readingId: string; userId: string; amount: number },
  ): void {
    if (
      purchase.readingId !== input.readingId
      || purchase.userId !== input.userId
      || purchase.amount !== input.amount
    ) {
      throw new Error("Payment confirmation does not match the order");
    }
  }
}
