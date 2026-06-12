import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  GuestOwnershipTransferRepository,
  GuestOwnershipTransferResult,
} from "@/domain/consent/guest-ownership-transfer-service";

export class SupabaseGuestOwnershipTransferRepository
implements GuestOwnershipTransferRepository {
  constructor(private readonly client: SupabaseClient) {}

  async transferGuestOwnership(
    guestSessionId: string,
    userId: string,
  ): Promise<GuestOwnershipTransferResult> {
    const { data, error } = await this.client.rpc("transfer_guest_ownership", {
      requested_guest_session_id: guestSessionId,
      requested_user_id: userId,
    });
    if (error) throw new Error(`Failed to transfer guest ownership: ${error.message}`);
    const result = Array.isArray(data) ? data[0] : data;
    if (!result || result.user_id !== userId) {
      throw new Error("Guest transfer returned an unexpected owner");
    }
    return {
      guestSessionId: result.guest_session_id,
      userId: result.user_id,
      transferredReadingCount: result.transferred_reading_count,
      transferredConsentCount: result.transferred_consent_count,
      alreadyTransferred: result.already_transferred,
    };
  }
}
