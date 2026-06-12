import type {
  ConfirmedPayment,
  PaymentGateway,
} from "@/domain/payments/payment-service";

const TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

export class TossHttpGateway implements PaymentGateway {
  constructor(
    private readonly secretKey: string,
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {
    if (!secretKey.trim()) throw new Error("Toss secret key is required");
  }

  async confirm(input: {
    paymentKey: string;
    orderId: string;
    amount: number;
    idempotencyKey: string;
  }): Promise<ConfirmedPayment> {
    const authorization = Buffer.from(`${this.secretKey}:`).toString("base64");
    const response = await this.fetchImplementation(TOSS_CONFIRM_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        paymentKey: input.paymentKey,
        orderId: input.orderId,
        amount: input.amount,
      }),
    });
    const body = await response.json() as {
      paymentKey?: string;
      orderId?: string;
      totalAmount?: number;
      approvedAt?: string;
      code?: string;
      message?: string;
    };

    if (!response.ok) {
      throw new Error(
        `Toss confirmation failed${body.code ? ` (${body.code})` : ""}: ${body.message ?? response.statusText}`,
      );
    }
    if (
      !body.paymentKey
      || !body.orderId
      || typeof body.totalAmount !== "number"
      || !body.approvedAt
    ) {
      throw new Error("Toss confirmation returned an incomplete payment");
    }

    return {
      paymentKey: body.paymentKey,
      orderId: body.orderId,
      amount: body.totalAmount,
      approvedAt: body.approvedAt,
    };
  }
}

export function createTossHttpGateway() {
  const secretKey = process.env.TOSS_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error(
      "Missing required environment variable TOSS_SECRET_KEY. Configure Toss before confirming payments.",
    );
  }
  return new TossHttpGateway(secretKey);
}
