import type { SupabaseClient } from "@supabase/supabase-js";

import type { PaymentWebhookRepository } from "@/domain/payments/payment-webhook-service";

export class SupabasePaymentWebhookRepository implements PaymentWebhookRepository {
  constructor(private readonly client: SupabaseClient) {}

  async recordPaidEvent(input: {
    eventId: string;
    eventType: string;
    orderId: string;
    paymentKey: string;
    payload: unknown;
  }): Promise<boolean> {
    const { data, error } = await this.client.rpc("record_payment_webhook", {
      requested_event_id: input.eventId,
      requested_event_type: input.eventType,
      requested_order_id: input.orderId,
      requested_payment_key: input.paymentKey,
      requested_payload: input.payload,
    });
    if (error) throw new Error(`Failed to record payment webhook: ${error.message}`);
    return data === true;
  }
}
