import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ConfirmedPayment,
  PaymentConfirmationClaim,
  PaymentRepository,
  Purchase,
} from "@/domain/payments/payment-service";

interface PurchaseRow {
  id: string;
  reading_id: string;
  user_id: string;
  order_id: string;
  payment_key: string | null;
  amount: number;
  status: Purchase["status"];
}

function toPurchase(row: PurchaseRow): Purchase {
  if (row.amount !== 3900) throw new Error("Stored purchase has an invalid amount");
  return {
    id: row.id,
    readingId: row.reading_id,
    userId: row.user_id,
    orderId: row.order_id,
    paymentKey: row.payment_key ?? undefined,
    amount: 3900,
    status: row.status,
  };
}

export class SupabasePaymentRepository implements PaymentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getReadingOwner(readingId: string): Promise<string | null> {
    const { data, error } = await this.client
      .from("readings")
      .select("user_id")
      .eq("id", readingId)
      .maybeSingle();
    if (error) throw new Error(`Failed to read reading owner: ${error.message}`);
    return data?.user_id ?? null;
  }

  async getPurchaseByOrderId(orderId: string): Promise<Purchase | null> {
    const { data, error } = await this.client
      .from("purchases")
      .select("id,reading_id,user_id,order_id,payment_key,amount,status")
      .eq("order_id", orderId)
      .maybeSingle();
    if (error) throw new Error(`Failed to read purchase: ${error.message}`);
    return data ? toPurchase(data as PurchaseRow) : null;
  }

  async createPendingPurchase(purchase: Purchase): Promise<Purchase> {
    const { data, error } = await this.client
      .from("purchases")
      .insert({
        id: purchase.id,
        reading_id: purchase.readingId,
        user_id: purchase.userId,
        order_id: purchase.orderId,
        amount: purchase.amount,
        status: purchase.status,
      })
      .select("id,reading_id,user_id,order_id,payment_key,amount,status")
      .single();
    if (error) throw new Error(`Failed to create purchase: ${error.message}`);
    return toPurchase(data as PurchaseRow);
  }

  async claimPaymentConfirmation(input: {
    paymentKey: string;
    orderId: string;
    readingId: string;
    userId: string;
    amount: number;
  }): Promise<PaymentConfirmationClaim> {
    const { data, error } = await this.client.rpc("claim_payment_confirmation", {
      requested_order_id: input.orderId,
      requested_payment_key: input.paymentKey,
      requested_reading_id: input.readingId,
      requested_user_id: input.userId,
      requested_amount: input.amount,
    });
    if (error) throw new Error(`Failed to claim payment confirmation: ${error.message}`);
    const result = Array.isArray(data) ? data[0] : data;
    if (!result) throw new Error("Payment confirmation claim returned no result");
    return {
      state: result.claim_state,
      purchase: toPurchase(result as PurchaseRow),
    };
  }

  async completePaymentConfirmation(
    orderId: string,
    payment: ConfirmedPayment,
  ): Promise<Purchase> {
    const { data, error } = await this.client.rpc("complete_payment_confirmation", {
      requested_order_id: orderId,
      requested_payment_key: payment.paymentKey,
      requested_approved_at: payment.approvedAt,
    });
    if (error) throw new Error(`Failed to complete payment confirmation: ${error.message}`);
    const result = Array.isArray(data) ? data[0] : data;
    if (!result) throw new Error("Payment completion returned no purchase");
    return toPurchase(result as PurchaseRow);
  }

  async releasePaymentConfirmation(orderId: string, paymentKey: string): Promise<void> {
    const { error } = await this.client.rpc("release_payment_confirmation", {
      requested_order_id: orderId,
      requested_payment_key: paymentKey,
    });
    if (error) throw new Error(`Failed to release payment confirmation: ${error.message}`);
  }
}
