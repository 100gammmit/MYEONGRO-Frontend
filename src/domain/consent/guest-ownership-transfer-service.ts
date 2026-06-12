export interface GuestOwnershipTransferResult {
  guestSessionId: string;
  userId: string;
  transferredReadingCount: number;
  transferredConsentCount: number;
  alreadyTransferred: boolean;
}

export interface GuestOwnershipTransferRepository {
  transferGuestOwnership(
    guestSessionId: string,
    userId: string,
  ): Promise<GuestOwnershipTransferResult>;
}

export class GuestOwnershipTransferService {
  constructor(private readonly repository: GuestOwnershipTransferRepository) {}

  transfer(
    guestSessionId: string,
    userId: string,
  ): Promise<GuestOwnershipTransferResult> {
    if (!guestSessionId.trim()) throw new Error("Guest session is required");
    if (!userId.trim()) throw new Error("User is required");
    return this.repository.transferGuestOwnership(guestSessionId, userId);
  }
}
