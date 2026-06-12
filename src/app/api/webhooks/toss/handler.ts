import { z } from "zod";

const payloadSchema = z.object({
  eventType: z.literal("PAYMENT_STATUS_CHANGED"),
  createdAt: z.string().min(1),
  data: z.object({
    orderId: z.string().min(1),
    paymentKey: z.string().min(1),
    status: z.string().min(1),
  }),
});

export interface TossWebhookRouteDependencies {
  handle(input: {
    eventId: string;
    eventType: string;
    orderId: string;
    paymentKey: string;
    status: string;
    payload: unknown;
  }): Promise<{ duplicate: boolean }>;
}

export function createTossWebhookPostHandler(
  dependencies: TossWebhookRouteDependencies,
) {
  return async function POST(request: Request): Promise<Response> {
    const rawBody = await request.text();
    const transmissionId = request.headers.get(
      "tosspayments-webhook-transmission-id",
    )?.trim();

    if (!transmissionId) {
      return Response.json(
        { error: "Missing Toss webhook transmission id" },
        { status: 400 },
      );
    }

    try {
      const payload = payloadSchema.parse(JSON.parse(rawBody));

      if (payload.data.status !== "DONE") {
        return Response.json({ ignored: true });
      }

      const result = await dependencies.handle({
        eventId: transmissionId,
        eventType: payload.eventType,
        orderId: payload.data.orderId,
        paymentKey: payload.data.paymentKey,
        status: payload.data.status,
        payload,
      });
      return Response.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid webhook";
      return Response.json({ error: message }, { status: 400 });
    }
  };
}
