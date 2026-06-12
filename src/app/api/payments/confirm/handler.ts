import { z } from "zod";

const inputSchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().min(1),
  readingId: z.string().uuid(),
  amount: z.number().int(),
});

export interface PaymentConfirmRouteDependencies {
  getUserId(): Promise<string | null>;
  confirm(input: {
    paymentKey: string;
    orderId: string;
    readingId: string;
    userId: string;
    amount: number;
  }): Promise<{ status: string }>;
}

export function createPaymentConfirmPostHandler(
  dependencies: PaymentConfirmRouteDependencies,
) {
  return async function POST(request: Request): Promise<Response> {
    const userId = await dependencies.getUserId();
    if (!userId) return Response.json({ error: "Authentication required" }, { status: 401 });
    try {
      const input = inputSchema.parse(await request.json());
      const purchase = await dependencies.confirm({ ...input, userId });
      return Response.json(
        { purchase },
        { status: purchase.status === "confirming" ? 202 : 200 },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid payment request";
      return Response.json({ error: message }, { status: 400 });
    }
  };
}
