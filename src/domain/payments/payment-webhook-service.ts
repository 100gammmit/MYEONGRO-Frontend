export interface PaymentWebhookEvent {
  eventId: string;
  eventType: string;
  orderId: string;
  paymentKey: string;
  status: string;
  payload: unknown;
}

export interface PaymentWebhookRepository {
  recordPaidEvent(input: {
    eventId: string;
    eventType: string;
    orderId: string;
    paymentKey: string;
    payload: unknown;
  }): Promise<boolean>;
}

export class PaymentWebhookService {
  constructor(private readonly repository: PaymentWebhookRepository) {}

  async handle(event: PaymentWebhookEvent): Promise<{ duplicate: boolean }> {
    if (event.status !== "DONE") {
      throw new Error(`Unsupported payment webhook status: ${event.status}`);
    }

    const recorded = await this.repository.recordPaidEvent({
      eventId: event.eventId,
      eventType: event.eventType,
      orderId: event.orderId,
      paymentKey: event.paymentKey,
      payload: event.payload,
    });
    return { duplicate: !recorded };
  }
}
