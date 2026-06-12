import { describe, expect, it } from "vitest";

import {
  GuestOwnershipTransferService,
  type GuestOwnershipTransferRepository,
  type GuestOwnershipTransferResult,
} from "./guest-ownership-transfer-service";

class MemoryTransferRepository implements GuestOwnershipTransferRepository {
  calls = 0;
  private transfers = new Map<string, GuestOwnershipTransferResult>();

  async transferGuestOwnership(guestSessionId: string, userId: string) {
    this.calls += 1;
    const key = `${guestSessionId}:${userId}`;
    const existing = this.transfers.get(key);
    if (existing) return { ...existing, alreadyTransferred: true };

    const result = {
      guestSessionId,
      userId,
      transferredReadingCount: 2,
      transferredConsentCount: 3,
      alreadyTransferred: false,
    };
    this.transfers.set(key, result);
    return result;
  }
}

describe("GuestOwnershipTransferService", () => {
  it("delegates an atomic ownership transfer to the injected repository", async () => {
    const repository = new MemoryTransferRepository();
    const service = new GuestOwnershipTransferService(repository);

    await expect(service.transfer("guest-1", "user-1")).resolves.toMatchObject({
      transferredReadingCount: 2,
      transferredConsentCount: 3,
      alreadyTransferred: false,
    });
  });

  it("is idempotent when the same guest is transferred to the same user twice", async () => {
    const repository = new MemoryTransferRepository();
    const service = new GuestOwnershipTransferService(repository);

    await service.transfer("guest-1", "user-1");
    const duplicate = await service.transfer("guest-1", "user-1");

    expect(duplicate.alreadyTransferred).toBe(true);
  });
});
