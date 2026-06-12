import { PaymentService } from "@/domain/payments/payment-service";
import { createTossHttpGateway } from "@/infrastructure/payments/toss-http-gateway";
import { createAdminSupabaseClient } from "@/infrastructure/supabase/admin-client";
import { getAuthenticatedUserId } from "@/infrastructure/supabase/auth";
import { SupabasePaymentRepository } from "@/infrastructure/supabase/payment-repository";
import { createPaymentConfirmPostHandler } from "./handler";

export async function POST(request: Request) {
  const service = new PaymentService(
    new SupabasePaymentRepository(createAdminSupabaseClient()),
    createTossHttpGateway(),
  );
  return createPaymentConfirmPostHandler({
    getUserId: getAuthenticatedUserId,
    confirm: (input) => service.confirm(input),
  })(request);
}
