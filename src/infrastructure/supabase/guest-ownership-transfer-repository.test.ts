import { describe, expect, it, vi } from "vitest";

import { SupabaseGuestOwnershipTransferRepository } from "./guest-ownership-transfer-repository";

describe("SupabaseGuestOwnershipTransferRepository", () => {
  it("calls the RPC with the guest id and requested user id, then verifies the returned owner", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{
        guest_session_id: "guest-1",
        user_id: "user-1",
        transferred_reading_count: 2,
        transferred_consent_count: 3,
        already_transferred: false,
      }],
      error: null,
    });
    const repository = new SupabaseGuestOwnershipTransferRepository({ rpc } as never);

    await expect(repository.transferGuestOwnership("guest-1", "user-1")).resolves.toEqual({
      guestSessionId: "guest-1",
      userId: "user-1",
      transferredReadingCount: 2,
      transferredConsentCount: 3,
      alreadyTransferred: false,
    });

    expect(rpc).toHaveBeenCalledWith("transfer_guest_ownership", {
      requested_guest_session_id: "guest-1",
      requested_user_id: "user-1",
    });
  });

  it("rejects an RPC response that points at another owner", async () => {
    const repository = new SupabaseGuestOwnershipTransferRepository({
      rpc: vi.fn().mockResolvedValue({
        data: [{
          guest_session_id: "guest-1",
          user_id: "user-2",
          transferred_reading_count: 0,
          transferred_consent_count: 0,
          already_transferred: true,
        }],
        error: null,
      }),
    } as never);

    await expect(repository.transferGuestOwnership("guest-1", "user-1")).rejects.toThrow(
      "Guest transfer returned an unexpected owner",
    );
  });
});
