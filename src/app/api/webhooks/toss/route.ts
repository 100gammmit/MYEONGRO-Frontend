import { PaymentWebhookService } from "@/domain/payments/payment-webhook-service";
import { createAdminSupabaseClient } from "@/infrastructure/supabase/admin-client";
import { SupabasePaymentWebhookRepository } from "@/infrastructure/supabase/payment-webhook-repository";
import { createTossWebhookPostHandler } from "./handler";

export async function POST(request: Request) {
  const service = new PaymentWebhookService(
    new SupabasePaymentWebhookRepository(createAdminSupabaseClient()),
  );
  return createTossWebhookPostHandler({
    handle: (input) => service.handle(input),
  })(request);
}
